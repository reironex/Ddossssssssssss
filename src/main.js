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

// Anti-death logic mula sa original file mo
process.on('uncaughtException', err => {});

const bot = (botId, xurl, interval) => {
  if (!isActive) return;

  // "Fire and Forget" - walang await para dire-diretso ang bugso
  axios.post(xurl, {
    state: utils.getState(), //
    commands: []
  }).catch(() => {}); // Balewalain ang error para tuloy ang logs

  stats.success++;
  io.emit('log', { msg: `Bot ${botId}: successfully sent one!`, stats });

  // Paulit-ulit na pagtakbo base sa interval
  setTimeout(() => bot(botId, xurl, interval), interval);
};

io.on('connection', (socket) => {
  socket.on('start-bots', (data) => {
    if (isActive) return;
    isActive = true;
    
    const { url, interval, numBots } = data;
    const xurl = url.endsWith('/') ? `${url}login` : `${url}/login`; //

    for (let i = 0; i < Number(numBots); i++) {
      bot(i + 1, xurl, Number(interval));
    }
  });

  socket.on('stop-bots', () => {
    isActive = false;
    io.emit('log', { msg: "SYSTEM: All bots stopped.", stats });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Dashboard active at port ${PORT}`));
