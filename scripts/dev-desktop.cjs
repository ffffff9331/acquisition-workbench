const { spawn } = require('node:child_process')
const net = require('node:net')
const path = require('node:path')

const root = path.join(__dirname, '..')

function findAvailablePort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        resolve(findAvailablePort(port + 1))
        return
      }
      reject(error)
    })
    server.listen({ host: '127.0.0.1', port }, () => {
      const { port: availablePort } = server.address()
      server.close(() => resolve(availablePort))
    })
  })
}

function waitForServer(url, retries = 80) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const request = require('node:http').get(url, (response) => {
        response.resume()
        if (response.statusCode && response.statusCode < 500) {
          resolve()
          return
        }
        retry()
      })
      request.on('error', retry)
      request.setTimeout(300, () => request.destroy())
    }
    const retry = () => {
      if (retries-- <= 0) {
        reject(new Error('Vite development server did not start in time.'))
        return
      }
      setTimeout(attempt, 120)
    }
    attempt()
  })
}

async function run() {
  const port = await findAvailablePort(5173)
  const url = `http://127.0.0.1:${port}`
  const vite = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'inherit' })
  let electron

  const closeChildren = () => {
    if (electron && !electron.killed) electron.kill()
    if (!vite.killed) vite.kill()
  }
  process.on('SIGINT', () => { closeChildren(); process.exit(0) })
  process.on('SIGTERM', () => { closeChildren(); process.exit(0) })

  vite.on('exit', (code) => {
    if (!electron) process.exit(code || 0)
  })

  try {
    await waitForServer(url)
  } catch (error) {
    closeChildren()
    throw error
  }

  electron = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['electron', '.'], { cwd: root, stdio: 'inherit', env: { ...process.env, VITE_DEV_SERVER_URL: url } })
  electron.on('exit', () => closeChildren())
}

run().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
