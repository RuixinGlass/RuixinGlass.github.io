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

// ========== 业务级数据操作方法 ==========

/**
 * 保存笔记数据（业务级操作）
 */
export async function saveNotesData(notesData) {
    try {
        const storage = getStorage();
        await storage.saveData(notesData);
        
        // 同时创建备份并清理旧备份
        await storage.backupData(notesData);
        await storage.cleanupOldBackups();
        
        console.log('笔记数据保存成功，笔记数量:', Object.keys(notesData.notes).length);
        return true;
    } catch (error) {
        console.error('保存笔记数据失败:', error);
        throw error;
    }
}

/**
 * 加载笔记数据（业务级操作）
 */
export async function loadNotesData() {
    try {
        const storage = getStorage();
        const data = await storage.loadData();
        console.log('笔记数据加载成功');
        return data;
    } catch (error) {
        console.error('加载笔记数据失败:', error);
        throw error;
    }
}

/**
 * 创建数据备份（业务级操作）
 */
export async function createDataBackup(notesData) {
    try {
        const storage = getStorage();
        const backupId = await storage.backupData(notesData);
        console.log('数据备份创建成功:', backupId);
        return backupId;
    } catch (error) {
        console.error('创建数据备份失败:', error);
        throw error;
    }
}

/**
 * 获取所有备份（业务级操作）
 */
export async function getAllBackups() {
    try {
        const storage = getStorage();
        const backups = await storage.getAllBackups();
        console.log('获取备份列表成功，数量:', backups.length);
        return backups;
    } catch (error) {
        console.error('获取备份列表失败:', error);
        throw error;
    }
}

/**
 * 从备份恢复数据（业务级操作）
 */
export async function restoreFromBackup(backupId) {
    try {
        const storage = getStorage();
        const backups = await storage.getAllBackups();
        const targetBackup = backups.find(backup => backup.id === backupId);
        
        if (!targetBackup) {
            throw new Error(`备份 ${backupId} 不存在`);
        }
        
        await storage.saveData(targetBackup.data);
        console.log('从备份恢复数据成功:', backupId);
        return targetBackup.data;
    } catch (error) {
        console.error('从备份恢复数据失败:', error);
        throw error;
    }
}

/**
 * 导出所有数据（业务级操作）
 */
export async function exportAllData() {
    try {
        const storage = getStorage();
        const data = await storage.exportData();
        console.log('数据导出成功');
        return data;
    } catch (error) {
        console.error('数据导出失败:', error);
        throw error;
    }
}

/**
 * 导入数据（业务级操作）
 */
export async function importData(importData) {
    try {
        const storage = getStorage();
        await storage.importData(importData);
        console.log('数据导入成功');
        return true;
    } catch (error) {
        console.error('数据导入失败:', error);
        throw error;
    }
}
