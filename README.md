# SimpleCodeTester-CLI
Commandline interface written for [@I-Al-Istannen's SimpleCodeTester](https://github.com/I-Al-Istannen/SimpleCodeTester).

## Usage:
Run the binary in a command line. If no command line arguments are given, the tool will ask you what to do.

However, it can be fully automated using cli arguments, or a config file, so it can be ran using scripts.

### Commandline arguments:

| Argument                 | Alias                   | Description                                                                                                       | 
|--------------------------|-------------------------|-------------------------------------------------------------------------------------------------------------------|
| `check`                  |                         | Uploads the supplied files to the code tester & tests them                                                        |
| `listcategories`         |                         | Lists all categories                                                                                              |
| `-u <username>`          | `--username <username>` | Username for the codetester                                                                                       |
| `-p <password>`          | `--password <password>` | Password for the codetester                                                                                       |
| `--src <source folder>`  |                         | Source folder to zip & upload                                                                                     |
| `-c <category>`          | `--category <category>` | Category of checks to run, obtained using `listcategories`                                                        |
| `-l`                     | `--list-checks`         | Lists all the checks instead of just showing amount passed / failed                                               |
| `-i`                     | `--interactive-result`  | Starts an interactive shell after checking the files, where details about the checks can be viewed, requires `-l` |
| `--help`                 |                         | Shows the help of the program.                                                                                    |
| `--version`              |                         | Shows version info of the program                                                                                 |
| `--noupdate`             |                         | Disables update checking                                                                                          |

### Config file

The tool tries to read a JSON config from a `.codetester` file in the working directory.

| Config key           | Argument equivalent    | Valid options              |
|----------------------|------------------------|----------------------------|
| `username`           | `--username`           | `string`                   |
| `password`           | `--password`           | `string`                   |
| `command`            |                        | `check` / `listcategories` |
| `source`             | `--src`                | `string`                   |
| `categoryId`         | `--category`           | `number`                   |
| `listChecks`         | `--list-checks`        | `boolean`                  |
| `interactiveResults` | `--interactive-result` | `boolean`                  |
| `disableUpdate`      | `--noupdate`           | `boolean`                  |
