"use strict"

import {Command, ConfigProvider} from "./ConfigProvider";
import {CheckResults, CodeTesterInterface} from "./CodeTesterInterface";
import {fs} from 'memfs';
import archiver from "archiver";
import chalk from 'chalk';
import Progress, {asyncPrompt, printHelp, printVersion} from "./TerminalIO";
import {checkForUpdates} from "./GHUpdateChecker";

const cfgProvider = new ConfigProvider();
const codeTesterInterface = new CodeTesterInterface(cfgProvider);

async function checkCode(): Promise<void> {
    let folderName = await cfgProvider.getSource();
    Progress.updateSpinnerMessage(`Zipping ${folderName}...`);
    const archive = archiver('zip');
    const fw = fs.createWriteStream('/tmp.zip');
    archive.directory(folderName, false);
    archive.pipe(fw);
    await archive.finalize()
    await fw.close();
    const fr = fs.createReadStream("/tmp.zip");
    Progress.persistMessage(`${chalk.green(">")} Zipped ${folderName}`);
    Progress.updateSpinnerMessage("Uploading & testing code...");
    await cfgProvider.getCategoryId();
    let result: CheckResults;
    try {
        result = await codeTesterInterface.checkCode(fr);
    } catch (e) {
        Progress.stopSpinner();
        console.log(chalk.red.bold(e));
        process.exitCode = 1;
        return;
    }
    Progress.persistMessage(`${chalk.green(">")} Uploaded & tested code`);
    Progress.stopSpinner();

    console.log(chalk.cyan.bold("\n     TEST RESULTS\n"));

    let idx = 1;

    for(let file in result) {
        console.log(chalk.yellow.bold(`${file}`));
        let successfulTests = 0;
        for(let test of result[file]) {
            if(test.result === "SUCCESSFUL") {
                successfulTests++;
            }
        }
        if(cfgProvider.getCheckList()) {
            for(let test of result[file]) {
                const prefix = cfgProvider.getInteractiveResults() ? ` (${idx++})` : "";
                if(test.result === "SUCCESSFUL") {
                    console.log(`    ${chalk.green("✓")} ` + test.check + prefix);
                } else {
                    console.log(`    ${chalk.red("✕")} ` + test.check + prefix);
                }
            }
        }
        if(successfulTests == result[file].length) {
            console.log(chalk.bold.green(`  All ${successfulTests} tests successful.`));
        } else {
            let failedTests = result[file].length - successfulTests
            console.log(chalk.bold.green(`  ${successfulTests} tests successful`) + chalk.bold(", ") + chalk.bold.red(`${failedTests} tests failed.`));
        }
    }

    console.log("\nImprove the code tester by writing more tests :)");
    console.log("https://codetester.ialistannen.de/#/submit-check\n");

    if(cfgProvider.getInteractiveResults()) {
        let shouldRun = true;
        while(shouldRun) {
            let id = -1;
            console.log("Enter a check number to see the check details or type 'q' to quit.");
            while(id < 0 || isNaN(id)) {
                const tmp = await asyncPrompt("> ");
                if(tmp.toLowerCase() === "q") {
                    return;
                } else {
                    id = parseInt(tmp);
                }
            }
            let fileId = 0;
            while(id > result[Object.keys(result)[fileId]].length) {
                id -= result[Object.keys(result)[fileId]].length;
                fileId++;
                if(fileId >= Object.keys(result).length) {
                    break;
                }
            }
            if(fileId >= Object.keys(result).length) {
                console.log(chalk.red("Invalid check id."));
                continue;
            }
            for(let line of result[Object.keys(result)[fileId]][id-1].output) {
                switch(line.type) {
                    case "PARAMETER":
                        console.log(chalk.gray.italic(`$$ ${line.content}`));
                        break;
                    case "INPUT":
                        console.log(chalk.gray("> ") + chalk.greenBright(line.content));
                        break;
                    case "OUTPUT":
                        console.log(chalk.green(`  ${line.content}`));
                        break;
                    case "OTHER":
                        console.log(chalk.blueBright(line.content));
                        break;
                    case "ERROR":
                        console.log(chalk.red(`  ${line.content}`));
                        break;
                    default:
                        console.log(chalk.cyanBright(line.content + " [[" + line.type + "]]"));
                        break;
                }
            }
        }
    }
}

async function listCategories(): Promise<void> {
    Progress.updateSpinnerMessage("Querying categories");
    let categories = await codeTesterInterface.getCategories();
    Progress.persistMessage(chalk.green("> ") + "Queried categories");
    Progress.stopSpinner();
    console.log(chalk.cyan.bold("Categories\n"));
    for(let category of categories) {
        console.log(`(${category.id}) ${category.name}`);
    }
}

async function main(): Promise<void> {
    const command = await cfgProvider.parseCommandLine(process.argv);

    if(command === Command.VERSION) {
        printVersion();
        return;
    }
    if(command === Command.HELP) {
        printHelp(process.argv0);
        return;
    }

    console.log(chalk.cyan("SimpleCodeTester-CLI\n"));
    console.log(chalk.cyan("SimpleCodeTester by ") + chalk.yellow.bold("@I-Al-Istannen"));
    console.log(chalk.cyan("CLI by ") + chalk.yellow.bold("@c0derMo"));
    console.log("See cli arguments by using " + chalk.italic("--help\n"));

    if(cfgProvider.getUpdateCheck()) {
        let update = await checkForUpdates();
        if(update) console.log(update);
    }

    let username = await cfgProvider.getUsername();
    Progress.updateSpinnerMessage(`Logging in as ${chalk.yellow(username)}...`);
    Progress.startSpinner();
    try {
        await codeTesterInterface.fetchRefreshToken();
        await codeTesterInterface.fetchAccessToken();
    } catch (e) {
        Progress.stopSpinner();
        console.log(chalk.red.bold(e));
        process.exitCode = 1;
        return;
    }
    Progress.persistMessage(`${chalk.green(">")} Logged in as ${chalk.yellow(username)}`);

    switch (cfgProvider.getCommand()) {
        case Command.INTERACTIVE:
            Progress.stopSpinner();
            switch((await asyncPrompt("Do you want to (r)un checks, or (l)ist categories? ")).toLowerCase()) {
                case "r":
                    Progress.persistMessage("  'Run checks' selected.");
                    Progress.startSpinner();
                    await checkCode();
                    break;
                case "l":
                    Progress.persistMessage("  'List categories' selected.");
                    Progress.startSpinner();
                    await listCategories();
                    break;
                default:
                    console.log("Invalid input. Exiting.");
                    break;
            }
            break;
        case Command.CHECK:
            await checkCode();
            break;
        case Command.LISTCHECKS:
            await listCategories();
            break;
    }
}

void main();
