export const PYTHON_LANGUAGE = 'python';
export const PVSC_EXTENSION_ID = 'ms-python.python';

export function isTestExecution(): boolean {
    return process.env.VSC_JUPYTER_CI_TEST === '1' || isUnitTestExecution();
}
export const isCI = process.env.TF_BUILD !== undefined || process.env.GITHUB_ACTIONS === 'true';

export const STANDARD_OUTPUT_CHANNEL = 'STANDARD_OUTPUT_CHANNEL';

/**
 * Whether we're running unit tests (*.unit.test.ts).
 * These tests have a speacial meaning, they run fast.
 * @export
 * @returns {boolean}
 */
export function isUnitTestExecution(): boolean {
    return process.env.VSC_JUPYTER_UNIT_TEST === '1';
}


export const PQSC_EXTENSION_ID = 'projectq-vscode';
export const AppinsightsKey = 'AIF-d9b70cd4-b9f9-4d70-929b-a071c400b217';

export const PYTHON_WARNINGS = 'PYTHONWARNINGS';


export namespace Commands {
    export const Enable_SourceMap_Support = 'projectq.enableSourceMapSupport';
    export const ClearStorage = 'projectq.clearPersistentStorage';
    export const Set_Linter = 'projectq.setLinter';
}