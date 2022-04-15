// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { posix } from 'path';
import { methods } from './constants';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "swagger-selection-composer" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand('swagger-selection-composer.createApi', async () => {

    if (!vscode.workspace.workspaceFolders) {
      return vscode.window.showInformationMessage('No folder or workspace opened');
    }
    const folderUri = vscode.workspace.workspaceFolders[0].uri;
    const folder = folderUri.with({ path: posix.join(folderUri.path, 'docs', 'routers') });
    const moduleList = [];
    for (const [name, type] of await vscode.workspace.fs.readDirectory(folder)) {
      if (type === vscode.FileType.File) {
        moduleList.push(posix.basename(name, '.yaml'));
      }
    }
    const module = await vscode.window.showQuickPick(moduleList, {
      placeHolder: 'Select module',
      // onDidSelectItem: item => vscode.window.showInformationMessage(`Focus ${++i}: ${item}`)
    });
    vscode.window.showInformationMessage(`Got: ${module}`);

    const router = await vscode.window.showInputBox({
      value: '/',
      valueSelection: [1, 1],
      placeHolder: 'For example: /{id}',
      // validateInput: text => {
      //   vscode.window.showInformationMessage(`Validating: ${text}`);
      //   return text === '123' ? 'Not 123!' : null;
      // }
    });
    vscode.window.showInformationMessage(`Got: ${router}`);
    const selectedMethods: string[] = [];
    let isExit = false;
    do {
      const selected = await vscode.window.showQuickPick(methods.filter(m => !selectedMethods.includes(m)), {
        placeHolder: 'Select methods',
        // onDidSelectItem: item => vscode.window.showInformationMessage(`Focus ${++i}: ${item}`)
      });
      if (selected) {
        selectedMethods.push(selected);
      }
      isExit = !selected;
    } while (selectedMethods.length !== methods.length && !isExit);
    vscode.window.showInformationMessage(selectedMethods.join(':'));
    const fileUri = folderUri.with({ path: posix.join(folderUri.path, 'docs', 'api.yaml') });

    const readData = await vscode.workspace.fs.readFile(fileUri);
    const readStr = Buffer.from(readData).toString('utf8');

    vscode.window.showInformationMessage(readStr);
    vscode.window.showTextDocument(fileUri);
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
