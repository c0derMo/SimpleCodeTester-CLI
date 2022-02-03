const frames = ['-', '\\', '|', '/'];

class Logger {
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
        this.interval = setInterval(Logger._updateSpinner, 80, this);
    }

    stopSpinner(): void {
        clearInterval(this.interval);
        this.interval = null;
        process.stdout.write("\u001b[?25h");
        process.stdout.clearLine(0);
    }

    isSpinnerRunning(): boolean {
        return this.interval != null;
    }

    private static _updateSpinner(thisVar: Logger) {
        thisVar.frame = (thisVar.frame+1) % frames.length;
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(frames[thisVar.frame] + " " + thisVar.message);
    }
}

export default new Logger();
