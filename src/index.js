/**
 * ****************************************************************************
 *  @author      xqyjlj
 *  @file        index.js
 *  @brief
 *
 * ****************************************************************************
 *  @attention
 *  Licensed under the GNU General Public License v. 3 (the "License");
 *  You may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.gnu.org/licenses/gpl-3.0.html
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 *  Copyright (C) 2025-2025 xqyjlj<xqyjlj@126.com>
 *
 * ****************************************************************************
 *  Change Logs:
 *  Date           Author       Notes
 *  ------------   ----------   -----------------------------------------------
 *  2025-01-16     xqyjlj       initial version
 */

const fs = require('node:fs')
const https = require('node:https')
const os = require('node:os')
const path = require('node:path')
const core = require('@actions/core')
const { exec } = require('@actions/exec')
// const github = require('@actions/github')
const tc = require('@actions/tool-cache')

const version = core.getInput('version') || 'latest'

function getPlatform() {
  const platform = os.platform()
  if (platform === 'win32') {
    return 'windows'
  }
  else if (platform === 'linux') {
    return 'ubuntu'
  }
  else {
    throw new Error(`Unsupported platform: ${platform}`)
  }
}

async function getTag() {
  if (version !== 'latest') {
    return version
  }

  const url = 'https://api.github.com/repos/csplink/csp/releases/latest'

  const options = {
    headers: {
      'User-Agent': 'github-action',
      'Accept': 'application/vnd.github.v3+json',
    },
    timeout: 10000,
  }

  return new Promise((resolve, reject) => {
    const req = https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed: ${res.statusCode}`))
      }

      let data = ''
      res.on('data', chunk => (data += chunk))

      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.tag_name) {
            resolve(json.tag_name)
          }
          else {
            reject(new Error('No tag_name in latest release.'))
          }
        }
        catch {
          reject(new Error('Invalid JSON from GitHub'))
        }
      })
    })

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timed out'))
    })
  })
}

async function main() {
  try {
    const platform = getPlatform()
    const tag = await getTag()
    const fileName = platform === 'windows' ? `csp-windows-server-${tag}.zip` : `csp-linux-server-${tag}.tar.gz`

    const url = `https://github.com/csplink/csp/releases/download/${tag}/${fileName}`
    const file = await tc.downloadTool(url)
    let folder = ''
    if (platform === 'windows') {
      folder = await tc.extractZip(file)
    }
    else {
      folder = await tc.extractTar(file)
    }
    const dirs = fs.readdirSync(folder)
    folder = path.join(folder, dirs[0])

    await exec(`${folder}/csp-server`, ['--version'])
    core.addPath(folder)
    await exec('csp-server', ['--version'])
  }
  catch (error) {
    core.error(`Error: ${error.message}`)
    process.exit(1)
  }
}

main().then()
