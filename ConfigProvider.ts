import yargs from 'yargs/yargs';
import { Terminal } from "terminal-kit";

export enum Command {
    INTERACTIVE,
    CHECK,
    LISTCHECKS
}

export class ConfigProvider {
    urlBase: string;
    private username: string;
    private password: string;
    private sourceFolder: string;
    private categoryId: number;
    private command: Command;
    private interactiveResults: boolean;
    private listChecks: boolean;

    private readonly terminal: Terminal;

    constructor(terminal: Terminal) {
        this.username = "";
        this.password = "";
        this.sourceFolder = "";
        this.categoryId = -1;
        this.command = Command.INTERACTIVE;
        this.urlBase = "https://codetester.ialistannen.de";
        this.interactiveResults = false;
        this.listChecks = false;

        this.terminal = terminal;
    }

    public async parseCommandLine(cliArguments: string[]): Promise<void> {
        const args = await yargs()
            .command("$0", "run in interactive mode")
            .command("check", "upload the supplied files, and run check on it.")
            .command("listcategories", "list categories")
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
            .option('category', {
                alias: 'c',
                describe: 'category id to run',
                type: 'number'
            })
            .option("l", {
                alias: "list-checks",
                describe: "list all checks and whether they were passed or not",
                type: "boolean"
            })
            .option("i", {
                alias: 'interactive-result',
                describe: 'start an interactive shell after checking files',
                type: 'boolean'
            })
            .help()
            .version(false)
            .epilog("Report issues with the CLI on GitHub, https://github.com/c0derMo/SimpleCodeTester-CLI.\n\n" +
                "Thanks to @I-Al-Istannen for writing the SimpleCodeTester in the first place.")
            .parse(cliArguments);
        if(args._.includes("check")) {
            this.command = Command.CHECK;
        }
        if(args._.includes("listcategories")) {
            this.command = Command.LISTCHECKS;
        }
        this.username = args.u || this.username;
        this.password = args.p || this.password;
        this.sourceFolder = args.src || this.sourceFolder;
        this.categoryId = args.category || this.categoryId;
        this.interactiveResults = args.i || this.interactiveResults;
        this.listChecks = args.l || this.listChecks;
    }

    public async getCategoryId(): Promise<number> {
        while(this.categoryId < 0) {
            this.terminal('Please enter a category id: ');
            this.categoryId = parseInt(await this.terminal.inputField().promise);
            this.terminal("\n");
        }
        return this.categoryId;
    }

    public async getUsername(): Promise<string> {
        while(this.username === "") {
            this.terminal('Please enter your username: ');
            this.username = await this.terminal.inputField().promise;
            this.terminal("\n");
        }
        return this.username;
    }

    public async getPassword(): Promise<string> {
        while(this.password === "") {
            this.terminal('Password for ').yellow(`${this.username}`);
            this.terminal(": ⚿ ");
            this.password = await this.terminal.inputField({ echoChar: true }).promise;
            this.terminal("\n");
        }
        return this.password;
    }

    public getCommand(): Command {
        return this.command;
    }

    public async getSource(): Promise<string> {
        while(this.sourceFolder === "") {
            this.terminal('Please enter the source folder: ');
            this.sourceFolder = await this.terminal.inputField().promise;
            this.terminal("\n");
        }
        return this.sourceFolder;
    }

    public getInteractiveResults(): boolean {
        return this.interactiveResults;
    }

    public getCheckList(): boolean {
        return this.listChecks;
    }
}
