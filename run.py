#!/usr/bin/env python3
# -*- coding:utf-8 -*-

# Licensed under the GNU General Public License v. 3 (the "License")
# You may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.gnu.org/licenses/gpl-3.0.html
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# Copyright (C) 2025-2025 xqyjlj<xqyjlj@126.com>
#
# @author      xqyjlj
# @file        run.py
#
# Change Logs:
# Date           Author       Notes
# ------------   ----------   -----------------------------------------------
# 2025-01-14     xqyjlj       initial version
#

import os, re
import urllib.request
import sys
import urllib

import requests

version = os.environ["INPUT_VERSION"]


def get_tag() -> str:
    if version == 'latest':
        url = f"https://api.github.com/repos/csplink/csp/tags"
        response = requests.get(url)
        if response.status_code == 200:
            tags = response.json()
            if tags:
                return tags[0]['name']
            else:
                print("No tags found.")
                sys.exit(1)
        else:
            print(f"Error: {response.status_code}")
            sys.exit(1)
    else:
        return version


def main():
    tag = get_tag()
    path = '/tmp'
    try:
        urllib.request.urlretrieve(f'https://github.com/csplink/csp/releases/download/{tag}/csp-ubuntu-{tag}.tar.gz', path)
        print(f"File downloaded: {path}")
    except Exception as e:
        print(f"Failed to download file: {e}")


if __name__ == "__main__":
    main()
