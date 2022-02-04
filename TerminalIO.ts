import read from "read";

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
