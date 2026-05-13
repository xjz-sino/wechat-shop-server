const { HomeConfig } = require('../models');
const { Op } = require('sequelize');

const homeConfigController = {
  async getConfigs(req, res) {
    try {
      const { type } = req.query;
      const where = type ? { type } : {};

      const configs = await HomeConfig.findAll({
        where,
        order: [['sort', 'ASC'], ['id', 'ASC']]
      });

      res.json({
        code: 0,
        message: 'success',
        data: configs
      });
    } catch (error) {
      console.error('Get home configs error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async createConfig(req, res) {
    try {
      const { type, title, content, sort, status } = req.body;
      
      const config = await HomeConfig.create({ type, title, content, sort: sort || 0, status: status || 1 });
      
      res.json({ code: 0, message: '创建成功', data: config });
    } catch (error) {
      console.error('Create home config error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async updateConfig(req, res) {
    try {
      const { id } = req.params;
      const { type, title, content, sort, status } = req.body;

      await HomeConfig.update({ type, title, content, sort, status }, { where: { id } });

      res.json({ code: 0, message: '更新成功' });
    } catch (error) {
      console.error('Update home config error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },

  async deleteConfig(req, res) {
    try {
      const { id } = req.params;
      await HomeConfig.destroy({ where: { id } });
      res.json({ code: 0, message: '删除成功' });
    } catch (error) {
      console.error('Delete home config error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  }
};

module.exports = homeConfigController;
