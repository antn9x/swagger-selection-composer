import yaml from 'js-yaml';
import { posix } from 'path';
import * as vscode from 'vscode';
import { confirm, methods } from './constants';
import { readFileContent, writeFileContent } from './fileUtils';
import { createApiMethod, createDefaultEnum, createDefaultSchema, Method, MethodOptions } from './schema.tpl';
import { getModuleName, getNameByRouter, getRouterName } from './stringUtils';
import { jsonToYaml } from './yamlUtils';
import sortKeys from 'sort-keys';
import * as fs from 'fs';

export function createApiCommand(context: vscode.ExtensionContext, folderUri: vscode.Uri) {
  let disposable = vscode.commands.registerCommand('swagger-api-generator.createApi', async () => {
    const moduleList = context.workspaceState.get('moduleList', []);
    const module = await vscode.window.showQuickPick(moduleList, {
      placeHolder: 'Select module',
      // onDidSelectItem: item => vscode.window.showInformationMessage(`Focus ${++i}: ${item}`)
    });
    if (!module) {
      return vscode.window.showErrorMessage(`Not module!`);
    }

    const router = await vscode.window.showInputBox({
      value: '',
      // valueSelection: [1, 1],
      placeHolder: 'For example: {id}/reward',
      // validateInput: text => {
      //   vscode.window.showInformationMessage(`Validating: ${text}`);
      //   return text === '123' ? 'Not 123!' : null;
      // }
    }) || '';
    // if (!router) {
    //   return vscode.window.showInformationMessage(`Not router!`);
    // }
    const selectedMethods: MethodOptions[] = [];
    let isExit = false;
    do {
      // const selected = await vscode.window.showQuickPick(methods.filter(m => !selectedMethods.includes(m)), {
      //   placeHolder: 'Select methods',
      //   // onDidSelectItem: item => vscode.window.showInformationMessage(`Focus ${++i}: ${item}`)
      // });

      const selected = await vscode.window.showQuickPick(methods.filter(m => !selectedMethods.some(option => option.method == m)), {
        placeHolder: 'Select methods',
        // onDidSelectItem: item => vscode.window.showInformationMessage(`Focus ${++i}: ${item}`)
      });
      const selectedResponse = await vscode.window.showQuickPick(confirm, {
        placeHolder: 'Do you want to create Response?',
      });

      if (selected && selectedResponse ) {
        const isResponse = selectedResponse === "Yes" ? true : false;
        const option:MethodOptions = {
          method: selected as Method,
          isResponse: isResponse,
        }
        selectedMethods.push(option);
      }
      isExit = !selected || !selectedResponse;
    } while (selectedMethods.length !== methods.length && !isExit);
    if (!selectedMethods.length) {
      return vscode.window.showErrorMessage(`Not methods!`);
    }
    const fileUri = folderUri.with({ path: posix.join(folderUri.path, 'docs', 'api.yaml') });

    const readData = await vscode.workspace.fs.readFile(fileUri);
    const content = Buffer.from(readData).toString('utf8');
    const json: any = content ? yaml.load(content) : {};
    const moduleName = getModuleName(module);
    const routePath = `/${getRouterName(moduleName)}${router ? `/${router}` : ''}`;
    const name = router ? getNameByRouter(routePath) : getRouterName(moduleName);
    json.paths[routePath] = { $ref: `routers/${moduleName}.yaml#/${name}` };
    json.paths = sortKeys(json.paths, {
      compare: (a, b) => json.paths[a].$ref.localeCompare(json.paths[b].$ref)
    });
    const indexStr = jsonToYaml(json);
    const indexData = Buffer.from(indexStr, 'utf8');
    await vscode.workspace.fs.writeFile(fileUri, indexData);

    const moduleFilePath = posix.join(folderUri.path, 'docs', 'routers', `${moduleName}.yaml`);
    const moduleRouter = await readFileContent(moduleFilePath);
    const jsonRouter: any = moduleRouter ? yaml.load(moduleRouter) : {};
    if (!jsonRouter[name]) {
      jsonRouter[name] = {};
    }
    selectedMethods.forEach(method => {
      let check = 0;
      if (method.isResponse && !jsonRouter[name][method.method] ) {
        jsonRouter[name][method.method] = createApiMethod(method.method, moduleName, routePath, method.isResponse);
        check = 1;
      }
      if(!jsonRouter[name][method.method] && check !== 0){
        jsonRouter[name][method.method] = createApiMethod(method.method, moduleName, routePath, method.isResponse);
      }
    });
    await writeFileContent(moduleFilePath, jsonToYaml(jsonRouter));
    // vscode.window.showInformationMessage(readStr);
    vscode.window.showTextDocument(vscode.Uri.file(moduleFilePath));
  });

  context.subscriptions.push(disposable);
}

