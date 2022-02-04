import read from "read";
import {VERSION_IDENTIFIER} from "./GHUpdateChecker";

const frames = ['-', '\\', '|', '/'];

class Progress {
    private interval: NodeJS.Timer = null;
    private message: string = "";
    private frame: number = 0;

    persistMessage(message?: string, newSpinnerMessage?: string): void {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write((message || this.message) + "\n");
        if(newSpinnerMessage) {
            this.message = newSpinnerMessage;
        }
    }

    updateSpinnerMessage(message: string): void {
        this.message = message;
    }

    startSpinner(): void {
        process.stdout.write("\u001b[?25l");
        this.interval = setInterval(Progress._updateSpinner, 80, this);
    }

    stopSpinner(): void {
        clearInterval(this.interval);
        this.interval = null;
        process.stdout.write("\u001b[?25h");
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
    }

    isSpinnerRunning(): boolean {
        return this.interval != null;
    }

    private static _updateSpinner(thisVar: Progress) {
        thisVar.frame = (thisVar.frame+1) % frames.length;
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(frames[thisVar.frame] + " " + thisVar.message);
    }
}

const progress = new Progress();

export default progress;

export function asyncPrompt(question): Promise<string> {
    let spinnerRunning = progress.isSpinnerRunning();
    if(spinnerRunning) progress.stopSpinner();
    return new Promise(resolve => read({
        prompt: question
    }, (err, ans) => {
        if(err) process.exit(1);
        process.stdout.moveCursor(0,-1);
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        if(spinnerRunning) progress.startSpinner();
        resolve(ans);
    }));
}

export function asyncSilentPrompt(question): Promise<string> {
    let spinnerRunning = progress.isSpinnerRunning();
    if(spinnerRunning) progress.stopSpinner();
    return new Promise(resolve => read({
        prompt: question,
        silent: true,
        replace: "*"
    }, (err, ans) => {
        if(err) process.exit(1);
        process.stdout.moveCursor(0,-2);
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        if(spinnerRunning) progress.startSpinner();
        resolve(ans);
    }));
}

export function printHelp(binary: string): void {
    console.log(`CLI for the SimpleCodeTester.
    
    Usage: ${binary} [check|listcategories] [-u username] [-p password]
                    [--src source folder] [-c category] [-l] [-i] [--no-update] [--help] [--version]
    
    Commands:
        check           zip the supplied source folder, upload it and run checks on it.
        listcategories  list all categories on the codetester.
    
    Options:
        -u, --username              username to login with
        -p, --password              password to login with
            --src                   source folder to zip and upload
        -c, --category              category of checks to run
        -l, --list-checks           list all checks at the end
        -i, --interactive-result    start an interactive shell after checking the files,
                                        to see detailed results, requires -l
            --noupdate              disables update-checking
            --help                  displays this help message
            --version               displays version info
    
    Report issues with the CLI on GitHub, at
    https://github.com/c0derMo/SimpleCodeTester-CLI.
    
    Thanks to @I-Al-Istannen for writing the SimpleCodeTester in the first place.
    `);
}

export function printVersion(): void {
    console.log(`SimpleCodeTester by @I-Al-Istannen (https://I-Al-Istannen/SimpleCodeTester)
CLI by @c0derMo (https://c0derMo/SimpleCodeTester-CLI
CLI version ${VERSION_IDENTIFIER}`);
}
