import axios from "axios";
const FormData = require('form-data');
import * as fs from 'fs';

const username = "";
const password = "";

const zipFile = "edu.zip";      // Will be automatically generated in the full CLI
const hostname = "https://codetester.ialistannen.de";
const check = 936;              // Will be selectable in the full CLI, options will be gathered using /get-all

async function proofOfConcept(): Promise<void> {
    let formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    let response = await axios({
        method: 'POST',
        url: '/login',
        baseURL: hostname,
        data: formData,
        headers: {
            ...formData.getHeaders()
        }
    });

    let refreshToken = response.data.token as string;
    formData = new FormData()
    formData.append('refreshToken', refreshToken);
    response = await axios({
        method: 'POST',
        url: '/login/get-access-token',
        baseURL: hostname,
        data: formData,
        headers: {
            ...formData.getHeaders()
        }
    });

    let accessToken = response.data.token as string;
    formData = new FormData()
    formData.append('file', fs.createReadStream(zipFile));
    response = await axios({
        method: 'POST',
        url: `/test/zip/${check}`,
        baseURL: hostname,
        data: formData,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            ...formData.getHeaders()
        }
    });

    console.log(response.data);
}

void proofOfConcept();
