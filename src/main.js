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

// Anti-death gaya ng nasa original mong file
process.on('uncaughtException', err => {});

const runBot = async (botId, targetUrl, interval) => {
  // Sinigurado na tama ang URL structure gaya ng original mong logic
  const xurl = targetUrl.endsWith('/') ? `${targetUrl}login` : `${targetUrl}/login`;

  while (isActive) {
    try {
      const state = utils.getState();
      
      // Nagdagdag ng explicit headers para maiwasan ang Error 400
      await axios.post(xurl, { 
        state, 
        commands: [] 
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 5000 // Para hindi mag-hang ang bot
      });
      
      stats.success++;
      io.emit('log', { msg: `Bot ${botId}: Success (Sent to ${xurl})`, stats });
    } catch (err) {
      stats.errors++;
      // Mas detalyadong error reporting
      let errMsg = "Failed";
      if (err.response) {
        errMsg = `Error ${err.response.status}`; // Ipakita kung 400, 403, etc.
      } else if (err.request) {
        errMsg = "No Response";
      }
      io.emit('log', { msg: `Bot ${botId}: ${errMsg}`, stats });
    }
    await utils.sleep(Number(interval));
  }
};

io.on('connection', (socket) => {
  socket.on('start-bots', (data) => {
    if (isActive) return;
    isActive = true;
    stats = { success: 0, errors: 0 }; // Reset stats pagka-start
    
    const { url, interval, numBots } = data;
    for (let i = 0; i < Number(numBots); i++) {
      runBot(i + 1, url, interval);
    }
  });

  socket.on('stop-bots', () => {
    isActive = false;
    io.emit('log', { msg: "SYSTEM: Stopping all bots...", stats });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Dashboard live at port ${PORT}`));
