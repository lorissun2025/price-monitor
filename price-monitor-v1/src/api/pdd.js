// pdd.js
async function fetchPrice(productId) {
  return {
    platform: 'pdd', productId, name: `拼多多商品 ${productId}`,
    price: Math.round(Math.random() * 6000 * 100) / 100,
    time: new Date().toISOString(), source: 'mock',
  };
}
module.exports = { fetchPrice };
