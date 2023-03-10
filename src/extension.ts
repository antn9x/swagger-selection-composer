// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { posix } from 'path';
import * as vscode from 'vscode';
import { addModuleCommand, createApiCommand, createEnumCommand, createModelCommand, createObjectCommand, createSchemaCommand } from './commands';
import { editSettingsCommand, startGenCommand } from './gen.src.command';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "swagger-api-generator" is now active!');

  if (!vscode.workspace.workspaceFolders) {
    return vscode.window.showInformationMessage('No folder or workspace opened');
  }
  const folderUri = vscode.workspace.workspaceFolders[0].uri;
  const folder = folderUri.with({ path: posix.join(folderUri.path, 'docs', 'routers') });
  const moduleList: string[] = [];
  for (const [name, type] of await vscode.workspace.fs.readDirectory(folder)) {
    if (type === vscode.FileType.File) {
      moduleList.push(posix.basename(name, '.yaml'));
    }
  }
  context.workspaceState.update('moduleList', moduleList);
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  createApiCommand(context, folderUri);
  createModelCommand(context, folderUri);
  createSchemaCommand(context, folderUri);
  createObjectCommand(context, folderUri);
  createEnumCommand(context, folderUri);
  addModuleCommand(context, folderUri);
  editSettingsCommand(context, folderUri);
  startGenCommand(context, folderUri);
}

// this method is called when your extension is deactivated
export function deactivate() { }
