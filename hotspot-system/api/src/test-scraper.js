// 测试数据抓取

import { fetchAllHotspots } from './services/scraper.js';
import { updateHotspots, readHotspots } from './services/storage.js';

console.log('🧪 开始测试数据抓取...\n');

// 测试抓取
fetchAllHotspots()
  .then(result => {
    console.log('\n📊 抓取结果:');
    console.log(`  - 成功: ${result.success}`);
    console.log(`  - 热点数: ${result.hotspots.length}`);
    console.log(`  - 耗时: ${result.duration} 秒`);
    console.log(`  - 失败数: ${result.errors.length}`);

    // 显示前 3 个热点
    if (result.hotspots.length > 0) {
      console.log('\n📌 示例热点:');
      result.hotspots.slice(0, 3).forEach((h, i) => {
        console.log(`  ${i + 1}. [${h.platform}] ${h.title}`);
        console.log(`     - 类型: ${h.type}, 影响: ${h.influenceScore.toFixed(2)}`);
        console.log(`     - 位置: ${h.location.city}, ${h.location.district}`);
      });
    }

    // 保存数据
    console.log('\n💾 正在保存数据...');
    const saveResult = updateHotspots(result.hotspots);

    console.log('\n✅ 保存完成:');
    console.log(`  - 新增: ${saveResult.added}`);
    console.log(`  - 保留: ${saveResult.kept}`);
    console.log(`  - 重复: ${saveResult.duplicates}`);
    console.log(`  - 总计: ${saveResult.total}`);

    // 显示最终统计
    const finalData = readHotspots();
    console.log(`\n📈 最终统计:`);
    console.log(`  - 总热点: ${finalData.hotspots.length}`);
    console.log(`  - 更新时间: ${finalData.lastUpdate}`);

    // 按平台统计
    const platformCount = {};
    finalData.hotspots.forEach(h => {
      platformCount[h.platform] = (platformCount[h.platform] || 0) + 1;
    });
    console.log('\n  平台分布:');
    Object.entries(platformCount).forEach(([platform, count]) => {
      console.log(`    - ${platform}: ${count}`);
    });

    console.log('\n🎉 测试完成！');

  })
  .catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });
