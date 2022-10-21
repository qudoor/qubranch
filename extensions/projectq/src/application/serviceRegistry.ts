// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { IServiceManager } from '../ioc/types';
import { SourceMapSupportService } from './diagnostics/surceMapSupportService';
import { ISourceMapSupportService } from './diagnostics/types';

export function registerTypes(serviceManager: IServiceManager) {
    serviceManager.addSingleton<ISourceMapSupportService>(ISourceMapSupportService, SourceMapSupportService);
}
