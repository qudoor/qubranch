import { IServiceManager } from '../../ioc/types';
import { FileSystem } from '../../common/platform/fileSystem';
import { IFileSystem } from '../../common/platform/types';
import { IApplicationShell, ICommandManager, IWorkspaceService } from '../application/types';
import { ApplicationShell } from '../application/applicationShell';
import { CommandManager } from '../application/commandManager';
import { WorkspaceService } from '../application/workspace';
import { IConfigurationService } from '../types';
import { ConfigurationService } from '../configuration/service';

// export function registerLoggerTypes(serviceManager: IServiceManager) {
    // serviceManager.addSingleton<IFileSystem>(IFileSystem, FileSystem);
    // serviceManager.addSingleton<ICommandManager>(ICommandManager, CommandManager);
    // serviceManager.addSingleton<IWorkspaceService>(IWorkspaceService, WorkspaceService);
    // serviceManager.addSingleton<IApplicationShell>(IApplicationShell, ApplicationShell);
    // serviceManager.addSingleton<IConfigurationService>(IConfigurationService, ConfigurationService);
// }
