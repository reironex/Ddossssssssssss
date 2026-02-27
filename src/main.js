const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const utils = require('./utils');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files mula sa 'public' folder
app.use(express.static('public'));

let stats = { success: 0, errors: 0 };
let isActive = false;

const runBot = async (botId, targetUrl, interval) => {
  // Siguraduhin na may /login ang dulo ng URL
  const xurl = targetUrl.endsWith('/') ? `${targetUrl}login` : `${targetUrl}/login`;

  while (isActive) {
    try {
      const state = utils.getState();
      // Nagdagdag ng User-Agent para hindi agad ma-block
      await axios.post(xurl, { state, commands: [] }, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
      });
      
      stats.success++;
      io.emit('log', { msg: `Bot ${botId}: Request Sent!`, stats });
    } catch (err) {
      stats.errors++;
      const errorMsg = err.response ? `Error ${err.response.status}` : "Connection Failed";
      io.emit('log', { msg: `Bot ${botId}: ${errorMsg}`, stats });
    }
    await utils.sleep(Number(interval));
  }
};

io.on('connection', (socket) => {
  socket.on('start-bots', (data) => {
    if (isActive) return;
    isActive = true;
    const { url, interval, numBots } = data;
    io.emit('log', { msg: `SYSTEM: Launching ${numBots} bots to ${url}...`, stats });
    
    for (let i = 0; i < Number(numBots); i++) {
      runBot(i + 1, url, interval);
    }
  });

  socket.on('stop-bots', () => {
    isActive = false;
    io.emit('log', { msg: "SYSTEM: All bots stopped.", stats });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Dashboard live at port ${PORT}`));
