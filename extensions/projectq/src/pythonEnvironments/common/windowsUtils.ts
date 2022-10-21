import { uniqBy } from "lodash";
import * as path from 'path';
import { traceError } from "../../common/logger";
import { HKLM, HKCU, REG_SZ } from "winreg";
import { IRegistryKey, IRegistryValue, readRegistryKeys, readRegistryValues } from "./windowsRegistry";
import { logVerbose } from "../../common/logging";
import { isTestExecution } from "../../common/constants";

export interface IRegistryInterpreterData {
    interpreterPath: string;
    versionStr?: string;
    sysVersionStr?: string;
    bitnessStr?: string;
    companyDisplayName?: string;
    distroOrgName?: string;
}

let registryInterpretersCache: IRegistryInterpreterData[] | undefined;

async function getRegistryInterpretersImpl(): Promise<IRegistryInterpreterData[]> {
    let registryData: IRegistryInterpreterData[] = [];

    for (const arch of ['x64', 'x86']) {
        for (const hive of [HKLM, HKCU]) {
            const root = '\\SOFTWARE\\Python';
            let keys: string[] = [];
            try {
                keys = (await readRegistryKeys({ arch, hive, key: root })).map((k) => k.key);
            } catch (ex) {
                traceError(`Failed to access Registry: ${arch}\\${hive}\\${root}`, ex);
            }

            for (const key of keys) {
                registryData = registryData.concat(await getInterpreterDataFromRegistry(arch, hive, key));
            }
        }
    }
    registryInterpretersCache = uniqBy(registryData, (r: IRegistryInterpreterData) => r.interpreterPath);
    return registryInterpretersCache;
}

export async function getInterpreterDataFromRegistry(
    arch: string,
    hive: string,
    key: string,
): Promise<IRegistryInterpreterData[]> {
    const subKeys = await readRegistryKeys({ arch, hive, key });
    const distroOrgName = key.substr(key.lastIndexOf('\\') + 1);
    const allData = await Promise.all(subKeys.map((subKey) => getInterpreterDataFromKey(subKey, distroOrgName)));
    return (allData.filter((data) => data !== undefined) || []) as IRegistryInterpreterData[];
}


async function getInterpreterDataFromKey(
    { arch, hive, key }: IRegistryKey,
    distroOrgName: string,
): Promise<IRegistryInterpreterData | undefined> {
    const result: IRegistryInterpreterData = {
        interpreterPath: '',
        distroOrgName,
    };

    const values: IRegistryValue[] = await readRegistryValues({ arch, hive, key });
    for (const value of values) {
        switch (value.name) {
            case 'SysArchitecture':
                result.bitnessStr = value.value;
                break;
            case 'SysVersion':
                result.sysVersionStr = value.value;
                break;
            case 'Version':
                result.versionStr = value.value;
                break;
            case 'DisplayName':
                result.companyDisplayName = value.value;
                break;
            default:
                break;
        }
    }

    const subKeys: IRegistryKey[] = await readRegistryKeys({ arch, hive, key });
    const subKey = subKeys.map((s) => s.key).find((s) => s.endsWith('InstallPath'));
    if (subKey) {
        const subKeyValues: IRegistryValue[] = await readRegistryValues({ arch, hive, key: subKey });
        const value = subKeyValues.find((v) => v.name === 'ExecutablePath');
        if (value) {
            result.interpreterPath = value.value;
            if (value.type !== REG_SZ) {
                logVerbose(`Registry interpreter path type [${value.type}]: ${value.value}`);
            }
        }
    }

    if (result.interpreterPath.length > 0) {
        return result;
    }
    return undefined;
}

/**
 * Returns windows registry interpreters from memory, returns undefined if memory is empty.
 * getRegistryInterpreters() must be called prior to this to populate memory.
 */
export function getRegistryInterpretersSync(): IRegistryInterpreterData[] | undefined {
    return !isTestExecution() ? registryInterpretersCache : undefined;
}

/**
 * Checks if a given path ends with python*.exe
 * @param {string} interpreterPath : Path to python interpreter.
 * @returns {boolean} : Returns true if the path matches pattern for windows python executable.
 */
export function matchPythonBinFilename(filename: string): boolean {
    /**
     * This Reg-ex matches following file names:
     * python.exe
     * python3.exe
     * python38.exe
     * python3.8.exe
     */
    const windowsPythonExes = /^python(\d+(.\d+)?)?\.exe$/;

    return windowsPythonExes.test(path.basename(filename));
}

let registryInterpretersPromise: Promise<IRegistryInterpreterData[]> | undefined;

export async function getRegistryInterpreters(): Promise<IRegistryInterpreterData[]> {
    if (!isTestExecution() && registryInterpretersPromise !== undefined) {
        return registryInterpretersPromise;
    }
    registryInterpretersPromise = getRegistryInterpretersImpl();
    return registryInterpretersPromise;
}

/**
 * Determine if the given filename looks like the simplest Python executable.
 */
export function matchBasicPythonBinFilename(filename: string): boolean {
    return path.basename(filename).toLowerCase() === 'python.exe';
}
