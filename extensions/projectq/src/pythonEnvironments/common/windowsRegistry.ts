import { createDeferred } from "../../common/utils/async";
import { Options, Registry, RegistryItem } from "winreg";

export interface IRegistryKey {
    hive: string;
    arch: string;
    key: string;
    parentKey?: IRegistryKey;
}

export interface IRegistryValue {
    hive: string;
    arch: string;
    key: string;
    name: string;
    type: string;
    value: string;
}


export async function readRegistryKeys(options: Options): Promise<IRegistryKey[]> {
    // eslint-disable-next-line global-require
    const WinReg = require('winreg');
    const regKey = new WinReg(options);
    const deferred = createDeferred<Registry[]>();
    regKey.keys((err: Error, res: Registry[]) => {
        if (err) {
            deferred.reject(err);
        }
        deferred.resolve(res);
    });
    return deferred.promise;
}

export async function readRegistryValues(options: Options): Promise<IRegistryValue[]> {
    // eslint-disable-next-line global-require
    const WinReg = require('winreg');
    const regKey = new WinReg(options);
    const deferred = createDeferred<RegistryItem[]>();
    regKey.values((err: Error, res: RegistryItem[]) => {
        if (err) {
            deferred.reject(err);
        }
        deferred.resolve(res);
    });
    return deferred.promise;
}