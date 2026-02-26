export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '30d',
  },
  yookassa: {
    shopId: process.env.YOOKASSA_SHOP_ID || '',
    secretKey: process.env.YOOKASSA_SECRET_KEY || '',
    webhookSecret: process.env.YOOKASSA_WEBHOOK_SECRET || '',
  },
});
