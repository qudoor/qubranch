import { Disposable } from "vscode";

// Main interface
export const IDataScience = Symbol('IDataScience');
export interface IDataScience extends Disposable {
    activate(): Promise<void>;
}