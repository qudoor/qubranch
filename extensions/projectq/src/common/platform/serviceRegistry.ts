// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';

import { IServiceManager } from '../../ioc/types';
import { PlatformService } from './platformService';
import { IFileSystem, IPlatformService } from './types';
import { FileSystem } from '../../common/platform/fileSystem';

export function registerTypes(serviceManager: IServiceManager) {
    serviceManager.addSingleton<IPlatformService>(IPlatformService, PlatformService);
    serviceManager.addSingleton<IFileSystem>(IFileSystem, FileSystem);
}
