const { Session, Message, User, Admin } = require('../models');
const { verifyToken } = require('../utils/jwt');
const { v4: uuidv4 } = require('uuid');

class WebSocketService {
  constructor(wss) {
    this.wss = wss;
    this.clients = new Map();
    this.userSessions = new Map();
    
    wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
  }

  async handleConnection(ws, req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      ws.close(4001, 'Invalid token');
      return;
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      ws.close(4001, 'User not found');
      return;
    }

    this.clients.set(user.id, ws);
    this.userSessions.set(user.id, user.id);

    ws.userId = user.id;
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleMessage(ws, message);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      this.clients.delete(user.id);
      this.userSessions.delete(user.id);
    });

    this.send(ws, { type: 'connected', data: { userId: user.id } });

    let session = await Session.findOne({
      where: { user_id: user.id, status: 1 },
      order: [['created_at', 'DESC']]
    });

    if (!session) {
      session = await Session.create({
        session_no: 'S' + Date.now() + uuidv4(8),
        user_id: user.id,
        status: 0
      });
    }

    const historyMessages = await Message.findAll({
      where: { session_id: session.id },
      order: [['created_at', 'ASC']],
      limit: 50
    });

    this.send(ws, {
      type: 'history',
      data: {
        sessionId: session.id,
        messages: historyMessages.map(m => ({
          id: m.id,
          senderType: m.sender_type,
          senderId: m.sender_id,
          messageType: m.message_type,
          content: m.content,
          createdAt: m.created_at
        }))
      }
    });
  }

  async handleMessage(ws, message) {
    const { type, data } = message;

    switch (type) {
      case 'text':
        await this.handleTextMessage(ws, data);
        break;
      case 'image':
        await this.handleImageMessage(ws, data);
        break;
      case 'ping':
        this.send(ws, { type: 'pong' });
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  async handleTextMessage(ws, data) {
    const { content, sessionId } = data;

    let session;
    if (sessionId) {
      session = await Session.findByPk(sessionId);
    }

    if (!session) {
      session = await Session.findOne({
        where: { user_id: ws.userId, status: 1 }
      });
    }

    if (!session) {
      session = await Session.create({
        session_no: 'S' + Date.now() + uuidv4(8),
        user_id: ws.userId,
        status: 0
      });
    }

    const msg = await Message.create({
      session_id: session.id,
      sender_type: 'user',
      sender_id: ws.userId,
      message_type: 'text',
      content
    });

    await session.update({ last_message_time: new Date() });

    this.send(ws, {
      type: 'message',
      data: {
        id: msg.id,
        senderType: 'user',
        content,
        createdAt: msg.created_at
      }
    });

    this.broadcastToAdmins({
      type: 'new_message',
      data: {
        sessionId: session.id,
        userId: ws.userId,
        message: {
          id: msg.id,
          senderType: 'user',
          content,
          createdAt: msg.created_at
        }
      }
    });
  }

  async handleImageMessage(ws, data) {
    const { imageUrl, sessionId } = data;

    let session;
    if (sessionId) {
      session = await Session.findByPk(sessionId);
    }

    if (!session) {
      session = await Session.findOne({
        where: { user_id: ws.userId, status: 1 }
      });
    }

    if (!session) {
      session = await Session.create({
        session_no: 'S' + Date.now() + uuidv4(8),
        user_id: ws.userId,
        status: 0
      });
    }

    const msg = await Message.create({
      session_id: session.id,
      sender_type: 'user',
      sender_id: ws.userId,
      message_type: 'image',
      content: imageUrl
    });

    await session.update({ last_message_time: new Date() });

    this.send(ws, {
      type: 'message',
      data: {
        id: msg.id,
        senderType: 'user',
        messageType: 'image',
        content: imageUrl,
        createdAt: msg.created_at
      }
    });

    this.broadcastToAdmins({
      type: 'new_message',
      data: {
        sessionId: session.id,
        userId: ws.userId,
        message: {
          id: msg.id,
          senderType: 'user',
          messageType: 'image',
          content: imageUrl,
          createdAt: msg.created_at
        }
      }
    });
  }

  send(ws, message) {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcastToAdmins(message) {
    this.wss.clients.forEach(client => {
      if (client.adminId && client.readyState === 1) {
        client.send(JSON.stringify(message));
      }
    });
  }

  sendToUser(userId, message) {
    const client = this.clients.get(userId);
    if (client) {
      this.send(client, message);
    }
  }

  startHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach(ws => {
        if (!ws.isAlive) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }
}

module.exports = WebSocketService;
