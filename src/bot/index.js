const { Client, Events, GatewayIntentBits } = require('discord.js');

// create client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.username}`);
});

// Log in to Discord with your client's token
module.exports = client;
