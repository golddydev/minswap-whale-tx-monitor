const appConfig = require('./app.config');
const dbConfig = require('./db.config');
const discordConfig = require('./discord.config');

module.exports = {
  app: appConfig,
  db: dbConfig,
  discord: discordConfig,
};
