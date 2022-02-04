import { asyncPrompt, asyncSilentPrompt } from './TerminalIO';
import chalk from "chalk";
import parseArgs from 'minimist';

export enum Command {
    INTERACTIVE,
    CHECK,
    LISTCHECKS,
    VERSION,
    HELP
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
    private disableUpdate: boolean;

    constructor() {
        this.username = "";
        this.password = "";
        this.sourceFolder = "";
        this.categoryId = -1;
        this.command = Command.INTERACTIVE;
        this.urlBase = "https://codetester.ialistannen.de";
        this.interactiveResults = false;
        this.listChecks = false;
        this.disableUpdate = false;
    }

    public async parseCommandLine(cliArguments: string[]): Promise<Command> {
        const args = parseArgs(cliArguments, {
            string: ["src", "c", "u", "p"],
            boolean: ["l", "i", "noupdate", "help", "version"],
            alias: {
                "c": "category",
                "u": "username",
                "p": "password",
                "l": "list-checks",
                "i": "interactive-results"
            }
        });
        if(args.help) return Command.HELP;
        if(args.version) return Command.VERSION;
        if(args._.includes("check")) {
            this.command = Command.CHECK;
        }
        if(args._.includes("listcategories")) {
            this.command = Command.LISTCHECKS;
        }
        this.username = args.u || this.username;
        this.password = args.p || this.password;
        this.sourceFolder = args.src || this.sourceFolder;
        this.categoryId = args.c || this.categoryId;
        this.interactiveResults = args.i || this.interactiveResults;
        this.listChecks = args.l || this.listChecks;
        this.disableUpdate = args.noupdate || this.disableUpdate;
        return args.command;
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
            this.password = await asyncSilentPrompt(`Password for ${chalk.yellow(this.username)}: `);
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

    public getUpdateCheck(): boolean {
        return !this.disableUpdate;
    }
}
