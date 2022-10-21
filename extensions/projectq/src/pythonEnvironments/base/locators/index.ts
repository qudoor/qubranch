/**
 * A wrapper around all locators used by the extension.
 */

import { PythonEnvInfo } from "../../../common/process/internal/scripts";
import { ILocator, PythonLocatorQuery, IPythonEnvsIterator } from "../locator";
import { Locators, combineIterators } from "../locators";

export class ExtensionLocators<I = PythonEnvInfo> extends Locators<I> {
    constructor(
        // These are expected to be low-level locators (e.g. system).
        private readonly nonWorkspace: ILocator<I>[],
        // This is expected to be a locator wrapping any found in
        // the workspace (i.e. WorkspaceLocators).
        private readonly workspace: ILocator<I>,
    ) {
        super([...nonWorkspace, workspace]);
    }

    public iterEnvs(query?: PythonLocatorQuery): IPythonEnvsIterator<I> {
        const iterators: IPythonEnvsIterator<I>[] = [this.workspace.iterEnvs(query)];
        if (!query?.searchLocations?.doNotIncludeNonRooted) {
            iterators.push(...this.nonWorkspace.map((loc) => loc.iterEnvs(query)));
        }
        return combineIterators(iterators);
    }
}