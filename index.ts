"use strict"

import {Command, ConfigProvider} from "./ConfigProvider";
import {CheckResults, CodeTesterInterface} from "./CodeTesterInterface";
import {fs} from 'memfs';
import archiver from "archiver";
import chalk from 'chalk';
import Logger from "./Logger";

/**
 * TODO
 * https://github.com/substack/minimist
 */

const cfgProvider = new ConfigProvider();
const codeTesterInterface = new CodeTesterInterface(cfgProvider);

function terminate(): void {
    process.exit(1);
}

async function checkCode(): Promise<void> {
    let folderName = await cfgProvider.getSource();
    Logger.updateSpinnerMessage(`Zipping ${folderName}...`);
    const archive = archiver('zip');
    const fw = fs.createWriteStream('/tmp.zip');
    archive.directory(folderName, false);
    archive.pipe(fw);
    await archive.finalize()
    await fw.close();
    const fr = fs.createReadStream("/tmp.zip");
    await cfgProvider.getCategoryId();
    Logger.persistMessage();
    Logger.updateSpinnerMessage("Uploading & testing code...");
    let result: CheckResults;
    try {
        result = await codeTesterInterface.checkCode(fr);
    } catch (e) {
        console.log(chalk.red.bold(e));
        terminate();
    }
    Logger.persistMessage();

    console.log(chalk.cyan.bold("\n     TEST RESULTS\n"));

    for(let file in result) {
        console.log(chalk.yellow.bold(`${file}\n`));
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
            //@ts-expect-error
            terminal.table(list, {
                hasBorder: true,
                borderChars: 'lightRounded',
                contentHasMarkup: true,
                width: 80,
                fit: true
            });
        }
        if(successfulTests == result[file].length) {
            console.log(chalk.bold.green(`  All ${successfulTests} tests successful.\n\n`));
        } else {
            let failedTests = result[file].length - successfulTests
            console.log(chalk.bold.green(`  ${successfulTests} tests successful`) + chalk.bold(", ") + chalk.bold.red(`${failedTests} tests failed.\n\n`));
        }
    }

    console.log("Improve the code tester by writing more tests :)\n");
    console.log("https://codetester.ialistannen.de/#/submit-check\n")

    // if(cfgProvider.getInteractiveResults()) {
    //     console.log("\n");
    //     let shouldRun = true;
    //     while(shouldRun) {
    //         let file = "";
    //         global_qQuit = true;
    //         if(Object.keys(result).length > 1) {
    //             console.log(chalk.cyan("Select a file to see checks for, or press (q) to quit:\n"))
    //             file = (await terminal.singleColumnMenu(Object.keys(result)).promise).selectedText;
    //             terminal("\n")
    //         } else {
    //             file = Object.keys(result)[0];
    //         }
    //
    //         let checks = [];
    //         for(let test of result[file]) {
    //             if(test.result === "SUCCESSFUL") {
    //                 checks.push(`[✓] ${test.check}`);
    //             } else {
    //                 checks.push(`[✕] ${test.check}`);
    //             }
    //         }
    //         terminal.cyan("Select a check to see the input/output for, or press (q) to quit:\n");
    //         let selectedCheck = (await terminal.gridMenu(checks).promise).selectedIndex;
    //         let inputLines = "";
    //         terminal("\n")
    //         for(let line of result[file][selectedCheck].output) {
    //             switch (line.type) {
    //                 case "PARAMETER":
    //                     terminal.gray.italic(`$$ ${line.content}\n`);
    //                     break;
    //                 case "INPUT":
    //                     terminal.gray("> ").brightGreen(line.content + "\n");
    //                     inputLines += line.content + "\n";
    //                     break;
    //                 case "OUTPUT":
    //                     terminal.green(`  ${line.content}\n`);
    //                     break;
    //                 case "OTHER":
    //                     terminal.brightBlue(line.content + "\n");
    //                     break;
    //                 case "ERROR":
    //                     terminal.red(`  ${line.content}\n`);
    //                     break;
    //                 default:
    //                     terminal.brightCyan(line.content + " [[" + line.type + "]]\n");
    //                     break;
    //             }
    //         }
    //         terminal("\n");
    //     }
    // }
}

async function listCategories(): Promise<void> {
    let categories = await codeTesterInterface.getCategories();
    console.log(chalk.cyan.bold("Categories\n\n"));
    for(let category of categories) {
        console.log(`(${category.id}) ${category.name}\n`);
    }
    console.log("\n");
}

async function main(): Promise<void> {
    await cfgProvider.parseCommandLine(process.argv);

    console.log("SimpleCodeTester-CLI\n");
    console.log(chalk.cyan("SimpleCodeTester by ") + chalk.yellow.bold("@I-Al-Istannen"));
    console.log(chalk.cyan("CLI by ") + chalk.yellow.bold("@c0derMo"));
    console.log("See cli arguments by using " + chalk.italic("--help\n"));

    let username = await cfgProvider.getUsername();
    Logger.updateSpinnerMessage(`Logging in as ` + chalk.yellow(`${username}`) + `...`);
    Logger.startSpinner();
    try {
        await codeTesterInterface.fetchRefreshToken();
        await codeTesterInterface.fetchAccessToken();
    } catch (e) {
        console.log(chalk.red.bold(e));
        terminate();
    }
    Logger.persistMessage(chalk.green("Login successful!\n"));

    switch (cfgProvider.getCommand()) {
        case Command.INTERACTIVE:
            console.log(chalk.cyan("Please select your operation: \n"));
            // let index = (await terminal.singleLineMenu(["Run checks", "List categories"]).promise).selectedIndex;
            // if(index === 0) {
            //     await checkCode();
            // } else if(index === 1) {
            //     await listCategories();
            // }
            break;
        case Command.CHECK:
            await checkCode();
            break;
        case Command.LISTCHECKS:
            await listCategories();
            break;
    }

    terminate();
}

void main();