export function createModelCommand(context: vscode.ExtensionContext, folderUri: vscode.Uri) {
  let disposable = vscode.commands.registerCommand('swagger-api-generator.createModel', async () => {
    const moduleList = context.workspaceState.get('moduleList', []);
    const module = await vscode.window.showQuickPick(moduleList, {
      placeHolder: 'Select module',
      // onDidSelectItem: item => vscode.window.showInformationMessage(`Focus ${++i}: ${item}`)
    });
    if (!module) {
      return vscode.window.showErrorMessage(`Not module!`);
    }

    const model = await vscode.window.showInputBox({
      value: '',
      // valueSelection: [1, 1],
      placeHolder: 'For example: UserProfile',
    });
    if (!model) {
      return vscode.window.showErrorMessage(`Not model name!`);
    }
    const apiFilePath = posix.join(folderUri.path, 'docs', 'api.yaml');
    const content = await readFileContent(apiFilePath);
    const json: any = yaml.load(content);
    if (json.components.schemas[model]) {
      return vscode.window.showErrorMessage(`Model name existed!`);
    }
    json.components.schemas[model] = { $ref: `models/${module}.yaml#/${model}` };
    json.components.schemas = sortKeys(json.components.schemas, {
      compare: (a, b) => json.components.schemas[a].$ref.localeCompare(json.components.schemas[b].$ref)
    });
    const indexStr = jsonToYaml(json);
    await writeFileContent(apiFilePath, indexStr);

    const moduleFilePath = posix.join(folderUri.path, 'docs', 'models', `${module}.yaml`);
    const moduleRouter = await readFileContent(moduleFilePath);
    const jsonModel: any = yaml.load(moduleRouter) || {};
    if (!jsonModel[model]) {
      jsonModel[model] = createDefaultSchema();
    }
    await writeFileContent(moduleFilePath, jsonToYaml(jsonModel));
    // vscode.window.showInformationMessage(readStr);
    vscode.window.showTextDocument(vscode.Uri.file(moduleFilePath));
    vscode.commands.executeCommand('swagger-api-generator.syncPathSchema');
  });

  context.subscriptions.push(disposable);
}

export function createSchemaCommand(context: vscode.ExtensionContext, folderUri: vscode.Uri) {
  let disposable = vscode.commands.registerCommand('swagger-api-generator.createSchema', async () => {
    const schema = await vscode.window.showInputBox({
      value: '',
      placeHolder: 'For example: UserData',
    });
    if (!schema) {
      return vscode.window.showErrorMessage(`Not schema name!`);
    }
    const apiFilePath = posix.join(folderUri.path, 'docs', 'api.yaml');
    const content = await readFileContent(apiFilePath);
    const json: any = yaml.load(content);
    if (json.components.schemas[schema]) {
      return vscode.window.showErrorMessage(`Schema name existed!`);
    }
    json.components.schemas[schema] = { $ref: `schemas.yaml#/${schema}` };
    json.components.schemas = sortKeys(json.components.schemas, {
      compare: (a, b) => json.components.schemas[a].$ref.localeCompare(json.components.schemas[b].$ref)
    });
    const indexStr = jsonToYaml(json);
    await writeFileContent(apiFilePath, indexStr);

    const moduleFilePath = posix.join(folderUri.path, 'docs', 'schemas.yaml');
    const moduleRouter = await readFileContent(moduleFilePath);
    const jsonSchema: any = yaml.load(moduleRouter) || {};
    if (!jsonSchema[schema]) {
      jsonSchema[schema] = createDefaultSchema();
    }
    await writeFileContent(moduleFilePath, jsonToYaml(jsonSchema));
    // vscode.window.showInformationMessage(readStr);
    vscode.window.showTextDocument(vscode.Uri.file(moduleFilePath));
    vscode.commands.executeCommand('swagger-api-generator.syncPathSchema');
  });

  context.subscriptions.push(disposable);
}

export function createObjectCommand(context: vscode.ExtensionContext, folderUri: vscode.Uri) {
  let disposable = vscode.commands.registerCommand('swagger-api-generator.createObject', async () => {
    const obj = await vscode.window.showInputBox({
      value: '',
      placeHolder: 'For example: UserData',
    });
    if (!obj) {
      return vscode.window.showErrorMessage(`Not obj name!`);
    }
    const apiFilePath = posix.join(folderUri.path, 'docs', 'api.yaml');
    const content = await readFileContent(apiFilePath);
    const json: any = yaml.load(content);
    if (json.components.schemas[obj]) {
      return vscode.window.showErrorMessage(`Schema name existed!`);
    }
    json.components.schemas[obj] = { $ref: `objects.yaml#/${obj}` };
    json.components.schemas = sortKeys(json.components.schemas, {
      compare: (a, b) => json.components.schemas[a].$ref.localeCompare(json.components.schemas[b].$ref)
    });
    const indexStr = jsonToYaml(json);
    await writeFileContent(apiFilePath, indexStr);

    const moduleFilePath = posix.join(folderUri.path, 'docs', 'objects.yaml');
    const moduleRouter = await readFileContent(moduleFilePath);
    const jsonSchema: any = yaml.load(moduleRouter) || {};
    if (!jsonSchema[obj]) {
      jsonSchema[obj] = createDefaultSchema();
    }
    await writeFileContent(moduleFilePath, jsonToYaml(jsonSchema));
    // vscode.window.showInformationMessage(readStr);
    vscode.window.showTextDocument(vscode.Uri.file(moduleFilePath));
    vscode.commands.executeCommand('swagger-api-generator.syncPathSchema');
  });

  context.subscriptions.push(disposable);
}

