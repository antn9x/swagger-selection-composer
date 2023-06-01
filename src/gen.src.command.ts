import { posix } from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { readFileContent, writeFileContent } from './fileUtils';
import axios from 'axios';
import { start } from 'sw-generator';

import { PACKAGE_NAME } from './constants';
import { jsonToYaml } from './yamlUtils';
import { apiTemplateObject } from './api.tpl';
const zipdir = require('zip-dir');
const FormData = require('form-data');

export function initDocsCommand(context: vscode.ExtensionContext, folderUri: vscode.Uri) {
  let disposable = vscode.commands.registerCommand('swagger-api-generator.initDocs', async () => {
    const folderDocs = folderUri.with({ path: posix.join(folderUri.path, 'docs') });
    if (fs.existsSync(folderDocs.fsPath)) {
      return;
    }
    const folderRouters = folderUri.with({ path: posix.join(folderUri.path, 'docs', 'routers') });
    const folderModels = folderUri.with({ path: posix.join(folderUri.path, 'docs', 'models') });
    await vscode.workspace.fs.createDirectory(folderDocs);
    await vscode.workspace.fs.createDirectory(folderRouters);
    await vscode.workspace.fs.createDirectory(folderModels);
    const apiFile = folderUri.with({ path: posix.join(folderUri.path, 'docs', 'api.yaml') });
    const enumsFile = folderUri.with({ path: posix.join(folderUri.path, 'docs', 'enums.yaml') });
    const port = Math.round(Math.random() * 7000) + 3000;
    const pkJsonFile = posix.join(folderUri.fsPath, 'package.json');
    const pkJson = JSON.parse(fs.readFileSync(pkJsonFile, { encoding: 'utf8' }));
    const { name: title, description } = pkJson;
    console.log(port, description);
    const json = apiTemplateObject(title, description, port);
    const indexStr = jsonToYaml(json);
    const indexData = Buffer.from(indexStr, 'utf8');
    await vscode.workspace.fs.writeFile(apiFile, indexData);
    await vscode.workspace.fs.writeFile(enumsFile, Buffer.from('', 'utf8'));
  });

  context.subscriptions.push(disposable);
}

async function sendZip(context: vscode.ExtensionContext, folderUri: vscode.Uri) {
  const folder = folderUri.with({ path: posix.join(folderUri.path, 'docs') });
  console.log(folder);
  vscode.window.showInformationMessage(folder.path);
  const zipFile = folderUri.with({ path: posix.join(folderUri.path, 'docs.zip') });
  var buffer = await zipdir(folder.fsPath, { saveTo: zipFile.fsPath });
  const formData = new FormData();
  formData.append('file', fs.createReadStream(zipFile.fsPath));
  formData.append('routerMode', 'decoded');
  const res = await axios.post('http://localhost:16891/v1/gens', formData, {
    responseType: 'arraybuffer',
    headers: {
      ...formData.getHeaders(),
    },
  });
  const srcFile = folderUri.with({ path: posix.join(folderUri.path, 'src.zip') });
  console.log(srcFile);
  fs.writeFileSync(srcFile.fsPath, Buffer.from(res.data));
}

export function startGenCommand(context: vscode.ExtensionContext, folderUri: vscode.Uri) {
  let disposable = vscode.commands.registerCommand('swagger-api-generator.startGen', async () => {
    const settingsFile = folderUri.with({ path: posix.join(folderUri.path, '.vscode', 'settings.json') });
    const settingsContent = await readFileContent(settingsFile.path);
    const settings = JSON.parse(settingsContent);
    if (!settings[PACKAGE_NAME]) {
      return vscode.window.showErrorMessage(`add settings ${PACKAGE_NAME} to .vscode/settings.json`);
    }
    settings[PACKAGE_NAME].projectRoot = folderUri.fsPath;
    await start(settings[PACKAGE_NAME]);
  });

  context.subscriptions.push(disposable);
}
