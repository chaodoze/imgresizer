const http = require('http')
const koaCallback = require('./index.js')
http.createServer(koaCallback).listen(6060);