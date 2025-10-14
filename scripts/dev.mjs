#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { setTimeout as wait } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { existsSync } from 'node:fs'

const thisFile = fileURLToPath(import.meta.url)
const scriptsDir = dirname(thisFile)
const projectRoot = resolve(scriptsDir, '..')

const bunBin = process.platform === 'win32' ? 'bun.exe' : 'bun'
const nodeBin = process.execPath
const background = new Set()

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: 'inherit',
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
  })
}

function start(command, args) {
  const child = spawn(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
  })
  child.on('error', (error) => {
    console.error(`[dev] Failed to start ${command}:`, error.message)
    shutdown()
  })
  background.add(child)
  child.on('exit', (code) => {
    if (!process.exitCode && code !== 0) {
      process.exitCode = code ?? 1
    }
    shutdown()
  })
  return child
}

function killProcess(child) {
  if (!child || child.killed) return
  child.kill('SIGINT')
  setTimeout(() => {
    if (!child.killed) child.kill('SIGTERM')
  }, 1000)
}

function shutdown() {
  for (const child of background) {
    killProcess(child)
  }
  background.clear()
  process.exit(process.exitCode ?? 0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

async function main() {
  const nodeModulesPath = resolve(projectRoot, 'node_modules')
  if (!existsSync(nodeModulesPath)) {
    console.log('[dev] Installing dependencies (frozen lockfile)...')
    await run(bunBin, ['install', '--frozen-lockfile'])
  } else {
    console.log('[dev] Skipping dependency install (node_modules present)')
  }
  console.log('[dev] Generating EPUB manifest...')
  await run(bunBin, ['run', 'generate:epubs'])

  console.log('[dev] Starting Supabase...')
  start(nodeBin, [resolve(scriptsDir, 'supabase-cli.mjs'), 'start'])
  await wait(5000)

  console.log('[dev] Exporting Supabase keys...')
  await run(bunBin, ['run', 'supabase:keys'])
  console.log('[dev] Syncing EPUB assets to Supabase storage...')
  await run(bunBin, ['run', 'supabase:sync-epubs'])

  console.log('[dev] Starting API server...')
  start(bunBin, ['run', 'server'])
  await wait(2000)

  console.log('[dev] Launching Expo dev server...')
  start(bunBin, ['expo', 'start'])

  console.log('[dev] All services are running. Press Ctrl+C to stop.')
  await new Promise(() => {})
}

main().catch((error) => {
  console.error(error.message)
  shutdown()
})
