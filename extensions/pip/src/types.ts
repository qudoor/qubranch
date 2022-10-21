import * as vscode from 'vscode';
import { createDecorator } from './instantiation/common/instantiation';

export type IOutputChannel = vscode.OutputChannel;
export const IOutputChannel = createDecorator<IOutputChannel>('outputChannel');

export type IExtensionContext = vscode.ExtensionContext;
export const IExtensionContext = createDecorator<IExtensionContext>('extensionContext');
