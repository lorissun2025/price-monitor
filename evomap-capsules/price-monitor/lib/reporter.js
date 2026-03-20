/**
 * 报告生成器
 * 
 * 功能：
 * 1. 生成 Markdown 格式的价格监控报告
 * 2. 包含总览、价格趋势、活跃文档、清理建议
 */

import { writeFileSync } from 'fs';

class Reporter {
  constructor() {
    this.reportData = {
      generatedAt: new Date(),
      totalProducts: 0,
      enabledProducts: 0,
      totalSize: 0,
      byType: {},
      byYear: {},
      byMonth: {},
      recent7d: { created: 0, modified: 0 },
      recent30d: { created: 0, modified: 0 },
      activeDocs: [],
      expiredDocs: [],
    };
  }

  /**
   * 生成报告
   */
  generate(products) {
    console.log('📊 正在生成报告...\n');

    this.reportData.totalProducts = products.length;
    this.reportData.enabledProducts = products.filter(p => p.enabled !== false).length;

    // 分析数据
    this.analyzeProducts(products);

    // 生成 Markdown
    const markdown = this.createMarkdown();

    // 保存到文件
    const outputFile = this.reportData.outputFile || 'price-report.md';
    writeFileSync(outputFile, markdown);

    console.log(`✅ 报告已保存到：${outputFile}\n`);

    return markdown;
  }

  /**
   * 分析产品数据
   */
  analyzeProducts(products) {
    const stats = this.reportData;

    for (const product of products) {
      // 总大小
      stats.totalSize += product.size || 0;

      // 按类型统计
      const type = product.type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // 按年份统计
      if (product.created_at) {
        const year = new Date(product.created_at).getFullYear();
        stats.byYear[year] = (stats.byYear[year] || 0) + 1;

        // 按月份统计
        const date = new Date(product.created_at);
        const month = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;

        // 最近 7 天
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (product.created_at > weekAgo) {
          stats.recent7d.created++;
        }

        // 最近 30 天
        const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (product.created_at > monthAgo) {
          stats.recent30d.created++;
        }
      }

      // 最近修改
      if (product.modified_at) {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (product.modified_at > weekAgo) {
          stats.recent7d.modified++;
        }

        const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (product.modified_at > monthAgo) {
          stats.recent30d.modified++;
        }

        // 活跃文档（最近 30 天修改过）
        stats.activeDocs.push(product);
      }
    }

    // 排序活跃文档
    stats.activeDocs.sort((a, b) => b.modified_at - a.modified_at);
    stats.activeDocs = stats.activeDocs.slice(0, 20); // Top 20
  }

  /**
   * 生成 Markdown
   */
  createMarkdown() {
    const stats = this.reportData;

    return `# 📊 价格监控报告

**生成时间：** ${new Date().toLocaleString('zh-CN')}
**监控商品：** ${stats.totalProducts} 个
**启用监控：** ${stats.enabledProducts} 个

---

## 📈 总览

- **商品总数：** ${stats.totalProducts} 个
- **总大小：** ${this.formatSize(stats.totalSize)}
- **类型分布：**
${this.formatTypeDistribution()}

---

## 🕒 时间趋势

### 最近 7 天
- **创建：** ${stats.recent7d.created} 个
- **修改：** ${stats.recent7d.modified} 次

### 最近 30 天
- **创建：** ${stats.recent30d.created} 个
- **修改：** ${stats.recent30d.modified} 次

---

## 🏆 最活跃商品（Top ${stats.activeDocs.length}）

| 排名 | 商品名称 | 平台 | 当前价格 | 修改次数 | 最近修改 |
|------|---------|------|---------|---------|---------|
${this.formatActiveDocs()}

---

## 📅 按年份统计

| 年份 | 商品数量 |
|------|---------|
${this.formatByYear()}

---

## 📅 按月份统计

| 月份 | 商品数量 |
|------|---------|
${this.formatByMonth()}

---

**报告结束**

---
*由 竞品价格监控系统自动生成*
`;
  }

  /**
   * 格式化类型分布
   */
  formatTypeDistribution() {
    const types = Object.entries(this.reportData.byType)
      .sort((a, b) => b[1] - a[1]);

    if (types.length === 0) {
      return '   暂无数据';
    }

    return types.map(([type, count]) => {
      const percent = (count / this.reportData.totalProducts * 100).toFixed(1);
      return `   - **${type}**：${count} 个 (${percent}%)`;
    }).join('\n');
  }

  /**
   * 格式化活跃文档
   */
  formatActiveDocs() {
    return this.reportData.activeDocs.map((doc, index) => {
      return `| ${index + 1} | ${doc.name || doc.title || '未知'} | ${doc.platform || '未知'} | ¥${doc.currentPrice || doc.price || 0} | ${doc.modifiedCount || 0} | ${new Date(doc.modified_at).toLocaleString('zh-CN')} |`;
    }).join('\n');
  }

  /**
   * 格式化按年份统计
   */
  formatByYear() {
    const years = Object.entries(this.reportData.byYear)
      .sort((a, b) => a[0] - b[0]);

    if (years.length === 0) {
      return '   暂无数据';
    }

    return years.map(([year, count]) => {
      return `| ${year} | ${count} 个 |`;
    }).join('\n');
  }

  /**
   * 格式化按月份统计
   */
  formatByMonth() {
    const months = Object.entries(this.reportData.byMonth)
      .sort((a, b) => a[0] - b[0])
      .slice(-12); // 最近 12 个月

    if (months.length === 0) {
      return '   暂无数据';
    }

    return months.map(([month, count]) => {
      return `| ${month} | ${count} 个 |`;
    }).join('\n');
  }

  /**
   * 格式化文件大小
   */
  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
}

export default Reporter;
