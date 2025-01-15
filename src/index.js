const core = require('@actions/core');
const github = require('@actions/github');
const tc = require('@actions/tool-cache');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const {exec} = require('@actions/exec');

const version = core.getInput('version') || 'latest'

function getPlatform() {
    const platform = os.platform();
    if (platform === 'win32') {
        return 'windows';
    } else if (platform === 'linux') {
        return 'ubuntu';
    } else {
        throw new Error(`Unsupported platform: ${platform}`);
    }
}

async function getTag() {
    if (version === 'latest') {
        const url = 'https://api.github.com/repos/csplink/csp/tags';
        const options = {
            headers: {
                'User-Agent': 'Node.js', Accept: 'application/vnd.github.v3+json',
            },
        };

        return new Promise((resolve, reject) => {
            https.get(url, options, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Failed to fetch tags: ${res.statusCode}`));
                }

                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    const tags = JSON.parse(data);
                    if (tags.length > 0) {
                        resolve(tags[0].name);
                    } else {
                        reject(new Error('No tags found.'));
                    }
                });
            }).on('error', (err) => reject(err));
        });
    } else {
        return version;
    }
}

async function main() {
    try {
        const platform = getPlatform();
        const tag = await getTag();
        const fileName = platform === 'windows' ? `csp-windows-${tag}.zip` : `csp-ubuntu-${tag}.tar.gz`;

        const url = `https://github.com/csplink/csp/releases/download/${tag}/${fileName}`;
        const file = await tc.downloadTool(url)
        let folder = ''
        if (platform === "windows") {
            folder = await tc.extractZip(file);
        } else {
            folder = await tc.extractTar(file);
        }
        const dirs = fs.readdirSync(folder);
        folder = path.join(folder, dirs[0])
        await exec(`"${folder}/csp" --version`)
        core.addPath(folder);
        await exec('csp', ['--version'])
    } catch (error) {
        core.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

main().then();
