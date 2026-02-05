require("dotenv").config();
const express = require("express");
const app = express();
const socketIO = require('socket.io');
const http = require('http');
const logger = require('./lib/logger');
app.use(express.json());

const server = http.createServer(app);
const io = socketIO(server, {
        cors: { origin: "*" }
});

const db = require('./db');

db.query('SELECT NOW() AS currentTime', (err, results) => {
  if (err) throw err;
  console.log(results);
});

// routes (note: ensure paths exist)
try {
    require('./controller/auth.controller')(app);
} catch (e) { logger.warn('auth.controller not loaded:', e && e.message ? e.message : e); }
try {
    require('./controller/chat.controller')(io);
} catch (e) { logger.warn('chat.controller not loaded:', e && e.message ? e.message : e); }

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
});
module.exports = app;