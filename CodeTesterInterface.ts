import FormData from 'form-data';
import axios from 'axios';
import { ConfigProvider } from "./ConfigProvider";
import {IReadStream} from "memfs/lib/volume";

export interface CheckCategory {
    id: number;
    name: string;
}

export interface CheckLine {
    type: "PARAMETER" | "OTHER" | "INPUT" | "OUTPUT" | "ERROR";
    content: string;
}

export interface Check {
    check: string;
    result: "SUCCESSFUL" | "FAILED";
    output: CheckLine[];
}

export interface CheckResults {
    [key: string]: Check[];
}


export class CodeTesterInterface {
    private configProvider: ConfigProvider;
    private refreshToken: string;
    private accessToken: string;

    constructor(configProvider: ConfigProvider) {
        this.refreshToken = "";
        this.accessToken = "";
        this.configProvider = configProvider;
    }

    public async fetchRefreshToken(): Promise<void> {
        let formData = new FormData();
        formData.append('username', await this.configProvider.getUsername());
        formData.append('password', await this.configProvider.getPassword());

        let response = await axios({
            method: 'POST',
            url: '/login',
            baseURL: this.configProvider.urlBase,
            data: formData,
            headers: {
                ...formData.getHeaders()
            },
            validateStatus: null
        });

        if(response.status === 401 || response.status === 404) {
            throw new Error("Invalid credentials");
        } else if(response.status !== 200) {
            throw new Error(`Non-200 response at /login: ${response.status} (${response.statusText}) - ${JSON.stringify(response.data)}`);
        }

        this.refreshToken = response.data.token as string;
    }

    public async fetchAccessToken(): Promise<void> {
        if (this.refreshToken === "" || !CodeTesterInterface.isExpiredToken(this.refreshToken)) {
            await this.fetchRefreshToken();
        }

        let formData = new FormData();
        formData.append('refreshToken', this.refreshToken);

        let response = await axios({
            method: 'POST',
            url: '/login/get-access-token',
            baseURL: this.configProvider.urlBase,
            data: formData,
            headers: {
                ...formData.getHeaders()
            },
            validateStatus: null
        });

        if(response.status !== 200) {
            throw new Error(`Non-200 response at /login/get-access-token: ${response.status} (${response.statusText}) - ${JSON.stringify(response.data)}`);
        }

        this.accessToken = response.data.token;
    }

    public async checkCode(file: IReadStream): Promise<CheckResults> {
        if (this.accessToken === "" || CodeTesterInterface.isExpiredToken(this.accessToken)) {
            await this.fetchAccessToken();
        }

        let formData = new FormData();
        formData.append('file', file);
        let response = await axios({
            method: 'POST',
            url: `/test/zip/${await this.configProvider.getCategoryId()}`,
            baseURL: this.configProvider.urlBase,
            data: formData,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                ...formData.getHeaders()
            },
            validateStatus: null
        });

        if(response.status !== 200) {
            throw new Error(`Non-200 response at /test/zip/${await this.configProvider.getCategoryId()}: ${response.status} (${response.statusText}) - ${JSON.stringify(response.data)}`);
        }

        if(!response.data.compilationOutput) {
            let errorString = "Compiler-Error:\n";
            for(let file in response.data.diagnostics) {
                errorString += file + "\n";
                for(let line of response.data.diagnostics[file]) {
                    errorString += line + "\n";
                }
            }
            throw new Error(errorString);
        }

        if(Object.keys(response.data.fileResults).length === 0) {
            throw new Error("No files to compile found");
        }

        return response.data.fileResults;
    }

    public async getCategories(): Promise<CheckCategory[]> {
        if (this.accessToken === "" || CodeTesterInterface.isExpiredToken(this.accessToken)) {
            await this.fetchAccessToken();
        }

        let response = await axios({
            method: 'GET',
            url: '/check-category/get-all',
            baseURL: this.configProvider.urlBase,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            },
            validateStatus: null
        });

        if(response.status !== 200) {
            throw new Error(`Non-200 response at /check-category/get-all: ${response.status} (${response.statusText}) - ${JSON.stringify(response.data)}`);
        }

        return response.data as CheckCategory[];
    }

    private static isExpiredToken(jwt: string): boolean {
        // Code taken from
        // https://github.com/I-Al-Istannen/SimpleCodeTester/blob/64de3bf0ef2e083f35be4368a23f67a3cb6b485a/simplecodetester-frontend/src/util/requests.ts#L35
        const parts = jwt.split(".");
        if(parts.length !== 3) return false;

        const claimsString = Buffer.from(parts[1], 'base64').toString();
        const claims = JSON.parse(claimsString);
        return claims['exp'] && ((new Date()).getTime() / 1000) > claims['exp']
    }
}
