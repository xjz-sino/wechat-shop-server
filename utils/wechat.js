const axios = require('axios');
const config = require('../config');
const { parseStringPromise } = require('xml2js');

const getWechatOpenId = async (code) => {
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${config.wechat.appId}&secret=${config.wechat.appSecret}&js_code=${code}&grant_type=authorization_code`;
  
  try {
    const response = await axios.get(url);
    if (response.data.errcode) {
      throw new Error(response.data.errmsg);
    }
    return response.data;
  } catch (error) {
    throw new Error('微信登录失败: ' + error.message);
  }
};

const generateNonceStr = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateSign = (params, mchKey) => {
  const sorted = Object.keys(params).sort();
  let signString = '';
  for (const key of sorted) {
    if (params[key] !== '' && params[key] !== null && key !== 'sign') {
      signString += `${key}=${params[key]}&`;
    }
  }
  signString += `key=${mchKey}`;
  const crypto = require('crypto');
  return crypto.createHash('md5').update(signString).digest('hex').toUpperCase();
};

const createWechatPayOrder = async (orderNo, totalFee, description, openid) => {
  const params = {
    appid: config.wechat.appId,
    mch_id: config.wechat.mchId,
    nonce_str: generateNonceStr(),
    body: description,
    out_trade_no: orderNo,
    total_fee: Math.round(totalFee * 100),
    spbill_create_ip: '127.0.0.1',
    notify_url: config.wechat.notifyUrl,
    trade_type: 'JSAPI',
    openid: openid
  };
  
  params.sign = generateSign(params, config.wechat.mchKey);
  
  const xml = `<xml>
    ${Object.entries(params).map(([key, value]) => `<${key}><![CDATA[${value}]]></${key}>`).join('\n')}
  </xml>`;
  
  try {
    const response = await axios.post('https://api.mch.weixin.qq.com/pay/unifiedorder', xml, {
      headers: { 'Content-Type': 'text/xml' }
    });
    
    const result = await parseStringPromise(response.data);
    const returnData = result.xml;
    
    if (returnData.return_code[0] === 'SUCCESS' && returnData.result_code[0] === 'SUCCESS') {
      return {
        prepay_id: returnData.prepay_id[0],
        result_code: 'SUCCESS'
      };
    } else {
      throw new Error(returnData.return_msg ? returnData.return_msg[0] : '统一下单失败');
    }
  } catch (error) {
    console.error('微信支付统一下单失败:', error);
    return {
      result_code: 'FAIL',
      error: error.message
    };
  }
};

const generatePayParams = (prepayId) => {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = generateNonceStr();
  const packageStr = `prepay_id=${prepayId}`;
  
  const signParams = {
    appId: config.wechat.appId,
    timeStamp: timestamp,
    nonceStr: nonceStr,
    package: packageStr,
    signType: 'MD5'
  };
  
  const paySign = generateSign(signParams, config.wechat.mchKey);
  
  return {
    appId: config.wechat.appId,
    timeStamp: timestamp,
    nonceStr: nonceStr,
    package: packageStr,
    signType: 'MD5',
    paySign: paySign
  };
};

const parseWechatNotify = async (xmlData) => {
  try {
    const result = await parseStringPromise(xmlData);
    const data = result.xml;
    return {
      return_code: data.return_code[0],
      return_msg: data.return_msg[0],
      result_code: data.result_code[0],
      transaction_id: data.transaction_id ? data.transaction_id[0] : null,
      out_trade_no: data.out_trade_no[0],
      total_fee: parseInt(data.total_fee[0]) / 100
    };
  } catch (error) {
    throw new Error('解析微信通知失败');
  }
};

module.exports = {
  getWechatOpenId,
  createWechatPayOrder,
  generatePayParams,
  parseWechatNotify,
  generateNonceStr
};
