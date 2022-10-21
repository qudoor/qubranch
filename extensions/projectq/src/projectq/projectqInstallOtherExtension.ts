import { inject, injectable, named } from "inversify";
import { IApplicationEnvironment } from "../common/application/types";
import { IExtensionSingleActivationService } from "../activation/types";
import { IExtensions, IOutputChannel } from "../common/types";
import { exec } from "child_process";
import { STANDARD_OUTPUT_CHANNEL } from "../common/constants";

@injectable()
export class ProjectQInstanllOtherExtension implements IExtensionSingleActivationService {
    constructor(
        @inject(IApplicationEnvironment) private readonly applicationEnvironment: IApplicationEnvironment,
        @inject(IExtensions) private readonly extensions: IExtensions,
        @inject(IOutputChannel) @named(STANDARD_OUTPUT_CHANNEL) private readonly output: IOutputChannel
    ) { }
    public async activate(): Promise<void> {
        const needInstallExtensions: string[] = this.applicationEnvironment.packageJson.extensionPack;
        this.output.show(true);
        needInstallExtensions.forEach(e => {
            const extension = this.extensions.getExtension(e);
            if (!extension) {
                exec(`code --install-extension ${e}`, (error, stdout, stderr) => {
                    if (error) {
                        this.output.appendLine(error.message);
                    }
                    if (stdout) {
                        this.output.appendLine(stdout);
                    }
                    if (stderr) {
                        this.output.appendLine(stderr);
                    }
                });
            }
        });
    }
}