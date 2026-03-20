/**
 * 飞书文档自动化归档系统 - 配置文件
 */

export default {
  // ==================== 飞书配置 ====================
  feishu: {
    // 飞书应用 ID（从飞书开放平台获取）
    app_id: process.env.FEISHU_APP_ID || "",

    // 飞书应用密钥（从飞书开放平台获取）
    app_secret: process.env.FEISHU_APP_SECRET || "",

    // 根文件夹 Token（要归档的文件夹）
    root_folder_token: process.env.FEISHU_ROOT_FOLDER_TOKEN || "",
  },

  // ==================== 归档规则 ====================
  archive: {
    // 是否按年份分类
    by_year: true,

    // 是否按类型分类
    by_type: true,

    // 按类型分类的规则
    type_rules: {
      "会议纪要": ["会议", "纪要", "MOCK", "会议记录", "Meeting"],
      "报告": ["报告", "汇报", "分析", "Review", "Analysis"],
      "草稿": ["草稿", "draft", "临时", "todo", "待办"],
      "设计稿": ["设计", "Design", "UI", "UX", "Figma"],
      "文档": ["文档", "doc", "Document", "说明"],
    },

    // 是否按项目分类
    by_project: false,

    // 按项目分类的规则
    project_rules: {
      "项目A": ["项目A", "Project A", "Project-A"],
      "项目B": ["项目B", "Project B", "Project-B"],
    },

    // 子文件夹名称
    archive_folder_name: "已归档",
    expired_folder_name: "过期文档",
    reports_folder_name: "归档报告",
  },

  // ==================== 清理规则 ====================
  cleanup: {
    // 过期时间（天），超过此时间未修改的文档视为过期
    expiry_days: 180,

    // 草稿过期时间（天）
    draft_expiry_days: 90,

    // 关键词标记（文件名或标题包含这些词，可能需要清理）
    keywords: ["废弃", "旧版", "删除", "TODO", "临时"],

    // 是否自动删除（false = 仅标记建议）
    auto_delete: false,

    // 删除确认（true = 删除前需要确认）
    require_confirmation: true,
  },

  // ==================== 报告配置 ====================
  report: {
    // 报告输出文件夹（根文件夹下的子文件夹）
    output_folder: "归档报告",

    // 报告文件名格式（支持 {date} 占位符）
    report_name: "文档归档报告_{date}.md",

    // 日期格式
    date_format: "YYYY-MM-DD",

    // 报告包含的章节
    sections: [
      "总览",
      "类型分布",
      "时间趋势",
      "活跃文档",
      "清理建议",
    ],

    // 最活跃文档数量
    active_docs_limit: 20,

    // 清理建议数量
    cleanup_limit: 50,
  },

  // ==================== 其他配置 ====================
  other: {
    // 是否显示详细日志
    verbose: true,

    // 并发请求数量
    max_concurrent_requests: 5,

    // 请求超时时间（毫秒）
    request_timeout: 30000,

    // 是否跳过已归档的文件
    skip_archived: true,

    // 已归档文件的标记（在文件名中）
    archived_marker: "[已归档]",
  },

  // ==================== 调试配置 ====================
  debug: {
    // 是否启用调试模式
    enabled: false,

    // 是否保存原始数据
    save_raw_data: false,

    // 调试输出文件
    debug_file: "debug.log",
  },
};

/**
 * 创建默认配置文件
 */
export function createDefaultConfig() {
  const config = {
    // 占位符配置，用户需要替换
    feishu: {
      app_id: "your_app_id_here",
      app_secret: "your_app_secret_here",
      root_folder_token: "your_root_folder_token_here",
    },
  };

  console.log("请配置以下信息后重试：");
  console.log(JSON.stringify(config, null, 2));
  console.log("\n提示：");
  console.log("1. app_id 和 app_secret 从飞书开放平台获取");
  console.log("2. root_folder_token 从飞书云空间 URL 中获取（例如：fldcnXXXXX）");
  console.log("3. 建议使用环境变量存储敏感信息");
}
