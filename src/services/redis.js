const Redis = require('ioredis');

require('dotenv').config();

const connection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
};

const redisClient = new Redis(connection);

module.exports = {
  redisClient,
  connection
};
