import { posix } from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { writeFileContent } from './fileUtils';
import axios from 'axios';
const zipdir = require('zip-dir');
const FormData = require('form-data');

export function editSettingsCommand(context: vscode.ExtensionContext, folderUri: vscode.Uri) {
  let disposable = vscode.commands.registerCommand('swagger-api-generator.editSettings', async () => {

  });

  context.subscriptions.push(disposable);
}

export function startGenCommand(context: vscode.ExtensionContext, folderUri: vscode.Uri) {
  let disposable = vscode.commands.registerCommand('swagger-api-generator.startGen', async () => {
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
  });

  context.subscriptions.push(disposable);
}
