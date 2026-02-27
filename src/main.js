const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const utils = require('./utils');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let stats = { success: 0, errors: 0 };
let isActive = false;

const runBot = async (botId, targetUrl, interval) => {
  const xurl = targetUrl.endsWith('/') ? `${targetUrl}login` : `${targetUrl}/login`;

  while (isActive) {
    try {
      const state = utils.getState();
      await axios.post(xurl, { state, commands: [] });
      stats.success++;
      io.emit('log', { msg: `Bot ${botId}: Request Sent!`, stats });
    } catch (err) {
      stats.errors++;
      io.emit('log', { msg: `Bot ${botId}: Connection Failed`, stats });
    }
    await utils.sleep(Number(interval));
  }
};

io.on('connection', (socket) => {
  socket.on('start-bots', (data) => {
    if (isActive) return;
    isActive = true;
    const { url, interval, numBots } = data;
    for (let i = 0; i < numBots; i++) {
      runBot(i + 1, url, interval);
    }
  });

  socket.on('stop-bots', () => {
    isActive = false;
    io.emit('log', { msg: "SYSTEM: Stopping bots...", stats });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Dashboard live at port ${PORT}`));
