import { SystemVariables } from "../common/variables/systemVariables";
import { IWorkspaceService } from "../common/application/types";
import { IFileSystem } from "../common/platform/types";
import { Resource } from "../common/types";
import { sendTelemetryEvent } from '.';
import { EventName } from './constants';

let _defaultEnvFileSetting: string | undefined;
let envFileTelemetrySent = false;

export function sendFileCreationTelemetry() {
    if (shouldSendTelemetry()) {
        sendTelemetry();
    }
}

export async function sendActivationTelemetry(
    fileSystem: IFileSystem,
    workspaceService: IWorkspaceService,
    resource: Resource
) {
    if (shouldSendTelemetry()) {
        const systemVariables = new SystemVariables(resource, undefined, workspaceService);
        const envFilePath = systemVariables.resolveAny(defaultEnvFileSetting(workspaceService))!;
        const envFileExists = await fileSystem.fileExists(envFilePath);

        if (envFileExists) {
            sendTelemetry();
        }
    }
}

function shouldSendTelemetry(): boolean {
    return !envFileTelemetrySent;
}

function defaultEnvFileSetting(workspaceService: IWorkspaceService) {
    if (!_defaultEnvFileSetting) {
        const section = workspaceService.getConfiguration('python');
        _defaultEnvFileSetting = section.inspect<string>('envFile')?.defaultValue || '';
    }

    return _defaultEnvFileSetting;
}

function sendTelemetry(hasCustomEnvPath: boolean = false) {
    sendTelemetryEvent(EventName.ENVFILE_WORKSPACE, undefined, { hasCustomEnvPath });

    envFileTelemetrySent = true;
}