export function createEnumCommand(context: vscode.ExtensionContext, folderUri: vscode.Uri) {
  let disposable = vscode.commands.registerCommand('swagger-api-generator.createEnum', async () => {
    const enumType = await vscode.window.showInputBox({
      value: '',
      placeHolder: 'For example: RoleTypes',
    });
    if (!enumType) {
      return vscode.window.showErrorMessage(`Not enumType name!`);
    }
    const apiFilePath = posix.join(folderUri.fsPath, 'docs', 'api.yaml');
    const content = await readFileContent(apiFilePath);
    const json: any = yaml.load(content);
    if (json.components.schemas[enumType]) {
      return vscode.window.showErrorMessage(`Enum name existed!`);
    }
    json.components.schemas[enumType] = { $ref: `enums.yaml#/${enumType}` };
    json.components.schemas = sortKeys(json.components.schemas, {
      compare: (a, b) => json.components.schemas[a].$ref.localeCompare(json.components.schemas[b].$ref)
    });
    const indexStr = jsonToYaml(json);
    await writeFileContent(apiFilePath, indexStr);

    const moduleFilePath = posix.join(folderUri.fsPath, 'docs', 'enums.yaml');
    const moduleRouter = await readFileContent(moduleFilePath);
    const jsonSchema: any = yaml.load(moduleRouter) || {};
    if (!jsonSchema[enumType]) {
      jsonSchema[enumType] = createDefaultEnum();
    }
    await writeFileContent(moduleFilePath, jsonToYaml(jsonSchema));
    // vscode.window.showInformationMessage(readStr);
    vscode.window.showTextDocument(vscode.Uri.file(moduleFilePath));
    vscode.commands.executeCommand('swagger-api-generator.syncPathSchema');
  });

  context.subscriptions.push(disposable);
}

export function addModuleCommand(context: vscode.ExtensionContext, folderUri: vscode.Uri) {
  let disposable = vscode.commands.registerCommand('swagger-api-generator.addModule', async () => {
    const module = await vscode.window.showInputBox({
      value: '',
      placeHolder: 'For example: user',
    });
    if (!module) {
      return vscode.window.showErrorMessage(`Not module name!`);
    }
    const moduleFilePath = posix.join(folderUri.path, 'docs', 'routers', `${module}.yaml`);
    if (fs.existsSync(moduleFilePath)) {
      return vscode.window.showErrorMessage(`Module name existed!`);
    }
    await writeFileContent(moduleFilePath, '');
    const modelsFilePath = posix.join(folderUri.path, 'docs', 'models', `${module}.yaml`);
    await writeFileContent(modelsFilePath, '');
    // vscode.window.showInformationMessage(readStr);
    vscode.window.showTextDocument(vscode.Uri.file(moduleFilePath));
    const moduleList: any[] = context.workspaceState.get('moduleList', []);
    moduleList.unshift(module);
    context.workspaceState.update('moduleList', moduleList);
  });

  context.subscriptions.push(disposable);
}

export function syncPathSchemaCommand(context: vscode.ExtensionContext, folderUri: vscode.Uri) {
  let disposable = vscode.commands.registerCommand('swagger-api-generator.syncPathSchema', async () => {
    const apiFilePath = posix.join(folderUri.fsPath, 'docs', 'api.yaml');
    const content = await readFileContent(apiFilePath);
    const json: any = yaml.load(content);
    const listSchemas = Object.values(json.components.schemas).map(schema => {
      const { $ref } = schema as any;
      return `../${$ref}`;
    });
    const responsesFilePath = posix.join(folderUri.fsPath, 'docs', 'responses.yaml');
    const contentRes = await readFileContent(responsesFilePath);
    if (contentRes) {
      const jsonRes: any = yaml.load(contentRes);
      const resList = Object.keys(jsonRes)
        .map(key => `../responses.yaml#/${key}`);
      listSchemas.push(...resList);
    }
    const pathSchemaFile = posix.join(folderUri.fsPath, '.vscode', 'path-schema.json');
    const schema = await readFileContent(pathSchemaFile);
    const schemaJson = JSON.parse(schema);
    schemaJson.definitions.Reference.properties.$ref.enum = listSchemas;
    await writeFileContent(pathSchemaFile, JSON.stringify(schemaJson, null, 2));
    const objectSchemaFile = posix.join(folderUri.fsPath, '.vscode', 'object-schema.json');
    const schemaObject = await readFileContent(objectSchemaFile);
    const schemaObjectJson = JSON.parse(schemaObject);
    schemaObjectJson.definitions.Reference.properties.$ref.enum = listSchemas
      .filter(model => !model.includes('responses.yaml'))
      .map(model => model.replace('../models/', ''));
    await writeFileContent(objectSchemaFile, JSON.stringify(schemaObjectJson, null, 2));
  });

  context.subscriptions.push(disposable);
}
