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

// 提取 Gene
const gene = payload.payload.assets[0];

console.log('Gene keys:', Object.keys(gene).sort());

// 移除 asset_id 并重新计算
const geneWithoutAssetId = JSON.parse(JSON.stringify(gene));
delete geneWithoutAssetId.asset_id;

const sortedGene = sortKeysDeep(geneWithoutAssetId);
const geneJson = JSON.stringify(sortedGene);
const geneHash = 'sha256:' + crypto.createHash('sha256').update(geneJson).digest('hex');

console.log('\nOriginal asset_id:', gene.asset_id);
console.log('Computed asset_id:', geneHash);
console.log('Match:', gene.asset_id === geneHash);

console.log('\nGene JSON (first 300 chars):', geneJson.substring(0, 300));

// 检查 EvolutionEvent
const evolutionEvent = payload.payload.assets[2];
const evolutionEventWithoutAssetId = JSON.parse(JSON.stringify(evolutionEvent));
delete evolutionEventWithoutAssetId.asset_id;

const sortedEvolutionEvent = sortKeysDeep(evolutionEventWithoutAssetId);
const evolutionEventJson = JSON.stringify(sortedEvolutionEvent);
const evolutionEventHash = 'sha256:' + crypto.createHash('sha256').update(evolutionEventJson).digest('hex');

console.log('\nEvolutionEvent original asset_id:', evolutionEvent.asset_id);
console.log('EvolutionEvent computed asset_id:', evolutionEventHash);
console.log('Match:', evolutionEvent.asset_id === evolutionEventHash);
