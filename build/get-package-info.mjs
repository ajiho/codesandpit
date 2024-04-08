import fs from "fs-extra";
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pkgJson = path.join(__dirname, '../package.json')


const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf-8'));

export default pkg