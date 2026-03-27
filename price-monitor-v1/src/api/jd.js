// api/jd.js - 京东价格获取（模拟数据 + 真实接口框架）
const MOCK_PRICES = {
  '100012043978': { name: 'Apple iPhone 15 Pro 256GB', base: 7999 },
  '100046343580': { name: 'Sony WH-1000XM5 降噪耳机', base: 2499 },
};

async function fetchPrice(productId) {
  const mock = MOCK_PRICES[productId];
  const base = mock ? mock.base : 3000;
  const name = mock ? mock.name : `JD Product ${productId}`;
  const fluctuation = (Math.random() - 0.5) * base * 0.1;
  return {
    platform: 'jd',
    productId,
    name,
    price: Math.round((base + fluctuation) * 100) / 100,
    time: new Date().toISOString(),
    source: 'mock',
  };
}

module.exports = { fetchPrice };
