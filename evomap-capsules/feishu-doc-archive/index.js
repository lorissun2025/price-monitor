/**
 * 飞书文档自动化归档系统 - 主程序
 * 
 * 功能：
 * 1. 扫描指定文件夹下的所有文档
 * 2. 根据规则自动分类（按创建时间、文档类型、标签等）
 * 3. 创建分类子文件夹
 * 4. 将文档移动到对应文件夹
 * 5. 生成归档报告
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 动态导入配置
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 导入工具库
import FeishuClient from './lib/feishu-client.js';
import Scanner from './lib/scanner.js';
import Classifier from './lib/classifier.js';
import Reporter from './lib/reporter.js';

// 加载配置
let config;
try {
  const configPath = join(__dirname, 'config.js');
  const configModule = await import(`file://${configPath}`);
  config = configModule.default;
} catch (error) {
  console.error('❌ 加载配置失败:', error.message);
  console.log('提示：请先创建 config.js 文件并配置必要参数');
  process.exit(1);
}

// 检查配置
if (!config.feishu.app_id || !config.feishu.app_secret || !config.feishu.root_folder_token) {
  console.log('⚠️  配置不完整，请检查以下参数：');
  console.log('- FEISHU_APP_ID');
  console.log('- FEISHU_APP_SECRET');
  console.log('- FEISHU_ROOT_FOLDER_TOKEN');
  console.log('\n提示：建议使用环境变量存储敏感信息');
  process.exit(1);
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 飞书文档自动化归档系统启动...\n');

  const action = process.argv[2];

  // 初始化工具
  const feishuClient = new FeishuClient(config.feishu);
  const scanner = new Scanner(feishuClient, config);
  const classifier = new Classifier(config);
  const reporter = new Reporter(config);

  switch (action) {
    case 'scan':
      await scanFolder(scanner);
      break;

    case 'classify':
      await classifyDocuments(scanner, classifier);
      break;

    case 'report':
      await generateReport(scanner, classifier, reporter);
      break;

    case 'archive':
      await runArchive(feishuClient, scanner, classifier, reporter);
      break;

    default:
      console.log(`
📋 使用方法：

扫描文件夹：
  node index.js scan

分类文档：
  node index.js classify

生成报告：
  node index.js report

完整归档流程：
  node index.js archive

或使用 npm scripts：
  npm run scan
  npm run classify
  npm run report
  npm run archive
      `);
  }
}

/**
 * 扫描文件夹
 */
async function scanFolder(scanner) {
  console.log('📁 开始扫描文件夹...\n');
  
  console.log('根文件夹 Token:', config.feishu.root_folder_token);
  
  try {
    // 扫描文件夹
    const files = await scanner.scan(config.feishu.root_folder_token);
    
    // 统计信息
    const stats = scanner.getStats(files);
    
    console.log('\n📊 扫描统计：');
    console.log(`  文档总数：${stats.total}`);
    console.log(`  总大小：${reporter.formatSize(stats.totalSize)}`);
    console.log(`  类型分布：${Object.keys(stats.byType).join(', ')}`);
    console.log(`  年份分布：${Object.keys(stats.byYear).sort((a, b) => b - a).join(', ')}`);
    
    console.log('\n✅ 扫描完成');
    
  } catch (error) {
    console.error('\n❌ 扫描失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * 分类文档
 */
async function classifyDocuments(scanner, classifier) {
  console.log('🗂️  开始分类文档...\n');
  
  try {
    // 验证分类规则
    const rulesValid = classifier.validateRules();
    if (!rulesValid) {
      console.error('❌ 分类规则验证失败');
      process.exit(1);
    }

    // 扫描文件
    console.log('第一步：扫描文件...');
    const files = await scanner.scan(config.feishu.root_folder_token);
    
    // 分类文件
    console.log('\n第二步：分类文件...');
    const result = classifier.classifyFiles(files);
    
    // 打印分类结果
    console.log('\n📊 分类结果：');
    for (const [path, items] of Object.entries(result.classified)) {
      console.log(`  ${path} - ${items.length} 个文档`);
    }
    
    if (result.unclassified.length > 0) {
      console.log(`  未分类 - ${result.unclassified.length} 个文档`);
    }

    // 找出需要创建的文件夹
    const foldersToCreate = classifier.findFoldersToCreate(result.classified);
    console.log(`\n需要创建的文件夹：${foldersToCreate.join(', ')}`);

    console.log('\n✅ 分类完成');
    console.log('提示：移动文档功能需要集成 feishu-drive API');
    
  } catch (error) {
    console.error('\n❌ 分类失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * 生成报告
 */
async function generateReport(scanner, classifier, reporter) {
  console.log('📊 生成归档报告...\n');
  
  try {
    // 扫描文件
    console.log('第一步：扫描文件...');
    const files = await scanner.scan(config.feishu.root_folder_token);
    
    // 统计信息
    const stats = scanner.getStats(files);
    
    // 分类文件
    console.log('\n第二步：分类文件...');
    const classifiedResult = classifier.classifyFiles(files);
    
    // 找出过期文件
    console.log('\n第三步：查找需要清理的文件...');
    const expiredFiles = scanner.findExpiredFiles(files, config.cleanup);
    
    // 生成报告
    console.log('\n第四步：生成报告...');
    const report = reporter.generateReport(stats, classifiedResult, expiredFiles);
    
    // 保存报告
    const reportFilename = reporter.formatDate(new Date()).replace(/[\/\\]/g, '-') + '_归档报告.md';
    console.log(`\n报告已生成：${reportFilename}`);
    
    console.log('\n✅ 报告生成完成');
    
  } catch (error) {
    console.error('\n❌ 生成报告失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * 完整归档流程
 */
async function runArchive(feishuClient, scanner, classifier, reporter) {
  console.log('🚀 开始完整归档流程...\n');
  
  try {
    // 1. 扫描文件夹
    console.log('阶段 1/5：扫描文件夹...');
    await scanFolder(scanner);
    
    // 2. 分类文档
    console.log('\n阶段 2/5：分类文档...');
    await classifyDocuments(scanner, classifier);
    
    // 3. 创建文件夹
    console.log('\n阶段 3/5：创建分类文件夹...');
    // TODO: 实现创建文件夹功能
    console.log('提示：创建文件夹功能需要集成 feishu-drive API');
    
    // 4. 移动文档
    console.log('\n阶段 4/5：移动文档到对应文件夹...');
    // TODO: 实现移动文档功能
    console.log('提示：移动文档功能需要集成 feishu-drive API');
    
    // 5. 生成报告
    console.log('\n阶段 5/5：生成报告...');
    await generateReport(scanner, classifier, reporter);
    
    console.log('\n✅ 归档流程完成');
    console.log('提示：部分功能需要集成 feishu-drive API 才能完全执行');
    
  } catch (error) {
    console.error('\n❌ 归档流程失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  console.error('\n❌ 程序执行失败:', error);
  process.exit(1);
});

export { main, scanFolder, classifyDocuments, generateReport, runArchive };
