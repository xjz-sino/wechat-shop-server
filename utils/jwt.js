const jwt = require('jsonwebtoken');
const config = require('../config');

const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (err) {
    return null;
  }
};

const generateAdminToken = (adminId, role) => {
  return jwt.sign({ adminId, role }, config.jwtAdmin.secret, { expiresIn: config.jwtAdmin.expiresIn });
};

const verifyAdminToken = (token) => {
  try {
    return jwt.verify(token, config.jwtAdmin.secret);
  } catch (err) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  generateAdminToken,
  verifyAdminToken
};
