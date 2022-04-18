import yaml from 'js-yaml';
import { posix } from 'path';
import { plural } from 'pluralize';
import * as vscode from 'vscode';
import { methods } from './constants';
import { readFileContent, writeFileContent } from './fileUtils';
import { createApiMethod, Method } from './schema.tpl';
import { getNameByRouter } from './stringUtils';
import { jsonToYaml } from './yamlUtils';

export function createApiCommand(context: vscode.ExtensionContext, folderUri: vscode.Uri) {
  let disposable = vscode.commands.registerCommand('swagger-selection-composer.createApi', async () => {
    const moduleList = context.workspaceState.get('moduleList', []);
    const module = await vscode.window.showQuickPick(moduleList, {
      placeHolder: 'Select module',
      // onDidSelectItem: item => vscode.window.showInformationMessage(`Focus ${++i}: ${item}`)
    });
    if (!module) {
      return vscode.window.showInformationMessage(`Not module!`);
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
    const selectedMethods: Method[] = [];
    let isExit = false;
    do {
      const selected = await vscode.window.showQuickPick(methods.filter(m => !selectedMethods.includes(m)), {
        placeHolder: 'Select methods',
        // onDidSelectItem: item => vscode.window.showInformationMessage(`Focus ${++i}: ${item}`)
      });
      if (selected) {
        selectedMethods.push((selected as Method));
      }
      isExit = !selected;
    } while (selectedMethods.length !== methods.length && !isExit);
    if (!selectedMethods.length) {
      return vscode.window.showInformationMessage(`Not methods!`);
    }
    const fileUri = folderUri.with({ path: posix.join(folderUri.path, 'docs', 'api.yaml') });

    const readData = await vscode.workspace.fs.readFile(fileUri);
    const content = Buffer.from(readData).toString('utf8');
    const json: any = yaml.load(content);
    const routePath = `/${plural(module)}${router ? `/${router}` : ''}`;
    const name = getNameByRouter(routePath);
    json.paths[routePath] = { $ref: `routers/${module}.yaml#/${name}` };
    const indexStr = jsonToYaml(json);
    const indexData = Buffer.from(indexStr, 'utf8');
    await vscode.workspace.fs.writeFile(fileUri, indexData);

    const moduleFilePath = posix.join(folderUri.path, 'docs', 'routers', `${module}.yaml`);
    const moduleRouter = await readFileContent(moduleFilePath);
    const jsonRouter: any = yaml.load(moduleRouter);
    if (!jsonRouter[name]) {
      jsonRouter[name] = {};
    }
    selectedMethods.forEach(method => {
      if (!jsonRouter[name][method]) {
        jsonRouter[name][method] = createApiMethod(method, module, routePath);
      }
    });
    await writeFileContent(moduleFilePath, jsonToYaml(jsonRouter));
    // vscode.window.showInformationMessage(readStr);
    vscode.window.showTextDocument(vscode.Uri.file(moduleFilePath));
  });

  context.subscriptions.push(disposable);
}
