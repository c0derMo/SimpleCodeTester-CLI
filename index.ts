"use strict"

import {Command, ConfigProvider} from "./ConfigProvider";
import {CheckResults, CodeTesterInterface} from "./CodeTesterInterface";
import {terminal} from "terminal-kit";
import {createReadStream, createWriteStream} from "fs";
import {rm} from 'fs/promises';
import archiver from "archiver";

const cfgProvider = new ConfigProvider(terminal);
const codeTesterInterface = new CodeTesterInterface(cfgProvider);

let global_qQuit = false;

function terminate(): void {
    terminal.grabInput(false );
    if (global_qQuit) {
        terminal.reset();
    }
    process.exit(1);
}

terminal.on('key', function(name, matches, data) {
    if(name === 'CTRL_C' || name === 'ESC' || (name === "q" && global_qQuit)) { terminate() }
})

async function checkCode(): Promise<void> {
    let folderName = await cfgProvider.getSource();
    terminal(`Zipping ${folderName}...\n`);
    const archive = archiver('zip');
    const fw = createWriteStream('tmp.zip');
    archive.directory(folderName, false);
    archive.pipe(fw);
    await archive.finalize()
    await fw.close();
    const fr = createReadStream("tmp.zip");
    await cfgProvider.getCategoryId();
    terminal("Uploading & testing code...\n");
    let result: CheckResults;
    try {
        result = await codeTesterInterface.checkCode(fr);
    } catch (e) {
        terminal.red.bold(e);
        await rm('tmp.zip', { force: true });
        terminate();
    }
    await rm('tmp.zip', { force: true });

    terminal.cyan.bold("\n     TEST RESULTS\n\n")

    for(let file in result) {
        terminal.yellow.bold(`${file}\n`);
        let successfulTests = 0;
        for(let test of result[file]) {
            if(test.result === "SUCCESSFUL") {
                successfulTests++;
            }
        }
        if(cfgProvider.getCheckList()) {
            let list = [] as string[][];

            for(let test of result[file]) {
                if(test.result === "SUCCESSFUL") {
                    list.push(["^#^gpassed", test.check]);
                } else {
                    list.push(["^#^rfailed", test.check]);
                }
            }
            // @ts-expect-error
            terminal.table(list, {
                hasBorder: true,
                borderChars: 'lightRounded',
                contentHasMarkup: true,
                width: 80,
                fit: true
            });
        }
        if(successfulTests == result[file].length) {
            terminal.bold.green(`All ${successfulTests} tests successful.\n\n`);
        } else {
            let failedTests = result[file].length - successfulTests
            terminal.bold.green(`${successfulTests} tests successful`).bold(", ").bold.red(`${failedTests} tests failed.\n\n`);
        }
    }

    terminal("Improve the code tester by writing more tests :)\n");
    terminal("https://codetester.ialistannen.de/#/submit-check\n")

    if(cfgProvider.getInteractiveResults()) {
        terminal("\n");
        let shouldRun = true;
        while(shouldRun) {
            let file = "";
            global_qQuit = true;
            if(Object.keys(result).length > 1) {
                terminal.cyan("Select a file to see checks for, or press (q) to quit:\n")
                file = (await terminal.singleColumnMenu(Object.keys(result)).promise).selectedText;
                terminal("\n")
            } else {
                file = Object.keys(result)[0];
            }

            let checks = [];
            for(let test of result[file]) {
                if(test.result === "SUCCESSFUL") {
                    checks.push(`[✓] ${test.check}`);
                } else {
                    checks.push(`[✕] ${test.check}`);
                }
            }
            terminal.cyan("Select a check to see the input/output for, or press (q) to quit:\n");
            let selectedCheck = (await terminal.gridMenu(checks).promise).selectedIndex;
            let inputLines = "";
            terminal("\n")
            for(let line of result[file][selectedCheck].output) {
                switch (line.type) {
                    case "PARAMETER":
                        terminal.gray.italic(`$$ ${line.content}\n`);
                        break;
                    case "INPUT":
                        terminal.gray("> ").brightGreen(line.content + "\n");
                        inputLines += line.content + "\n";
                        break;
                    case "OUTPUT":
                        terminal.green(`  ${line.content}\n`);
                        break;
                    case "OTHER":
                        terminal.brightBlue(line.content + "\n");
                        break;
                    case "ERROR":
                        terminal.red(`  ${line.content}\n`);
                        break;
                    default:
                        terminal.brightCyan(line.content + " [[" + line.type + "]]\n");
                        break;
                }
            }
            terminal("\n");
        }
    }
}

async function listCategories(): Promise<void> {
    let categories = await codeTesterInterface.getCategories();
    terminal.cyan.bold("Categories\n\n")
    for(let category of categories) {
        terminal(`(${category.id}) ${category.name}\n`);
    }
    terminal("\n");
}

async function main(): Promise<void> {
    terminal.grabInput({});

    await cfgProvider.parseCommandLine(process.argv);

    terminal("SimpleCodeTester-CLI\n\n");
    terminal.cyan("SimpleCodeTester by ").yellow.bold("@I-Al-Istannen\n");
    terminal.cyan("CLI by ").yellow.bold("@c0derMo\n");
    terminal("See cli arguments by using ").italic("--help\n\n");

    let username = await cfgProvider.getUsername();
    terminal(`Logging in as `).yellow(`${username}`).white(`...\n`);
    try {
        await codeTesterInterface.fetchRefreshToken();
        await codeTesterInterface.fetchAccessToken();
    } catch (e) {
        terminal.red.bold(e);
        terminate();
    }
    terminal.green("Login successful!\n\n");

    switch (cfgProvider.getCommand()) {
        case Command.INTERACTIVE:
            terminal("Running in interactive mode");
            break;
        case Command.CHECK:
            await checkCode();
            break;
        case Command.LISTCHECKS:
            await listCategories();
            break;
    }

    terminal.grabInput(false);
}

void main();
