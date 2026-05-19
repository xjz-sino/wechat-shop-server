const express = require('express');
const cors = require('cors');
const path = require('path');

const config = require('./config');
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/product');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');
const reviewRoutes = require('./routes/review');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');
const serviceRoutes = require('./routes/service');
const returnRoutes = require('./routes/return');
const adminReturnRoutes = require('./routes/adminReturn');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req, res, next) => {
  if (req.method === 'POST' && req.url === '/api/payment/wx/notify') {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
});

app.use('/api', userRoutes);
app.use('/api', productRoutes);
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);
app.use('/api', reviewRoutes);
app.use('/api', paymentRoutes);
app.use('/admin', adminRoutes);
app.use('/api', serviceRoutes);
app.use('/api', returnRoutes);
app.use('/admin', adminReturnRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  if (err.name === 'MulterError') {
    return res.status(400).json({ code: 400, message: err.message });
  }
  res.status(500).json({ code: 500, message: '服务器内部错误: ' + err.message });
});

app.get('/', (req, res) => {
  res.json({ message: 'Wechat Shop API Server', version: '1.0.0' });
});

module.exports = app;
