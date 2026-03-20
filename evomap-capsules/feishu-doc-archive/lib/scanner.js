/**
 * 扫描器 - 扫描飞书云空间中的文件
 */

class Scanner {
  constructor(feishuClient, config) {
    this.feishuClient = feishuClient;
    this.config = config;
    this.scannedFiles = [];
    this.scannedFolders = new Set();
  }

  /**
   * 扫描根文件夹
   */
  async scan(rootFolderToken) {
    console.log('🔍 开始扫描根文件夹...\n');
    
    this.scannedFiles = [];
    this.scannedFolders.clear();
    
    await this.scanFolderRecursive(rootFolderToken, '');
    
    console.log(`\n✅ 扫描完成，共扫描 ${this.scannedFiles.length} 个文件\n`);
    return this.scannedFiles;
  }

  /**
   * 递归扫描文件夹
   */
  async scanFolderRecursive(folderToken, path) {
    if (this.scannedFolders.has(folderToken)) {
      console.log(`⏭️  跳过已扫描的文件夹：${path || folderToken}`);
      return;
    }

    this.scannedFolders.add(folderToken);

    try {
      // 列出文件夹下的文件
      const files = await this.feishuClient.listFiles(folderToken);
      
      console.log(`📁 ${path || '/'} - ${files.length} 个文件`);

      // 处理文件
      for (const file of files) {
        const filePath = path ? `${path}/${file.name}` : file.name;
        
        const fileMetadata = await this.feishuClient.getFileMetadata(file.token);
        
        this.scannedFiles.push({
          token: file.token,
          name: file.name,
          type: file.type,
          size: file.size || 0,
          created_at: file.create_time || null,
          modified_at: file.modified_time || null,
          parent_token: folderToken,
          path: filePath,
          metadata: fileMetadata,
        });
      }

    } catch (error) {
      console.error(`❌ 扫描文件夹失败：${path || folderToken}`, error.message);
    }
  }

  /**
   * 根据规则过滤文件
   */
  filterFiles(files, rules = {}) {
    console.log('🔎 开始过滤文件...\n');

    let filtered = [...files];

    // 按时间过滤
    if (rules.createdAfter) {
      filtered = filtered.filter(f => f.created_at >= rules.createdAfter);
    }

    if (rules.createdBefore) {
      filtered = filtered.filter(f => f.created_at <= rules.createdBefore);
    }

    if (rules.modifiedAfter) {
      filtered = filtered.filter(f => f.modified_at >= rules.modifiedAfter);
    }

    if (rules.modifiedBefore) {
      filtered = filtered.filter(f => f.modified_at <= rules.modifiedBefore);
    }

    // 按关键词过滤
    if (rules.keywords && rules.keywords.length > 0) {
      filtered = filtered.filter(f => {
        const text = `${f.name} ${f.path}`;
        return rules.keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
      });
    }

    // 按类型过滤
    if (rules.types && rules.types.length > 0) {
      filtered = filtered.filter(f => rules.types.includes(f.type));
    }

    console.log(`✅ 过滤完成，从 ${files.length} 个文件中筛选出 ${filtered.length} 个文件\n`);
    return filtered;
  }

  /**
   * 统计文件信息
   */
  getStats(files) {
    const stats = {
      total: files.length,
      totalSize: 0,
      byType: {},
      byYear: {},
      byMonth: {},
      recent7d: { created: 0, modified: 0 },
      recent30d: { created: 0, modified: 0 },
      activeDocs: [],
    };

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    for (const file of files) {
      // 总大小
      stats.totalSize += file.size || 0;

      // 按类型统计
      const type = file.type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // 按年份统计
      if (file.created_at) {
        const date = new Date(file.created_at);
        const year = date.getFullYear();
        stats.byYear[year] = (stats.byYear[year] || 0) + 1;

        const month = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;

        // 最近 7 天创建
        if (now - file.created_at < 7 * oneDay) {
          stats.recent7d.created++;
        }

        // 最近 30 天创建
        if (now - file.created_at < 30 * oneDay) {
          stats.recent30d.created++;
        }
      }

      // 最近修改
      if (file.modified_at) {
        // 最近 7 天修改
        if (now - file.modified_at < 7 * oneDay) {
          stats.recent7d.modified++;
        }

        // 最近 30 天修改
        if (now - file.modified_at < 30 * oneDay) {
          stats.recent30d.modified++;
        }

        // 活跃文档（最近 30 天修改过）
        stats.activeDocs.push({
          ...file,
          modifiedCount: 1, // 这里简化处理，实际应该统计修改次数
        });
      }
    }

    // 排序活跃文档
    stats.activeDocs.sort((a, b) => b.modified_at - a.modified_at);
    stats.activeDocs = stats.activeDocs.slice(0, 20); // Top 20

    return stats;
  }

  /**
   * 找出需要清理的文件
   */
  findExpiredFiles(files, cleanupRules) {
    console.log('🧹 开始找出需要清理的文件...\n');

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const expiredFiles = [];

    for (const file of files) {
      let expired = false;
      let reason = '';

      // 按时间判断
      if (cleanupRules.expiry_days) {
        const expiryTime = cleanupRules.expiry_days * oneDay;
        if (file.modified_at && (now - file.modified_at) > expiryTime) {
          expired = true;
          reason = `超过 ${cleanupRules.expiry_days} 天未修改`;
        }
      }

      // 按草稿时间判断
      if (cleanupRules.draft_expiry_days) {
        const expiryTime = cleanupRules.draft_expiry_days * oneDay;
        if (file.modified_at && (now - file.modified_at) > expiryTime) {
          // 检查是否是草稿
          if (this.isDraftFile(file)) {
            expired = true;
            reason = `草稿超过 ${cleanupRules.draft_expiry_days} 天未修改`;
          }
        }
      }

      // 按关键词判断
      if (cleanupRules.keywords && cleanupRules.keywords.length > 0) {
        const text = `${file.name} ${file.path}`;
        if (cleanupRules.keywords.some(keyword => 
          text.toLowerCase().includes(keyword.toLowerCase()))) {
          expired = true;
          reason = '标记为需要清理';
        }
      }

      if (expired) {
        expiredFiles.push({
          ...file,
          expiredReason: reason,
        });
      }
    }

    console.log(`✅ 找出 ${expiredFiles.length} 个需要清理的文件\n`);
    return expiredFiles.slice(0, cleanupRules.cleanup_limit || 50);
  }

  /**
   * 判断是否是草稿文件
   */
  isDraftFile(file) {
    const name = file.name.toLowerCase();
    const draftKeywords = ['草稿', 'draft', '临时', 'todo', '待办'];
    return draftKeywords.some(keyword => name.includes(keyword));
  }
}

export default Scanner;
