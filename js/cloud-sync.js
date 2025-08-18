/**
 * 云同步模块
 * 负责与GitHub Gist的云同步功能
 * 
 * @description 此模块包含所有云同步相关的业务逻辑
 * @author 简·记项目组
 * @version 1.0.0
 */

import { getStorage } from './storage-manager.js';
import { handleError, showToast } from './utils.js';

/**
 * 上传数据到GitHub Gist
 * @param {string} token - GitHub Token
 * @param {string} gistId - Gist ID（可选，用于更新现有Gist）
 * @param {Object} data - 要上传的数据
 * @returns {Promise<string>} 返回Gist ID
 */
export async function uploadToGist(token, gistId, data) {
    const filename = 'notes-data.json';
    const body = {
        files: {
            [filename]: { content: JSON.stringify(data, null, 2) }
        },
        public: false,
        description: '云同步 - 严谨的版本控制笔记系统'
    };
    
    let url = 'https://api.github.com/gists';
    let method = 'POST';
    
    if (gistId) {
        url += '/' + gistId;
        method = 'PATCH';
    }
    
    // 强制不缓存，确保上传到最新状态
    const res = await fetch(url, {
        method,
        headers: {
            'Authorization': 'token ' + token,
            'Accept': 'application/vnd.github+json'
        },
        body: JSON.stringify(body),
        cache: 'no-store'  // 强制绕过浏览器缓存
    });
    
    if (!res.ok) {
        throw new Error('Gist同步失败: ' + res.status);
    }
    
    const result = await res.json();
    return result.id;
}

/**
 * 从GitHub Gist拉取数据
 * @param {string} token - GitHub Token
 * @param {string} gistId - Gist ID
 * @returns {Promise<Object>} 返回拉取的数据
 */
export async function fetchFromGist(token, gistId) {
    if (!gistId) {
        throw new Error('请填写 Gist ID');
    }

    const url = `https://api.github.com/gists/${gistId}`;

    const res = await fetch(url, {
        headers: {
            'Authorization': 'token ' + token,
            'Accept': 'application/vnd.github+json'
        },
        cache: 'no-store' // 强制绕过浏览器缓存
    });

    if (!res.ok) {
        throw new Error('拉取失败，状态码: ' + res.status);
    }
    
    const result = await res.json();
    const file = result.files['notes-data.json'];
    
    if (!file) {
        throw new Error('云端未找到 notes-data.json 文件');
    }

    let content = file.content;
    if (file.truncated && file.raw_url) {
        // 如果文件被截断，从 raw_url 获取完整内容
        const rawRes = await fetch(file.raw_url, {
            cache: 'no-store'
        });
        if (!rawRes.ok) {
            throw new Error('拉取大文件失败: ' + rawRes.status);
        }
        content = await rawRes.text();
    }

    return JSON.parse(content);
}

/**
 * 执行云同步上传操作
 * @param {string} token - GitHub Token
 * @param {string} gistId - Gist ID
 * @param {Function} statusCallback - 状态回调函数
 * @returns {Promise<string>} 返回新的Gist ID
 */
export async function performCloudSyncUpload(token, gistId, statusCallback) {
    try {
        statusCallback('正在读取本地数据...');
        
        // 从IndexedDB获取数据
        const storage = getStorage();
        if (!storage) {
            throw new Error('核心存储模块 (IndexedDB) 不可用，无法读取本地数据！');
        }
        
        const dataToPush = await storage.loadData();
        
        statusCallback('正在上传到云端...');
        
        // 上传到Gist
        const newGistId = await uploadToGist(token, gistId, dataToPush);
        
        statusCallback('上传成功！');
        showToast('云同步上传成功！', 3000);
        
        return newGistId;
        
    } catch (error) {
        console.error('云同步上传失败:', error);
        statusCallback('上传失败：' + error.message);
        throw error;
    }
}

/**
 * 执行云同步拉取操作
 * @param {string} token - GitHub Token
 * @param {string} gistId - Gist ID
 * @param {Function} statusCallback - 状态回调函数
 * @returns {Promise<void>}
 */
export async function performCloudSyncPull(token, gistId, statusCallback) {
    try {
        statusCallback('正在拉取云端数据...');
        
        // 从Gist拉取数据
        const data = await fetchFromGist(token, gistId);
        
        statusCallback('正在保存到本地...');
        
        // 保存到IndexedDB
        const storage = getStorage();
        if (!storage) {
            throw new Error('核心存储模块 (IndexedDB) 不可用，无法保存云端数据！');
        }
        
        await storage.saveData(data);
        
        // 清理可能存在的localStorage旧数据
        localStorage.removeItem('notesData');
        
        statusCallback('拉取成功，已覆盖本地数据！即将刷新...');
        showToast('云同步拉取成功！', 3000);
        
        // 成功后强制刷新页面以应用新数据
        setTimeout(() => {
            location.reload(true);
        }, 1500);
        
    } catch (error) {
        console.error('云同步拉取失败:', error);
        statusCallback('拉取失败：' + error.message);
        throw error;
    }
}

/**
 * 初始化云同步功能
 * @param {Object} elements - DOM元素对象
 */
export function initializeCloudSync(elements) {
    const {
        cloudSyncBtn,
        cloudSyncModal,
        cloudSyncCloseBtn,
        cloudSyncPushBtn,
        cloudSyncPullBtn,
        cloudTokenInput,
        cloudGistIdInput,
        cloudSyncStatus
    } = elements;
    
    // 云同步按钮逻辑
    if (cloudSyncBtn && cloudSyncModal && cloudSyncCloseBtn) {
        cloudSyncBtn.addEventListener('click', () => {
            cloudSyncModal.classList.remove('hidden');
        });
        
        cloudSyncCloseBtn.addEventListener('click', () => {
            cloudSyncModal.classList.add('hidden');
        });
        
        // 点击遮罩关闭
        cloudSyncModal.addEventListener('click', (e) => {
            if (e.target === cloudSyncModal) {
                cloudSyncModal.classList.add('hidden');
            }
        });
    }

    // 云同步上传到Gist
    if (cloudSyncPushBtn) {
        cloudSyncPushBtn.addEventListener('click', async () => {
            const token = cloudTokenInput.value.trim();
            let gistId = cloudGistIdInput.value.trim();
            
            if (!token) {
                cloudSyncStatus.textContent = '请填写 GitHub Token';
                return;
            }
            
            try {
                const newGistId = await performCloudSyncUpload(token, gistId, (status) => {
                    cloudSyncStatus.textContent = status;
                });
                
                cloudGistIdInput.value = newGistId;
                
            } catch (error) {
                // 错误已在performCloudSyncUpload中处理
            }
        });
    }

    // 云同步拉取Gist
    if (cloudSyncPullBtn) {
        cloudSyncPullBtn.addEventListener('click', async () => {
            const token = cloudTokenInput.value.trim();
            const gistId = cloudGistIdInput.value.trim();
            
            if (!token || !gistId) {
                cloudSyncStatus.textContent = '请填写 Token 和 Gist ID';
                return;
            }
            
            try {
                await performCloudSyncPull(token, gistId, (status) => {
                    cloudSyncStatus.textContent = status;
                });
                
            } catch (error) {
                // 错误已在performCloudSyncPull中处理
            }
        });
    }
}
