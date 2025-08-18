/**
 * 存储管理器
 * 统一管理存储实例，提供全局访问接口
 * 
 * @description 此模块负责创建和管理存储实例，确保整个应用使用同一个存储实例
 * @author 简·记项目组
 * @version 1.0.0
 */

import { createStorage, migrateFromLocalStorage } from './storage.js';

// 全局存储实例
let storageInstance = null;

/**
 * 获取存储实例（单例模式）
 */
export function getStorage() {
    if (!storageInstance) {
        storageInstance = createStorage();
        console.log('创建新的存储实例');
    }
    return storageInstance;
}

/**
 * 初始化存储系统
 */
export async function initializeStorage() {
    try {
        const storage = getStorage();
        
        // 尝试从 localStorage 迁移数据
        const migrated = await migrateFromLocalStorage(storage);
        if (migrated) {
            console.log('数据迁移完成');
        }
        
        return storage;
    } catch (error) {
        console.error('存储系统初始化失败:', error);
        throw error;
    }
}

/**
 * 获取存储信息
 */
export async function getStorageInfo() {
    try {
        const storage = getStorage();
        return await storage.getStorageInfo();
    } catch (error) {
        console.error('获取存储信息失败:', error);
        return null;
    }
}

/**
 * 清理存储实例（用于测试或重置）
 */
export function clearStorageInstance() {
    if (storageInstance) {
        storageInstance = null;
        console.log('存储实例已清理');
    }
}
