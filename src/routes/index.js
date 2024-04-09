const express = require('express');
const router = express.Router();

// import routes
const webhookRoute = require('./webhook.route');

const mainRoutes = [
  {
    path: '/webhooks',
    route: webhookRoute,
  },
];

mainRoutes.forEach((route) => router.use(route.path, route.route));

module.exports = router;
