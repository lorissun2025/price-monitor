/**
 * 飞书 API 客户端
 * 
 * 功能：
 * 1. 获取 tenant_access_token
 * 2. 调用飞书 Drive API
 * 3. 调用飞书 Doc API
 */

import fetch from 'node-fetch';

class FeishuClient {
  constructor(config) {
    this.appId = config.app_id;
    this.appSecret = config.app_secret;
    this.token = null;
    this.tokenExpireTime = null;
    this.baseUrl = 'https://open.feishu.cn/open-apis';
  }

  /**
   * 获取 tenant_access_token
   */
  async getAccessToken() {
    // 检查 token 是否过期
    if (this.token && Date.now() < this.tokenExpireTime) {
      return this.token;
    }

    console.log('🔄 正在获取飞书 access_token...');

    try {
      const response = await fetch(`${this.baseUrl}/auth/v3/tenant_access_token/internal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: this.appId,
          app_secret: this.appSecret,
        }),
      });

      const data = await response.json();

      if (data.code !== 0) {
        throw new Error(`获取 token 失败：${data.msg}`);
      }

      this.token = data.tenant_access_token;
      // 提前 5 分钟刷新 token
      this.tokenExpireTime = (Date.now() / 1000 + data.expire - 300) * 1000;

      console.log('✅ 获取 token 成功');
      return this.token;
    } catch (error) {
      console.error('❌ 获取 token 失败：', error.message);
      throw error;
    }
  }

  /**
   * 调用飞书 API 的通用方法
   */
  async apiCall(endpoint, options = {}) {
    const token = await this.getAccessToken();

    const requestOptions = {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, requestOptions);
    const data = await response.json();

    if (data.code !== 0) {
      throw new Error(`API 调用失败：${data.msg} (code: ${data.code})`);
    }

    return data.data;
  }

  /**
   * Drive API：列出文件夹下的文件
   */
  async listFiles(folderToken, options = {}) {
    console.log(`📁 正在列出文件夹：${folderToken}`);

    try {
      const data = await this.apiCall('/drive/v1/files', {
        method: 'GET',
      });

      console.log(`✅ 列出成功，共 ${data.files.length} 个文件`);
      return data.files || [];
    } catch (error) {
      console.error('❌ 列出文件失败：', error.message);
      throw error;
    }
  }

  /**
   * Drive API：创建文件夹
   */
  async createFolder(name, parentFolderToken = 'root') {
    console.log(`📂 正在创建文件夹：${name}`);

    try {
      const data = await this.apiCall('/drive/v1/folders', {
        method: 'POST',
        body: JSON.stringify({
          name: name,
          parent_type: 'explorer',
          parent_node: parentFolderToken,
        }),
      });

      console.log(`✅ 创建文件夹成功：${data.token}`);
      return data;
    } catch (error) {
      console.error('❌ 创建文件夹失败：', error.message);
      throw error;
    }
  }

  /**
   * Drive API：移动文件
   */
  async moveFile(fileToken, targetFolderToken) {
    console.log(`📦 正在移动文件：${fileToken} → ${targetFolderToken}`);

    try {
      await this.apiCall('/drive/v1/files/move', {
        method: 'POST',
        body: JSON.stringify({
          file_token: fileToken,
          to_parent_type: 'explorer',
          to_parent_node: targetFolderToken,
        }),
      });

      console.log(`✅ 移动文件成功`);
      return true;
    } catch (error) {
      console.error('❌ 移动文件失败：', error.message);
      throw error;
    }
  }

  /**
   * Drive API：获取文件元数据
   */
  async getFileMetadata(fileToken) {
    console.log(`📄 正在获取文件元数据：${fileToken}`);

    try {
      const data = await this.apiCall(`/drive/v1/files/${fileToken}`, {
        method: 'GET',
      });

      console.log(`✅ 获取元数据成功`);
      return data;
    } catch (error) {
      console.error('❌ 获取元数据失败：', error.message);
      throw error;
    }
  }

  /**
   * Doc API：获取文档内容
   */
  async getDocContent(docToken) {
    console.log(`📖 正在获取文档内容：${docToken}`);

    try {
      const data = await this.apiCall(`/doc/v2/documents/${docToken}/blocks`, {
        method: 'GET',
      });

      console.log(`✅ 获取文档内容成功`);
      return data;
    } catch (error) {
      console.error('❌ 获取文档内容失败：', error.message);
      throw error;
    }
  }
}

export default FeishuClient;
