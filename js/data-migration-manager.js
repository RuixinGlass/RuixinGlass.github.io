/**
 * 数据迁移管理模块
 * 负责原子化存储迁移相关的逻辑
 */

import { showToast } from './utils.js';

/**
 * 检查迁移状态并隐藏按钮
 */
export async function checkMigrationStatusAndHideButton() {
    try {
        if (window.checkMigrationStatus) {
            const status = await window.checkMigrationStatus();
            // 如果已经有新数据且不需要迁移，则隐藏按钮
            if (status.hasNewData && !status.needsMigration) {
                const atomicMigrationBtn = document.getElementById('atomicMigrationBtn');
                if (atomicMigrationBtn) {
                    atomicMigrationBtn.classList.add('hidden');
                    console.log('检测到已完成迁移，隐藏迁移按钮');
                }
            }
        }
    } catch (error) {
        console.log('检查迁移状态失败:', error);
    }
}

/**
 * 初始化原子化存储迁移功能
 */
export function initializeAtomicMigration() {
    const atomicMigrationBtn = document.getElementById('atomicMigrationBtn');
    if (atomicMigrationBtn) {
        atomicMigrationBtn.addEventListener('click', async () => {
            try {
                showToast('🚀 开始升级到原子化存储架构...', 3000);
                const success = await window.migrateToAtomicStructure();
                if (success) {
                    showToast('✅ 架构升级成功！', 5000);
                    
                    // 迁移成功后隐藏按钮
                    atomicMigrationBtn.classList.add('hidden');
                    
                    // 刷新页面以应用新架构
                    setTimeout(() => {
                        if (confirm('架构升级完成，是否刷新页面以应用新功能？')) {
                            location.reload();
                        }
                    }, 1000);
                } else {
                    showToast('❌ 架构升级失败，请检查控制台错误信息', 5000);
                }
            } catch (error) {
                console.error('架构升级失败:', error);
                showToast('❌ 架构升级失败: ' + error.message, 5000);
            }
        });
        
        // 检查迁移状态，如果已经迁移完成则隐藏按钮
        checkMigrationStatusAndHideButton();
    }
}

/**
 * 紧急数据恢复功能
 */
export async function emergencyDataRecovery() {
    if (confirm('确定要尝试恢复数据吗？这将尝试从备份中恢复数据。')) {
        try {
            const backupData = localStorage.getItem('notesData_backup');
            if (backupData) {
                const parsedData = JSON.parse(backupData);
                
                // 这里需要调用存储模块的保存方法
                if (window.indexedDBStorage) {
                    await window.indexedDBStorage.saveData(parsedData);
                }
                
                location.reload();
                alert('数据恢复成功！');
            } else {
                alert('未找到备份数据！');
            }
        } catch (error) {
            alert('数据恢复失败：' + error.message);
        }
    }
}

/**
 * 显示存储状态
 */
export async function showStorageStatus() {
    let status = '=== 存储状态报告 ===\n\n';
    
    // 检查 localStorage
    try {
        const localData = localStorage.getItem('notesData');
        const localBackup = localStorage.getItem('notesData_backup');
        const localTimestamp = localStorage.getItem('notesData_timestamp');
        
        status += '📦 localStorage 状态:\n';
        status += `- 主数据: ${localData ? '✅ 存在' : '❌ 不存在'}\n`;
        status += `- 备份数据: ${localBackup ? '✅ 存在' : '❌ 不存在'}\n`;
        status += `- 时间戳: ${localTimestamp || '❌ 不存在'}\n`;
        
        if (localData) {
            const parsedData = JSON.parse(localData);
            const noteCount = Object.keys(parsedData.notes || {}).length;
            const dataSize = (localData.length / 1024).toFixed(2);
            status += `- 笔记数量: ${noteCount}\n`;
            status += `- 数据大小: ${dataSize} KB\n`;
        }
    } catch (error) {
        status += `- 错误: ${error.message}\n`;
    }
    
    // 检查 IndexedDB
    status += '\n🗄️ IndexedDB 状态:\n';
    if (window.indexedDBStorage && window.indexedDBStorage.isInitialized) {
        status += '- 状态: ✅ 已初始化\n';
        try {
            const info = await window.indexedDBStorage.getStorageInfo();
            status += `- 总项目数: ${info.totalItems}\n`;
            status += `- 备份数量: ${info.backupCount}\n`;
            status += `- 主数据大小: ${(info.mainDataSize / 1024).toFixed(2)} KB\n`;
            status += `- 最后备份: ${info.lastBackup ? new Date(info.lastBackup).toLocaleString() : '无'}\n`;
        } catch (error) {
            status += `- 错误: ${error.message}\n`;
        }
    } else {
        status += '- 状态: ❌ 未初始化\n';
    }
    
    alert(status);
}

/**
 * 导出所有存储数据
 */
export async function exportAllStorageData() {
    if (confirm('确定要导出所有存储数据吗？这将下载一个包含所有数据的JSON文件。')) {
        const exportData = {
            exportTime: new Date().toISOString(),
            localStorage: {},
            indexedDB: null
        };
        
        // 导出 localStorage 数据
        try {
            const localData = localStorage.getItem('notesData');
            const localBackup = localStorage.getItem('notesData_backup');
            const localTimestamp = localStorage.getItem('notesData_timestamp');
            
            if (localData) {
                exportData.localStorage.main = JSON.parse(localData);
            }
            if (localBackup) {
                exportData.localStorage.backup = JSON.parse(localBackup);
            }
            exportData.localStorage.timestamp = localTimestamp;
        } catch (error) {
            exportData.localStorage.error = error.message;
        }
        
        // 导出 IndexedDB 数据
        if (window.indexedDBStorage && window.indexedDBStorage.isInitialized) {
            try {
                const data = await window.indexedDBStorage.exportData();
                exportData.indexedDB = data;
            } catch (error) {
                exportData.indexedDB = { error: error.message };
            }
        }
        
        downloadStorageData(exportData);
    }
}

/**
 * 下载存储数据
 */
function downloadStorageData(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-storage-data-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('存储数据已导出到文件！', 3000);
}

/**
 * 设置快捷键支持
 */
export function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+R 紧急恢复数据
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            emergencyDataRecovery();
        }
        // Ctrl+Shift+D 查看存储状态
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            showStorageStatus();
        }
        // Ctrl+Shift+E 导出所有存储数据
        if (e.ctrlKey && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            exportAllStorageData();
        }
    });
}
