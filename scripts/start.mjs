#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')

function loadDotEnv() {
  const envPath = resolve(rootDir, '.env')
  if (!existsSync(envPath)) return

  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    if (key && !(key in process.env)) {
      process.env[key] = value
    }
  }
}

function findExpoBinary() {
  const binDir = resolve(rootDir, 'node_modules', '.bin')
  const names = process.platform === 'win32' ? ['expo.cmd', 'expo.exe'] : ['expo']
  for (const name of names) {
    const candidate = resolve(binDir, name)
    if (existsSync(candidate)) return candidate
  }
  return null
}

async function main() {
  loadDotEnv()

  const expoBin = findExpoBinary() || 'expo'
  const args = ['start', ...process.argv.slice(2)]

  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(expoBin, args, {
      cwd: rootDir,
      stdio: 'inherit',
      env: process.env,
    })

    child.on('error', rejectPromise)
    child.on('exit', (code) => {
      if (code === 0) resolvePromise()
      else rejectPromise(new Error(`expo exited with code ${code}`))
    })
  })
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})


