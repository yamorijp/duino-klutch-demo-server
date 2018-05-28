/*
 * duino-klutch-demo-server
 *
 * - serve duino-klutch-client
 * - emulate duino-klutch webapi & websocket
 */

const express = require('express')
const path = require('path')
const logger = require('morgan')
const http = require('http')
const WebSocket = require('ws')

// keep relay switch state
let relayState = {
  state: false,
  updated: Date.now() / 1000
}

const app = express()
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  next()
})

// serve duino-klutch-client
app.get('/', (req, res, next) => {
  res.sendFile('index.html', {root: path.join(__dirname, 'public')})
})

// emulate /_handlers api
app.get('/_handlers', (req, res, next) => {
  res.json(require('./data/_handlers.json'))
})

// emulate /switch/relay/toggle api
app.get('/switch/relay/toggle', (req, res, next) => {
  relayState.state = !relayState.state
  relayState.updated = Date.now() / 1000
  res.json(require('./data/success.json'))

  const data = require('./data/relay.json')
  data.data = relayState
  wss.broadcast(data)
})

// emulate other api
app.use(function(req, res, next) {
  res.json(require('./data/success.json'))
})

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.set('Content-Type', 'text/plain')
  res.send(req.app.get('env') === 'development' ? err.stack : 'oops')
})

const port = normalizePort(process.env.PORT || '3000')
app.set('port', port)

const server = http.createServer(app)
server.listen(port, () => console.log(`Listening on ${port}`))

const wss = new WebSocket.Server({server: server})
wss.broadcast = (data) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data))
    }
  })
}
wss.on('connection', socket => {
  // emulate init event
  const data = require('./data/init.json')
  data.items.push({resource:'/switch/relay', data:relayState})
  socket.send(JSON.stringify(data))
})

// broadcast dummy event
setInterval(() => {
  const n = randInt(0, 99)
  if (n < 20) {
    const data = require('./data/brightness.json')
    data.data.value = randInt(1, 1000)
    wss.broadcast(data)
    return
  }

  if (n < 40) {
    const data = require('./data/motion.json')
    data.data.state = !!randInt(0, 1)
    data.data.updated = Date.now() / 1000
    wss.broadcast(data)
    return
  }

  if (n < 60) {
    const data = require('./data/ht.json')
    data.data.temperature = randInt(15, 30)
    data.data.humidity = randInt(20, 80)
    wss.broadcast(data)
    return
  }
}, 2000)


function randInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function normalizePort(v) {
  const port = parseInt(v, 10)
  if (isNaN(port)) return v
  if (port >= 0) return port
  return false;
}
