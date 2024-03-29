import axios from 'axios';

export const VERSION_IDENTIFIER = "v1.2.1";

export async function checkForUpdates(): Promise<string> {
    const response = await axios.get("https://api.github.com/repos/c0derMo/SimpleCodeTester-CLI/releases/latest");
    if(response.status !== 200) {
        return undefined;
    }
    if(response.data.tag_name !== VERSION_IDENTIFIER) {
        return `There is a new version of the CLI available! (${response.data.tag_name})\n${response.data.html_url}\n`;
    }
    return undefined
}
