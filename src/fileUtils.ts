import * as vscode from 'vscode';

export async function readFileContent(path: string) {
  const fileUri = vscode.Uri.file(path);
  const readData = await vscode.workspace.fs.readFile(fileUri);
  const content = Buffer.from(readData).toString('utf8');
  return content;
}

export async function writeFileContent(path: string, content: string) {
  const fileUri = vscode.Uri.file(path);
  const indexData = Buffer.from(content, 'utf8');
  await vscode.workspace.fs.writeFile(fileUri, indexData);
}