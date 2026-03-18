const serverlessHttp = require('serverless-http');
const app = require('./server');

module.exports.handler = serverlessHttp(app);
