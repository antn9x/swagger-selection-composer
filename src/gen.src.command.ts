import { posix } from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { writeFileContent } from './fileUtils';

export function editSettingsCommand(context: vscode.ExtensionContext, folderUri: vscode.Uri) {
  let disposable = vscode.commands.registerCommand('swagger-api-generator.editSettings', async () => {

  });

  context.subscriptions.push(disposable);
}

export function startGenCommand(context: vscode.ExtensionContext, folderUri: vscode.Uri) {
  let disposable = vscode.commands.registerCommand('swagger-api-generator.startGen', async () => {

  });

  context.subscriptions.push(disposable);
}
