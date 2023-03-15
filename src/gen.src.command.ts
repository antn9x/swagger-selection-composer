import { posix } from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { readFileContent, writeFileContent } from './fileUtils';
import axios from 'axios';
import { start } from 'sw-generator';

import { PACKAGE_NAME } from './constants';
const zipdir = require('zip-dir');
const FormData = require('form-data');

export function editSettingsCommand(context: vscode.ExtensionContext, folderUri: vscode.Uri) {
  let disposable = vscode.commands.registerCommand('swagger-api-generator.editSettings', async () => {

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
