import { IServiceManager } from "../../ioc/types";
import { CurrentProcess } from "./currentProcess";
import { BufferDecoder } from "./decoder";
import { ProcessServiceFactory } from "./processFactory";
import { PythonExecutionFactory } from "./pythonExecutionFactory";
import { IBufferDecoder, IProcessServiceFactory, IPythonExecutionFactory } from "./types";

export function registerTypes(serviceManager: IServiceManager) {
    serviceManager.addSingleton<IBufferDecoder>(IBufferDecoder, BufferDecoder);
    serviceManager.addSingleton<IProcessServiceFactory>(IProcessServiceFactory, ProcessServiceFactory);
    serviceManager.addSingleton<IPythonExecutionFactory>(IPythonExecutionFactory, PythonExecutionFactory);
    serviceManager.addSingleton<CurrentProcess>(CurrentProcess, CurrentProcess);
}