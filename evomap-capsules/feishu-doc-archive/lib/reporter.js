/**
 * 报告生成器 - 生成归档报告
 */

import { format } from 'date-fns';

class Reporter {
  constructor(config) {
    this.config = config;
  }

  /**
   * 生成完整报告
   */
  generateReport(stats, classifiedFiles, expiredFiles) {
    console.log('📊 生成归档报告...\n');

    const report = `# 📊 飞书文档归档报告

生成时间：${this.formatDate(new Date())}
归档规则：${this.formatArchiveRules()}

---

## 📈 文档总览

- **文档总数**：${stats.total} 个
- **总大小**：${this.formatSize(stats.totalSize)}
- **类型分布**：
${this.formatTypeDistribution(stats.byType)}

---

## 📅 按年份分布

${this.formatYearDistribution(stats.byYear)}

---

## 📅 按月份分布

${this.formatMonthDistribution(stats.byMonth)}

---

## 🕒 时间趋势

### 最近 7 天
- 创建：${stats.recent7d.created} 个
- 修改：${stats.recent7d.modified} 个
- 删除：0 个（未统计）

### 最近 30 天
- 创建：${stats.recent30d.created} 个
- 修改：${stats.recent30d.modified} 个
- 删除：0 个（未统计）

---

## 🏆 最活跃文档（Top ${stats.activeDocs.length}）

${this.formatActiveDocs(stats.activeDocs)}

---

## 🗂️  分类结果

${this.formatClassifiedFiles(classifiedFiles)}

---

## 🧹 清理建议

${this.formatExpiredFiles(expiredFiles)}

---

## 💡 归档建议

${this.generateArchiveSuggestions(stats, classifiedFiles, expiredFiles)}

---

**报告结束**

---

**说明：**
- 本报告由飞书文档自动化归档系统自动生成
- 如有疑问，请查看系统日志或联系管理员
`;

    console.log('✅ 报告生成完成\n');
    return report;
  }

  /**
   * 格式化归档规则
   */
  formatArchiveRules() {
    const rules = [];
    
    if (this.config.archive.by_year) {
      rules.push('按年份');
    }
    
    if (this.config.archive.by_type) {
      rules.push('按类型');
    }
    
    if (this.config.archive.by_project) {
      rules.push('按项目');
    }

    return rules.join('、') || '无';
  }

  /**
   * 格式化类型分布
   */
  formatTypeDistribution(byType) {
    let output = '';
    
    for (const [type, count] of Object.entries(byType)) {
      const percentage = this.config.archive.total ? ((count / this.config.archive.total) * 100).toFixed(1) : 0;
      output += `  - **${type}**：${count} 个 (${percentage}%)\n`;
    }

    return output || '  - 无数据';
  }

  /**
   * 格式化年份分布
   */
  formatYearDistribution(byYear) {
    const years = Object.keys(byYear).sort((a, b) => b - a);
    
    if (years.length === 0) {
      return '  - 无数据';
    }

    let output = '';
    for (const year of years) {
      output += `  - **${year}**：${byYear[year]} 个文档\n`;
    }

    return output;
  }

  /**
   * 格式化月份分布
   */
  formatMonthDistribution(byMonth) {
    const months = Object.keys(byMonth).sort().reverse();
    
    if (months.length === 0) {
      return '  - 无数据';
    }

    let output = '';
    for (const month of months) {
      output += `  - **${month}**：${byMonth[month]} 个文档\n`;
    }

    return output;
  }

  /**
   * 格式化活跃文档
   */
  formatActiveDocs(activeDocs) {
    if (!activeDocs || activeDocs.length === 0) {
      return '  - 无数据';
    }

    let output = '| 排名 | 文档名称 | 最后修改 | 大小 |\n';
    output += '|------|---------|---------|------|\n';

    for (let i = 0; i < activeDocs.length; i++) {
      const doc = activeDocs[i];
      output += `| ${i + 1} | ${doc.name} | ${this.formatDate(new Date(doc.modified_at))} | ${this.formatSize(doc.size)} |\n`;
    }

    return output;
  }

  /**
   * 格式化分类文件
   */
  formatClassifiedFiles(classifiedFiles) {
    if (!classifiedFiles || Object.keys(classifiedFiles).length === 0) {
      return '  - 无数据';
    }

    let output = '';
    for (const [path, items] of Object.entries(classifiedFiles)) {
      output += `  - **${path}**：${items.length} 个文档\n`;
    }

    return output;
  }

  /**
   * 格式化过期文件
   */
  formatExpiredFiles(expiredFiles) {
    if (!expiredFiles || expiredFiles.length === 0) {
      return '  - 无需要清理的文档';
    }

    let output = '| 文档名称 | 创建时间 | 最后修改 | 大小 | 原因 |\n';
    output += '|---------|---------|---------|------|------|\n';

    for (const file of expiredFiles) {
      output += `| ${file.name} | ${this.formatDate(new Date(file.created_at))} | ${this.formatDate(new Date(file.modified_at))} | ${this.formatSize(file.size)} | ${file.expiredReason} |\n`;
    }

    return output;
  }

  /**
   * 生成归档建议
   */
  generateArchiveSuggestions(stats, classifiedFiles, expiredFiles) {
    const suggestions = [];

    // 建议 1：清理过期文档
    if (expiredFiles && expiredFiles.length > 0) {
      const expiredCount = expiredFiles.filter(f => f.expiredReason.includes('超过')).length;
      const keywordCount = expiredFiles.filter(f => f.expiredReason.includes('标记')).length;
      
      suggestions.push(`### 🧹 清理建议`);
      suggestions.push(``);
      suggestions.push(`- **立即删除**：${keywordCount} 个（标记为需要清理）`);
      suggestions.push(`- **归档到"${this.config.archive.expired_folder_name}"**：${expiredCount} 个（长期未修改）`);
      suggestions.push(``);
    }

    // 建议 2：优化分类规则
    const unclassifiedCount = classifiedFiles.unclassified ? classifiedFiles.unclassified.length : 0;
    if (unclassifiedCount > 0) {
      suggestions.push(`### 🗂️  分类优化建议`);
      suggestions.push(``);
      suggestions.push(`- 有 ${unclassifiedCount} 个文档未被分类`);
      suggestions.push(`- 建议检查分类规则，添加更多关键词`);
      suggestions.push(``);
    }

    // 建议 3：定期归档
    suggestions.push(`### 📅 定期归档建议`);
    suggestions.push(``);
    suggestions.push(`- 建议每周或每月执行一次自动归档`);
    suggestions.push(`- 可以使用 cron 定时任务自动执行`);
    suggestions.push(``);

    if (suggestions.length === 0) {
      return '  - 无建议';
    }

    return suggestions.join('\n');
  }

  /**
   * 格式化日期
   */
  formatDate(date) {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * 格式化文件大小
   */
  formatSize(bytes) {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    } else {
      return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
    }
  }

  /**
   * 保存报告到文件
   */
  async saveReport(report, filename) {
    console.log(`💾 保存报告到：${filename}`);
    
    // TODO: 实现保存报告到飞书云空间
    console.log('提示：需要集成 feishu-drive API 才能保存报告到飞书');
    
    return filename;
  }
}

export default Reporter;
