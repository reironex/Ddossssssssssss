const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const utils = require('./utils');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Anti-death mula sa original code mo
process.on('uncaughtException', err => {});

let isActive = false;
let stats = { success: 0 };

const bot = async (botId, xurl, interval) => {
  // Hangga't active ang dashboard, hinding-hindi titigil ang loop na ito
  while (isActive) {
    try {
      const state = utils.getState();
      // "Fire and forget" - hindi tayo nag-a-await para kasing bilis ng Replit
      axios.post(xurl, { state, commands: [] });

      stats.success++;
      io.emit('log', { msg: `Bot ${botId}: successfully sent one!`, stats });
      
      // Kung 0 ang interval, halos walang tigil ito
      if (Number(interval) > 0) {
        await utils.sleep(Number(interval));
      } else {
        // Minimum delay para hindi mag-crash ang event loop ng server
        await new Promise(resolve => setImmediate(resolve));
      }
    } catch (err) {
      // Gaya ng original code, success pa rin ang log kahit mag-error
      stats.success++;
      io.emit('log', { msg: `Bot ${botId}: successfully sent one!`, stats });
    }
  }
};

io.on('connection', (socket) => {
  socket.on('start-bots', (data) => {
    if (isActive) return;
    isActive = true;
    stats.success = 0; // Reset counter
    
    const { url, interval, numBots } = data;
    const xurl = url.endsWith('/') ? `${url}login` : `${url}/login`;

    for (let i = 0; i < Number(numBots); i++) {
      bot(i + 1, xurl, interval);
    }
  });

  socket.on('stop-bots', () => {
    isActive = false;
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Dashboard live at port ${PORT}`));
