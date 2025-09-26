#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')

const win = process.platform === 'win32'

const localSupabaseCandidates = win
  ? ['supabase.cmd', 'supabase.exe', 'supabase.ps1']
  : ['supabase']

const bunxBinary = win ? 'bunx.cmd' : 'bunx'
const bunxPackage = '@supabase/cli'

function collectStdout(child) {
  return new Promise((resolve) => {
    let stdout = ''
    if (child.stdout) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk instanceof Buffer ? chunk.toString('utf8') : chunk
      })
    }
    child.on('close', () => resolve(stdout))
  })
}

function spawnCommand(command, args, { stdio }) {
  return new Promise((resolve, reject) => {
    const usePipe = stdio === 'pipe'
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: usePipe ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    })

    const stdoutPromise = usePipe ? collectStdout(child) : Promise.resolve(undefined)

    child.on('error', (error) => {
      reject(error)
    })

    child.on('close', async (code) => {
      const stdout = await stdoutPromise
      if (code === 0) {
        resolve({ stdout })
      } else {
        const error = new Error(`${command} exited with code ${code}`)
        error.exitCode = typeof code === 'number' ? code : 1
        error.stdout = stdout
        reject(error)
      }
    })
  })
}

function findLocalSupabase() {
  const binDir = resolve(rootDir, 'node_modules', '.bin')
  for (const candidate of localSupabaseCandidates) {
    const candidatePath = resolve(binDir, candidate)
    if (existsSync(candidatePath)) {
      return candidatePath
    }
  }
  return null
}

export async function runSupabaseCli(args, options = {}) {
  const { stdio = 'inherit' } = options

  const localSupabase = findLocalSupabase()
  if (localSupabase) {
    return spawnCommand(localSupabase, args, { stdio })
  }

  try {
    return await spawnCommand('supabase', args, { stdio })
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }

  try {
    return await spawnCommand(bunxBinary, [bunxPackage, ...args], { stdio })
  } catch (error) {
    if (error.code === 'ENOENT') {
      const hint = win
        ? 'Install Bun and ensure bunx is on your PATH.'
        : 'Install Bun (https://bun.sh) so bunx is available on your PATH.'
      throw new Error(`Could not find Supabase CLI. ${hint}`)
    }
    throw error
  }
}

async function main() {
  try {
    await runSupabaseCli(process.argv.slice(2))
  } catch (error) {
    if (error.exitCode) {
      process.exit(error.exitCode)
    }
    console.error(error.message)
    process.exit(1)
  }
}

if (process.argv[1] && process.argv[1].endsWith('supabase-cli.mjs')) {
  main()
}


