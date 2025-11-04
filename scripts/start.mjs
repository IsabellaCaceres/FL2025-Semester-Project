#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateEpubManifest } from './generate-epub-manifest.mjs'

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

function openBrowser(url) {
  const { platform } = process
  let command
  if (platform === 'darwin') {
    command = 'open'
  } else if (platform === 'win32') {
    command = 'start'
  } else {
    command = 'xdg-open'
  }
  
  spawn(command, [url], { detached: true, stdio: 'ignore' })
}

async function main() {
  loadDotEnv()

  await generateEpubManifest({ rootDir })

  const expoBin = findExpoBinary() || 'expo'
  const args = ['start', ...process.argv.slice(2)]
  const isWebMode = process.argv.includes('--web')

  await new Promise((resolvePromise, rejectPromise) => {
    let browserOpened = false
    let outputBuffer = ''
    
    const child = spawn(expoBin, args, {
      cwd: rootDir,
      stdio: isWebMode ? ['inherit', 'pipe', 'pipe'] : 'inherit',
      env: process.env,
    })

    // Capture stdout to detect when web server is ready
    if (isWebMode && child.stdout) {
      child.stdout.on('data', (data) => {
        const text = data.toString()
        outputBuffer += text
        process.stdout.write(text) // Still show output to user
        
        // Look for web server URL patterns in Expo output
        if (!browserOpened) {
          // Try multiple patterns that Expo might use
          const patterns = [
            /web is waiting on (https?:\/\/[^\s]+)/i,
            /Metro waiting on (https?:\/\/[^\s]+)/i,
            /(https?:\/\/localhost:\d+)/i,
            /(https?:\/\/127\.0\.0\.1:\d+)/i,
            /open (https?:\/\/[^\s]+)/i,
          ]
          
          for (const pattern of patterns) {
            const match = outputBuffer.match(pattern)
            if (match) {
              browserOpened = true
              const url = match[1] || match[0]
              // Wait a bit for server to be fully ready
              setTimeout(() => {
                console.log(`\n🌐 Opening browser at ${url}\n`)
                openBrowser(url)
              }, 2000)
              break
            }
          }
          
          // Fallback: if we see "web" and server indicators but no URL, try default port
          if (!browserOpened && outputBuffer.includes('web') && 
              (outputBuffer.includes('ready') || outputBuffer.includes('running'))) {
            browserOpened = true
            setTimeout(() => {
              const defaultUrl = 'http://localhost:8081'
              console.log(`\n🌐 Opening browser at ${defaultUrl}\n`)
              openBrowser(defaultUrl)
            }, 3000)
          }
        }
      })
      
      child.stderr.on('data', (data) => {
        process.stderr.write(data)
      })
    }

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

