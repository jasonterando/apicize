#!/usr/bin/env node

const concurrently = require("concurrently")
const package = require("../package.json")
const script = process.argv[2]

console.log(package);

concurrently(package.workspaces.map((workspace) => ({
    command: `npm run ${script} -w ${workspace} --if-present`,
    name: `${workspace}`
})))