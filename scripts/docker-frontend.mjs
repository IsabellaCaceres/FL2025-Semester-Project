#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const scriptsDir = dirname(__filename)
const projectRoot = resolve(scriptsDir, '..')

function detectDockerCompose() {
  const candidates = [
    { command: 'docker', args: ['compose', 'version'], baseArgs: ['compose'], label: '`docker compose`' },
    { command: 'docker-compose', args: ['version'], baseArgs: [], label: '`docker-compose`' },
  ]

  for (const candidate of candidates) {
    const result = spawnSync(candidate.command, candidate.args, { stdio: 'ignore' })
    if (!result.error && result.status === 0) {
      return { command: candidate.command, baseArgs: candidate.baseArgs, label: candidate.label }
    }
  }

  throw new Error(
    'Unable to find Docker Compose. Please install Docker Desktop (recommended) or ensure either `docker compose` or `docker-compose` is available in your PATH.'
  )
}

function buildComposeArgs(rawArgs) {
  const args = [...rawArgs]
  const composeArgs = ['up']

  const buildFlagIndex = args.indexOf('--no-build')
  if (buildFlagIndex === -1) {
    composeArgs.push('--build')
  } else {
    args.splice(buildFlagIndex, 1)
  }

  const hasServiceArg = args.some((arg) => !arg.startsWith('-'))
  composeArgs.push(...args)

  if (!hasServiceArg) {
    composeArgs.push('frontend')
  }

  return composeArgs
}

async function run() {
  const compose = detectDockerCompose()
  const extraArgs = process.argv.slice(2)
  const composeArgs = buildComposeArgs(extraArgs)

  console.log(`[docker-frontend] Using ${compose.label}`)
  console.log(`[docker-frontend] Running: ${compose.command} ${[...compose.baseArgs, ...composeArgs].join(' ')}`)

  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(compose.command, [...compose.baseArgs, ...composeArgs], {
      cwd: projectRoot,
      stdio: 'inherit',
      env: process.env,
    })

    child.on('error', (error) => {
      rejectPromise(new Error(`Failed to start Docker Compose: ${error.message}`))
    })

    child.on('exit', (code) => {
      if (code === 0) resolvePromise()
      else rejectPromise(new Error(`Docker Compose exited with code ${code ?? 'unknown'}`))
    })
  })
}

run().catch((error) => {
  console.error(`[docker-frontend] ${error.message}`)
  process.exit(1)
})


