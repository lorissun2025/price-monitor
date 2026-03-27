// taobao.js
async function fetchPrice(productId) {
  return {
    platform: 'taobao', productId, name: `淘宝商品 ${productId}`,
    price: Math.round(Math.random() * 8000 * 100) / 100,
    time: new Date().toISOString(), source: 'mock',
  };
}
module.exports = { fetchPrice };
