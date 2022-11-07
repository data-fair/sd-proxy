const express = require('express')
const config = require('config')
const cookieParser = require('cookie-parser')
const eventToPromise = require('event-to-promise')
const http = require('http')
const { createProxyMiddleware } = require('http-proxy-middleware')
const session = require('@data-fair/sd-express')({
  directoryUrl: config.directoryUrl,
  privateDirectoryUrl: config.privateDirectoryUrl
})

const app = express()
const server = http.createServer(app)

app.use(cookieParser())
app.use(session.auth)

if (process.env.NODE_ENV === 'development') {
  app.use('/simple-directory', createProxyMiddleware({
    target: 'http://localhost:8080',
    pathRewrite: { '^/simple-directory': '' }
  }))
}

app.use((req, res, next) => {
  const url = config.publicUrl + req.originalUrl

  // manifest request is sent without cookies by some browsers
  if (new URL(url).pathname.endsWith('/manifest.json')) return next()

  let loginUrl = `${config.directoryUrl}/login?redirect=${encodeURIComponent(url)}`
  if (config.adminOnly) loginUrl += '&adminMode=true'
  if (!req.user) return res.redirect(loginUrl)
  if (config.adminOnly) {
    if (!req.user.isAdmin) return res.status(403).send('Super admin only')
    if (!req.user.adminMode) return res.redirect(loginUrl)
  }
  next()
})

app.use(createProxyMiddleware({ target: config.target }))

// Run app and return it in a promise
exports.start = async () => {
  server.listen(config.port)
  await eventToPromise(server, 'listening')
  console.log(`HTTP server listening on ${config.port}, available at ${config.publicUrl}`)
}

exports.stop = async () => {
  server.close()
  await eventToPromise(server, 'close')
}
