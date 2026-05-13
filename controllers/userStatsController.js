const { User, Order, sequelize } = require('../models');
const { Op } = require('sequelize');

const userStatsController = {
  // 获取用户数据监控统计
  async getUserStats(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const last7Days = new Date(today);
      last7Days.setDate(last7Days.getDate() - 6);
      
      const last30Days = new Date(today);
      last30Days.setDate(last30Days.getDate() - 29);
      
      // 1. 新用户统计
      const newUsersToday = await User.count({
        where: { created_at: { [Op.gte]: today } }
      });
      
      const newUsersYesterday = await User.count({
        where: { 
          created_at: { 
            [Op.gte]: yesterday,
            [Op.lt]: today
          } 
        }
      });
      
      const newUsersLast7Days = await User.count({
        where: { created_at: { [Op.gte]: last7Days } }
      });
      
      const newUsersLast30Days = await User.count({
        where: { created_at: { [Op.gte]: last30Days } }
      });
      
      const totalUsers = await User.count();
      
      // 2. 用户留存统计（7日留存）
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const eightDaysAgo = new Date(today);
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      
      // 获取7天前注册的用户数
      const usersRegistered7DaysAgo = await User.count({
        where: {
          created_at: {
            [Op.gte]: sevenDaysAgo,
            [Op.lt]: new Date(sevenDaysAgo.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      });
      
      // 获取这些用户中有订单的用户数（活跃）
      const activeUsersFrom7DaysAgo = await Order.count({
        distinct: true,
        col: 'user_id',
        where: {
          user_id: {
            [Op.in]: sequelize.literal(`(SELECT id FROM users WHERE created_at >= '${sevenDaysAgo.toISOString().slice(0, 19).replace('T', ' ')}' AND created_at < '${new Date(sevenDaysAgo.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')}')`)
          },
          created_at: { [Op.gte]: sevenDaysAgo }
        }
      });
      
      const retentionRate7Days = usersRegistered7DaysAgo > 0 
        ? Math.round((activeUsersFrom7DaysAgo / usersRegistered7DaysAgo) * 100)
        : 0;
      
      // 3. 推荐统计
      const referralStats = await User.findAll({
        attributes: [
          'referrer_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'referral_count']
        ],
        where: { referrer_id: { [Op.not]: null } },
        group: ['referrer_id'],
        raw: true
      });
      
      const totalReferrals = referralStats.reduce((sum, item) => sum + parseInt(item.referral_count), 0);
      const usersWithReferrals = referralStats.length;
      
      // 4. 每日新用户趋势（最近7天）
      const dailyNewUsers = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const count = await User.count({
          where: {
            created_at: {
              [Op.gte]: date,
              [Op.lt]: nextDate
            }
          }
        });
        
        dailyNewUsers.push({
          date: date.toISOString().slice(0, 10),
          count
        });
      }
      
      // 5. 推荐排行榜（前10名）- 使用原始查询
      const [referralLeaderboard] = await sequelize.query(`
        SELECT 
          u.id,
          u.nickname,
          u.avatar,
          COUNT(r.id) as referral_count
        FROM users u
        LEFT JOIN users r ON u.id = r.referrer_id
        WHERE r.referrer_id IS NOT NULL
        GROUP BY u.id
        ORDER BY referral_count DESC
        LIMIT 10
      `);
      
      res.json({
        code: 0,
        message: 'success',
        data: {
          newUsers: {
            today: newUsersToday,
            yesterday: newUsersYesterday,
            last7Days: newUsersLast7Days,
            last30Days: newUsersLast30Days,
            total: totalUsers
          },
          retention: {
            rate7Days: retentionRate7Days,
            registered7DaysAgo: usersRegistered7DaysAgo,
            activeUsers: activeUsersFrom7DaysAgo
          },
          referrals: {
            total: totalReferrals,
            usersWithReferrals: usersWithReferrals,
            leaderboard: referralLeaderboard.map(item => ({
              id: item.id,
              nickname: item.nickname || '微信用户',
              avatar: item.avatar,
              referralCount: parseInt(item.referral_count)
            }))
          },
          dailyTrend: dailyNewUsers
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  },
  
  // 获取用户详细列表（带推荐信息）
  async getUsersWithStats(req, res) {
    try {
      const { page = 1, size = 10, keyword = '' } = req.query;
      const offset = (page - 1) * size;
      
      const where = {};
      if (keyword) {
        where[Op.or] = [
          { nickname: { [Op.like]: `%${keyword}%` } },
          { phone: { [Op.like]: `%${keyword}%` } }
        ];
      }
      
      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: [
          'id',
          'nickname',
          'avatar',
          'phone',
          'openid',
          'referrer_id',
          'status',
          'created_at'
        ],
        include: [
          {
            model: User,
            as: 'referrer',
            attributes: ['id', 'nickname'],
            required: false
          },
          {
            model: User,
            as: 'referred',
            attributes: ['id'],
            required: false
          }
        ],
        distinct: true,
        limit: parseInt(size),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });
      
      const usersWithStats = rows.map(user => ({
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        openid: user.openid,
        referrer: user.referrer ? {
          id: user.referrer.id,
          nickname: user.referrer.nickname
        } : null,
        referralCount: user.referred ? user.referred.length : 0,
        status: user.status,
        created_at: user.created_at
      }));
      
      res.json({
        code: 0,
        message: 'success',
        data: {
          list: usersWithStats,
          total: count
        }
      });
    } catch (error) {
      console.error('Get users with stats error:', error);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  }
};

module.exports = userStatsController;
