const express = require('express');
const app = express();
const { app: appConfig, db: dbConfig } = require('./config');
const helmet = require('helmet');

// import utilities
const cors = require('cors');
const httpStatus = require('http-status');

// import routes
const routes = require('./routes');

// middlewares
app.use(cors()); // use cors
app.use(helmet()); // use helmet
app.use(express.json()); // parse requests of content-type - application/json
app.use(express.urlencoded({ extended: true })); // parse requests of content-type - application/x-www-form-urlencoded

// simple route
app.get('/', (_, res) => {
  res.json({ message: 'Welcome to cardano whales backend.' });
});

// main routes
app.use('/api', routes);

// unknown routes
app.use((_, res) => {
  res.status(httpStatus.NOT_FOUND).send({ message: 'URL NOT FOUND' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
