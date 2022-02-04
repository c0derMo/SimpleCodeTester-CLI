import yargs from 'yargs/yargs';
import read from "read";
import Logger from './Logger';

export enum Command {
    INTERACTIVE,
    CHECK,
    LISTCHECKS
}

function asyncPrompt(question): Promise<string> {
    let spinnerRunning = Logger.isSpinnerRunning();
    if(spinnerRunning) Logger.stopSpinner();
    return new Promise(resolve => read({
        prompt: question
    }, (err, ans) => {
        if(err) process.exit(1);
        process.stdout.moveCursor(0,-1);
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        if(spinnerRunning) Logger.startSpinner();
        resolve(ans);
    }));
}

function asyncSilentPrompt(question): Promise<string> {
    let spinnerRunning = Logger.isSpinnerRunning();
    if(spinnerRunning) Logger.stopSpinner();
    return new Promise(resolve => read({
        prompt: question,
        silent: true,
        replace: "*"
    }, (err, ans) => {
        if(err) process.exit(1);
        process.stdout.moveCursor(0,-1);
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        if(spinnerRunning) Logger.startSpinner();
        resolve(ans);
    }));
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

    constructor() {
        this.username = "";
        this.password = "";
        this.sourceFolder = "";
        this.categoryId = -1;
        this.command = Command.INTERACTIVE;
        this.urlBase = "https://codetester.ialistannen.de";
        this.interactiveResults = false;
        this.listChecks = false;
    }

    public async parseCommandLine(cliArguments: string[]): Promise<void> {
        const args = await yargs()
            .command("$0", "CLI for the SimpleCodeTester")
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
            .version("SimpleCodeTester by @I-Al-Istannen (https://github.com/I-Al-Istannen/SimpleCodeTester)\n" +
                "CLI by @c0derMo (https://github.com/c0derMo/SimpleCodeTester-CLI)")
            .epilog("\nReport issues with the CLI on GitHub, https://github.com/c0derMo/SimpleCodeTester-CLI.\n\n" +
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
            this.categoryId = parseInt(await asyncPrompt("Please enter a category id: "));
        }
        return this.categoryId;
    }

    public async getUsername(): Promise<string> {
        while(this.username === "") {
            this.username = await asyncPrompt("Please enter your username: ");
        }
        return this.username;
    }

    public async getPassword(): Promise<string> {
        while(this.password === "") {
            this.password = await asyncSilentPrompt(`Password for ${this.username}: `);
        }
        return this.password;
    }

    public getCommand(): Command {
        return this.command;
    }

    public async getSource(): Promise<string> {
        while(this.sourceFolder === "") {
            this.sourceFolder = await asyncPrompt("Please enter the source folder: ");
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
