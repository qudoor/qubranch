import { Resource } from '../../common/types';
import { PythonEnvironment } from '../../pythonEnvironments/info';
import { Event, Uri } from 'vscode';

export const IInterpreterAutoSelectionService = Symbol('IInterpreterAutoSelectionService');
export interface IInterpreterAutoSelectionService extends IInterpreterAutoSelectionProxyService {
    readonly onDidChangeAutoSelectedInterpreter: Event<void>;
    autoSelectInterpreter(resource: Resource): Promise<void>;
    getAutoSelectedInterpreter(resource: Resource): PythonEnvironment | undefined;
    setGlobalInterpreter(interpreter: PythonEnvironment | undefined): Promise<void>;
}

export const IInterpreterAutoSelectionProxyService = Symbol('IInterpreterAutoSelectionProxyService');
/**
 * Interface similar to IInterpreterAutoSelectionService, to avoid chickn n egg situation.
 * Do we get python path from config first or get auto selected interpreter first!?
 * However, the class that reads python Path, must first give preference to selected interpreter.
 * But all classes everywhere make use of python settings!
 * Solution - Use a proxy that does nothing first, but later the real instance is injected.
 *
 * @export
 * @interface IInterpreterAutoSelectionProxyService
 */
export interface IInterpreterAutoSelectionProxyService {
    readonly onDidChangeAutoSelectedInterpreter: Event<void>;
    getAutoSelectedInterpreter(resource: Resource): PythonEnvironment | undefined;
    registerInstance?(instance: IInterpreterAutoSelectionProxyService): void;
    setWorkspaceInterpreter(resource: Uri, interpreter: PythonEnvironment | undefined): Promise<void>;
}