// amazon.js
async function fetchPrice(asin) {
  return {
    platform: 'amazon', productId: asin, name: `Amazon Product ${asin}`,
    price: Math.round(Math.random() * 500 * 100) / 100,
    priceSymbol: '$',
    time: new Date().toISOString(), source: 'mock',
  };
}
module.exports = { fetchPrice };
