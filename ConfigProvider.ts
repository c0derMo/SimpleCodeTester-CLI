import yargs from 'yargs/yargs';

export enum Command {
    INTERACTIVE,
    CHECK,
    LISTCHECKS
}

export class ConfigProvider {
    private username: string = "";
    private password: string = "";
    private sourceFolder: string = "";
    private categoryId: number = -1;
    private command: Command = Command.INTERACTIVE;

    public async parseCommandLine(cliArguments: string[]): Promise<void> {
        const args = await yargs()
            .command("$0", "run from a .codetester file or run in interactive mode")
            .command("check", "upload the supplied files, and run check on it.")
            .command("listchecks", "list checks")
            .option("u", {
                alias: 'username',
                describe: 'login username',
                type: 'string'
            })
            .option('p', {
                alias: 'password',
                describe: 'login password',
                type: 'string'
            })
            .option('src', {
                describe: 'source folder',
                type: 'string'
            })
            .option('check', {
                alias: 'c',
                describe: 'check-category id to run',
                type: 'number'
            })
            .help()
            .version(false)
            .parse(cliArguments);
        if(args._.includes("check")) {
            this.command = Command.CHECK;
        }
        if(args._.includes("listchecks")) {
            this.command = Command.LISTCHECKS;
        }
        this.username = args.u || this.username;
        this.password = args.p || this.password;
        this.sourceFolder = args.src || this.sourceFolder;
        this.categoryId = args.check || this.categoryId;
        this.printConfig();
    }

    public printConfig() {
        console.log(this.command);
        console.log(this.username);
        console.log(this.password);
        console.log(this.sourceFolder);
        console.log(this.categoryId);
    }
}
