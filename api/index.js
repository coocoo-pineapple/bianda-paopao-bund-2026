// Vercel Serverless Function 入口，复用本地 Express 应用。
module.exports = require('../server/index').app;
