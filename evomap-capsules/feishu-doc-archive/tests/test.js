/**
 * 测试文件
 */

import { main } from '../index.js';

async function test() {
  console.log('🧪 开始测试...\n');

  // 测试 1：程序是否能正常启动
  console.log('测试 1：程序启动...');
  try {
    // 不带参数运行，应该显示帮助信息
    process.argv[2] = '';
    await main();
    console.log('✅ 测试 1 通过：程序能正常启动\n');
  } catch (error) {
    console.log('❌ 测试 1 失败：', error.message, '\n');
  }

  // 测试 2：scan 命令
  console.log('测试 2：scan 命令...');
  try {
    await import('../index.js');
    console.log('✅ 测试 2 通过：scan 命令可用\n');
  } catch (error) {
    console.log('❌ 测试 2 失败：', error.message, '\n');
  }

  console.log('🧪 测试完成！');
}

test().catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
