/**
 * 工具函数集合
 * 包含无副作用的纯函数和错误处理工具
 * 
 * @description 此模块提供各种工具函数，包括设备检测、内容解析、错误处理等
 * @author 简·记项目组
 * @version 1.0.0
 */

// ========== 设备检测工具 ==========

/**
 * 检测是否为移动设备
 * @returns {boolean} 是否为移动设备
 */
export function isMobile() {
    return window.innerWidth <= 768;
}

/**
 * 检测是否为触摸设备
 * @returns {boolean} 是否为触摸设备
 */
export function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// ========== 内容解析工具 ==========

/**
 * 解析Front Matter
 * @param {string} content - 内容字符串
 * @returns {Object} 解析结果 {frontMatter, content}
 */
export function parseFrontMatter(content) {
    const fmMatch = content.match(/^---([\s\S]*?)---/);
    if (!fmMatch) return { frontMatter: {}, content: content };
    
    const fm = fmMatch[1];
    const lines = fm.split(/\r?\n/);
    const meta = {};
    
    for (const line of lines) {
        const m = line.match(/^([a-zA-Z0-9_\u4e00-\u9fa5]+):\s*(.*)$/);
        if (m) {
            let key = m[1].trim();
            let value = m[2].trim();
            
            if (key === 'tags') {
                const arrMatch = value.match(/^\[(.*)\]$/);
                if (arrMatch) {
                    value = arrMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
                } else {
                    value = value ? [value] : [];
                }
            }
            meta[key] = value;
        }
    }
    
    return {
        frontMatter: meta,
        content: content.replace(/^---[\s\S]*?---/, '').trim()
    };
}

/**
 * 生成版本哈希 (修复版)
 * @param {string} content - 内容字符串
 * @returns {string} v开头的6位16进制哈希值
 */
export function generateVersionHash(content) {
    let hash = 0;
    if (content.length === 0) return 'v000000'; // 为空内容提供一个默认值

    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // 转换为32位有符号整数
    }
    
    // ✅ 【核心修复】恢复旧版的格式化逻辑
    return 'v' + Math.abs(hash).toString(16).substring(0, 6);
}

// ========== 错误处理工具 ==========

/**
 * 统一错误处理函数
 * @param {Error} error - 错误对象
 * @param {string} userMessage - 用户友好的错误信息
 */
export function handleError(error, userMessage) {
    console.error('应用错误:', error);
    showToast(userMessage || '操作失败，请重试', 'error');
}

/**
 * 显示Toast消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 ('success'|'error'|'info'|'warning')
 * @param {number} duration - 显示时长（毫秒）
 */
export function showToast(message, type = 'info', duration = 3000) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196F3'
    };
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

/**
 * 显示保存状态
 * @param {string} status - 状态信息
 * @param {string} type - 状态类型 ('saved'|'saving'|'error')
 */
export function showSaveStatus(status, type = 'saved') {
    const existingStatus = document.querySelector('.save-status');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    const colors = {
        saved: '#4CAF50',
        saving: '#2196F3',
        error: '#f44336'
    };
    
    const statusEl = document.createElement('div');
    statusEl.className = 'save-status';
    statusEl.textContent = status;
    statusEl.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: ${colors[type] || colors.saved};
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s;
    `;
    
    document.body.appendChild(statusEl);
    
    setTimeout(() => {
        statusEl.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        statusEl.style.opacity = '0';
        setTimeout(() => {
            if (statusEl.parentNode) {
                statusEl.parentNode.removeChild(statusEl);
            }
        }, 300);
    }, 2000);
}

// ========== 日期时间工具 ==========

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @param {string} format - 格式字符串
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * 生成唯一ID
 * @param {string} prefix - ID前缀
 * @returns {string} 唯一ID
 */
export function generateId(prefix = 'note') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
