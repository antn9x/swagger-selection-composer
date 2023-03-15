import { posix } from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { writeFileContent } from './fileUtils';
import axios from 'axios';
const zipdir = require('zip-dir');
const FormData = require('form-data');

export function updateGenBinCommand(context: vscode.ExtensionContext, folderUri: vscode.Uri) {
  let disposable = vscode.commands.registerCommand('swagger-api-generator.updateGenBin', async () => {

  });

  context.subscriptions.push(disposable);
}
