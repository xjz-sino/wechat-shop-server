const { Session, Message, User, sequelize } = require('../models');
const { Op } = require('sequelize');

const chatController = {
  // 获取或创建会话（小程序端）
  async getOrCreateSession(req, res) {
    try {
      const userId = req.userId;
      
      // 查找现有活跃会话
      let session = await Session.findOne({
        where: { user_id: userId, status: 1 }
      });
      
      // 如果没有活跃会话，创建新会话
      if (!session) {
        session = await Session.create({
          user_id: userId,
          status: 1
        });
      }
      
      res.json({
        code: 0,
        message: 'success',
        data: { sessionId: session.id }
      });
    } catch (error) {
      console.error('Get or create session error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  // 发送消息（小程序端）
  async sendMessage(req, res) {
    try {
      const { sessionId, content } = req.body;
      const userId = req.userId;
      
      // 验证会话是否存在且属于当前用户
      const session = await Session.findOne({
        where: { id: sessionId, user_id: userId }
      });
      
      if (!session) {
        return res.status(404).json({ code: 404, message: '会话不存在' });
      }
      
      // 创建消息
      const message = await Message.create({
        session_id: sessionId,
        sender_type: 1, // 1: 用户
        sender_id: userId,
        content: content,
        msg_type: 1 // 1: 文本
      });
      
      // 更新会话最后消息时间
      await session.update({ updated_at: new Date() });
      
      res.json({
        code: 0,
        message: 'success',
        data: {
          id: message.id,
          content: message.content,
          senderType: message.sender_type,
          createdAt: message.created_at
        }
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  // 获取消息历史（小程序端）
  async getMessages(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.userId;
      const { page = 1, size = 20 } = req.query;
      const offset = (page - 1) * size;
      
      // 验证会话权限
      const session = await Session.findOne({
        where: { id: sessionId, user_id: userId }
      });
      
      if (!session) {
        return res.status(404).json({ code: 404, message: '会话不存在' });
      }
      
      const { count, rows } = await Message.findAndCountAll({
        where: { session_id: sessionId },
        order: [['created_at', 'DESC']],
        limit: parseInt(size),
        offset: parseInt(offset)
      });
      
      res.json({
        code: 0,
        message: 'success',
        data: {
          list: rows.map(msg => ({
            id: msg.id,
            content: msg.content,
            senderType: msg.sender_type,
            createdAt: msg.created_at
          })).reverse(),
          total: count
        }
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  // 获取所有会话列表（后台管理）
  async getAllSessions(req, res) {
    try {
      const { status = '', keyword = '' } = req.query;
      
      const where = {};
      if (status !== '') {
        where.status = status;
      }
      
      const sessions = await Session.findAll({
        where,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar'],
          where: keyword ? {
            [Op.or]: [
              { nickname: { [Op.like]: `%${keyword}%` } }
            ]
          } : undefined,
          required: !!keyword
        }],
        order: [['updated_at', 'DESC']]
      });
      
      // 获取每个会话的最后一条消息和未读消息数
      const sessionsWithStats = await Promise.all(
        sessions.map(async (session) => {
          const lastMessage = await Message.findOne({
            where: { session_id: session.id },
            order: [['created_at', 'DESC']]
          });
          
          const unreadCount = await Message.count({
            where: {
              session_id: session.id,
              sender_type: 1, // 用户发送的
              is_read: 0
            }
          });
          
          return {
            id: session.id,
            userId: session.user_id,
            user: session.user,
            status: session.status,
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              senderType: lastMessage.sender_type,
              createdAt: lastMessage.created_at
            } : null,
            unreadCount,
            createdAt: session.created_at,
            updatedAt: session.updated_at
          };
        })
      );
      
      res.json({
        code: 0,
        message: 'success',
        data: sessionsWithStats
      });
    } catch (error) {
      console.error('Get all sessions error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  // 获取会话消息详情（后台管理）
  async getSessionMessages(req, res) {
    try {
      const { sessionId } = req.params;
      
      const session = await Session.findByPk(sessionId, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar']
        }]
      });
      
      if (!session) {
        return res.status(404).json({ code: 404, message: '会话不存在' });
      }
      
      const messages = await Message.findAll({
        where: { session_id: sessionId },
        order: [['created_at', 'ASC']]
      });
      
      // 标记用户消息为已读
      await Message.update(
        { is_read: 1 },
        { where: { session_id: sessionId, sender_type: 1, is_read: 0 } }
      );
      
      res.json({
        code: 0,
        message: 'success',
        data: {
          session: {
            id: session.id,
            user: session.user,
            status: session.status,
            createdAt: session.created_at
          },
          messages: messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            senderType: msg.sender_type,
            senderId: msg.sender_id,
            isRead: msg.is_read,
            createdAt: msg.created_at
          }))
        }
      });
    } catch (error) {
      console.error('Get session messages error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  // 客服回复消息（后台管理）
  async replyMessage(req, res) {
    try {
      const { sessionId, content } = req.body;
      const adminId = req.adminId; // 从管理员token中获取
      
      const session = await Session.findByPk(sessionId);
      if (!session) {
        return res.status(404).json({ code: 404, message: '会话不存在' });
      }
      
      const message = await Message.create({
        session_id: sessionId,
        sender_type: 2, // 2: 客服
        sender_id: adminId,
        content: content,
        msg_type: 1,
        is_read: 1
      });
      
      // 更新会话时间
      await session.update({ updated_at: new Date() });
      
      res.json({
        code: 0,
        message: 'success',
        data: {
          id: message.id,
          content: message.content,
          senderType: message.sender_type,
          createdAt: message.created_at
        }
      });
    } catch (error) {
      console.error('Reply message error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  // 关闭会话（后台管理）
  async closeSession(req, res) {
    try {
      const { sessionId } = req.params;
      
      const session = await Session.findByPk(sessionId);
      if (!session) {
        return res.status(404).json({ code: 404, message: '会话不存在' });
      }
      
      await session.update({ status: 0 });
      
      res.json({
        code: 0,
        message: '会话已关闭'
      });
    } catch (error) {
      console.error('Close session error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  // 获取未读消息数（后台管理）
  async getUnreadCount(req, res) {
    try {
      const count = await Message.count({
        where: {
          sender_type: 1,
          is_read: 0
        }
      });
      
      res.json({
        code: 0,
        message: 'success',
        data: { count }
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  }
};

module.exports = chatController;
