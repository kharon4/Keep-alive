const { v4 } = require('uuid');
const express = require('express');
const app = express();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const config =  require('./config.json');

const serverList = config.servers;
const pingDelay = config.pingDelay;


// custom write
const writeFile = async(filePath, contents)=>{
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath,contents);
}

// logging funtion
const log = (basePath, text) => {
    let date = new Date();
    const folderName = date.toLocaleDateString('en-GB', { timeZone: 'IST' }).replaceAll('/', '_');
    const fileName = date.toLocaleTimeString('en-GB', { timeZone: 'IST' }).replaceAll(':', '_') + '.txt';
    writeFile(path.join(__dirname,basePath,folderName,fileName),text);
}

// get uuid
app.get('/', (req, res) => {
    const response = v4();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress ;
    log(path.join('logs','sent'),JSON.stringify({ip,response}));
    res.send(response);
});

// fetch uuid
const pingServers = async () => {
    const responseList = [];
    serverList.forEach(serverURI => {
        responseList.push(axios.get(serverURI));
    });

    const [...responses] = await Promise.allSettled(responseList);

    const logObj = {};

    responses.forEach(response => {
        logObj[response.value.config.url] = {
            status: response.value.status,
            body: response.value.data
        }
    });

    log(path.join('logs','fetch'),JSON.stringify(logObj));

    setTimeout(pingServers,pingDelay);
}

pingServers();

const port = 3000;
app.listen(port);