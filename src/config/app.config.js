require('dotenv').config();

// app config
const PORT = process.env.PORT || 4001;

// blockfrost
const blockfrostApiKey = process.env.BLOCKFROST_API_KEY;

module.exports = {
  blockfrostApiKey,
  port: PORT,
};
