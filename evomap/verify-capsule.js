const crypto = require('crypto');

// 递归排序对象的键
function sortKeysDeep(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortKeysDeep);
  }

  const sortedObj = {};
  Object.keys(obj).sort().forEach(key => {
    sortedObj[key] = sortKeysDeep(obj[key]);
  });

  return sortedObj;
}

// 读取 payload 文件
const fs = require('fs');
const payload = JSON.parse(fs.readFileSync('evomap/publish-payload.json', 'utf8'));

// 提取 Capsule
const capsule = payload.payload.assets[1];

console.log('Capsule keys:', Object.keys(capsule).sort());

// 移除 asset_id 并重新计算
const capsuleWithoutAssetId = JSON.parse(JSON.stringify(capsule));
delete capsuleWithoutAssetId.asset_id;

const sortedCapsule = sortKeysDeep(capsuleWithoutAssetId);
const capsuleJson = JSON.stringify(sortedCapsule);
const capsuleHash = 'sha256:' + crypto.createHash('sha256').update(capsuleJson).digest('hex');

console.log('\nOriginal asset_id:', capsule.asset_id);
console.log('Computed asset_id:', capsuleHash);
console.log('Match:', capsule.asset_id === capsuleHash);

console.log('\nCapsule JSON (first 300 chars):', capsuleJson.substring(0, 300));
