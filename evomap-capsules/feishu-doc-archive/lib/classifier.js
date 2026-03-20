/**
 * 分类器 - 根据规则对文档进行分类
 */

class Classifier {
  constructor(config) {
    this.config = config;
  }

  /**
   * 对单个文件进行分类
   */
  classify(file) {
    const classifications = [];

    // 按年份分类
    if (this.config.archive.by_year) {
      const year = this.getClassByYear(file);
      if (year) {
        classifications.push({
          type: 'year',
          value: year,
          path: `${year}/`,
        });
      }
    }

    // 按类型分类
    if (this.config.archive.by_type) {
      const type = this.getClassByType(file);
      if (type) {
        classifications.push({
          type: 'type',
          value: type,
          path: `${type}/`,
        });
      }
    }

    // 按项目分类
    if (this.config.archive.by_project) {
      const project = this.getClassByProject(file);
      if (project) {
        classifications.push({
          type: 'project',
          value: project,
          path: `${project}/`,
        });
      }
    }

    return classifications;
  }

  /**
   * 按年份分类
   */
  getClassByYear(file) {
    if (!file.created_at && !file.modified_at) {
      return 'unknown';
    }

    const date = new Date(file.created_at || file.modified_at);
    const year = date.getFullYear();
    return year.toString();
  }

  /**
   * 按类型分类
   */
  getClassByType(file) {
    const rules = this.config.archive.type_rules;
    if (!rules) {
      return null;
    }

    // 先检查文件名
    for (const [type, keywords] of Object.entries(rules)) {
      if (this.matchKeywords(file.name, keywords)) {
        return type;
      }
    }

    // 再检查路径
    for (const [type, keywords] of Object.entries(rules)) {
      if (this.matchKeywords(file.path, keywords)) {
        return type;
      }
    }

    // 如果都不匹配，返回 "其他"
    return '其他';
  }

  /**
   * 按项目分类
   */
  getClassByProject(file) {
    const rules = this.config.archive.project_rules;
    if (!rules) {
      return null;
    }

    for (const [project, keywords] of Object.entries(rules)) {
      if (this.matchKeywords(file.name, keywords) || 
          this.matchKeywords(file.path, keywords)) {
        return project;
      }
    }

    return null;
  }

  /**
   * 关键词匹配
   */
  matchKeywords(text, keywords) {
    if (!text || !keywords || keywords.length === 0) {
      return false;
    }

    const lowerText = text.toLowerCase();
    return keywords.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
  }

  /**
   * 批量分类文件
   */
  classifyFiles(files) {
    console.log('🗂️  开始分类文档...\n');

    const classifiedFiles = {};
    const unclassifiedFiles = [];

    for (const file of files) {
      const classifications = this.classify(file);

      if (classifications.length === 0) {
        unclassifiedFiles.push(file);
      } else {
        // 构建目标路径
        const targetPath = classifications.map(c => c.path).join('');
        
        if (!classifiedFiles[targetPath]) {
          classifiedFiles[targetPath] = [];
        }
        
        classifiedFiles[targetPath].push({
          file: file,
          classifications: classifications,
        });
      }
    }

    // 打印分类结果
    console.log('📊 分类结果：\n');
    for (const [path, items] of Object.entries(classifiedFiles)) {
      console.log(`${path} - ${items.length} 个文件`);
    }

    if (unclassifiedFiles.length > 0) {
      console.log(`未分类 - ${unclassifiedFiles.length} 个文件`);
    }

    console.log('\n✅ 分类完成\n');

    return {
      classified: classifiedFiles,
      unclassified: unclassifiedFiles,
    };
  }

  /**
   * 找出需要创建的文件夹
   */
  findFoldersToCreate(classifiedFiles) {
    const folders = new Set();
    
    for (const path of Object.keys(classifiedFiles)) {
      // 解析路径，找出所有需要创建的文件夹
      const pathParts = path.split('/').filter(p => p);
      
      let currentPath = '';
      for (const part of pathParts) {
        currentPath += (currentPath ? '/' : '') + part;
        folders.add(currentPath);
      }
    }

    return Array.from(folders);
  }

  /**
   * 验证分类规则
   */
  validateRules() {
    console.log('✅ 验证分类规则...\n');

    const errors = [];

    // 验证按年份分类
    if (this.config.archive.by_year) {
      console.log('✅ 按年份分类：已启用');
    }

    // 验证按类型分类
    if (this.config.archive.by_type) {
      console.log('✅ 按类型分类：已启用');
      if (!this.config.archive.type_rules || Object.keys(this.config.archive.type_rules).length === 0) {
        errors.push('按类型分类已启用，但未定义 type_rules');
      } else {
        console.log(`  定义的类型：${Object.keys(this.config.archive.type_rules).join(', ')}`);
      }
    }

    // 验证按项目分类
    if (this.config.archive.by_project) {
      console.log('✅ 按项目分类：已启用');
      if (!this.config.archive.project_rules || Object.keys(this.config.archive.project_rules).length === 0) {
        errors.push('按项目分类已启用，但未定义 project_rules');
      } else {
        console.log(`  定义的项目：${Object.keys(this.config.archive.project_rules).join(', ')}`);
      }
    }

    if (errors.length > 0) {
      console.error('\n❌ 分类规则验证失败：\n');
      errors.forEach(error => console.error(`  - ${error}`));
      return false;
    }

    console.log('\n✅ 分类规则验证通过\n');
    return true;
  }
}

export default Classifier;
