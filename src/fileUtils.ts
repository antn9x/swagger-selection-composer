import * as vscode from 'vscode';
import * as fs from 'fs';

export async function readFileContent(path: string) {
  const fileUri = vscode.Uri.file(path);
  // console.log(path, fileUri.fsPath);
  if (!fs.existsSync(fileUri.fsPath)) {
    return '';
  }
  const readData = await vscode.workspace.fs.readFile(fileUri);
  const content = Buffer.from(readData).toString('utf8');
  return content;
}

export async function writeFileContent(path: string, content: string) {
  const wsedit = new vscode.WorkspaceEdit();
  const fileUri = vscode.Uri.file(path);
  const indexData = Buffer.from(content, 'utf8');
  wsedit.createFile(fileUri, { ignoreIfExists: true });
  vscode.workspace.applyEdit(wsedit);
  await vscode.workspace.fs.writeFile(fileUri, indexData);
}