const http = require('http');
const { WebSocketServer } = require('ws');
const app = require('./app');
const config = require('./config');
const { sequelize } = require('./models');
const WebSocketService = require('./websocket');

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });
const wsService = new WebSocketService(wss);
wsService.startHeartbeat();

sequelize.sync({ alter: false }).then(() => {
  console.log('Database synchronized');
  
  server.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
    console.log(`WebSocket is running on ws://localhost:${config.port}/ws`);
  });
}).catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
