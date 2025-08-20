/**
 * 数据迁移管理模块
 * 负责原子化存储迁移、数据恢复与健康监控相关的逻辑
 */

import { showToast, handleError } from './utils.js';
import { getStorage } from './storage-manager.js';
import { getNotesData, setNotesData } from './state.js';

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
    if (confirm('确定要尝试紧急数据恢复吗？这将尝试从最新的备份中恢复数据。')) {
        try {
            const success = await recoverData(); // 使用最新备份
            if (success) {
                if (confirm('数据恢复成功！是否刷新页面以应用恢复的数据？')) {
                    location.reload();
                }
            } else {
                alert('数据恢复失败，请检查控制台错误信息');
            }
        } catch (error) {
            console.error('紧急数据恢复失败:', error);
            alert('紧急数据恢复失败：' + error.message);
        }
    }
}

/**
 * 显示存储状态
 */
export async function showStorageStatus() {
    let status = '=== 存储状态报告 ===\n\n';
    
    // 检查 IndexedDB
    status += '🗄️ IndexedDB 状态:\n';
    try {
        const storage = getStorage();
        if (storage) {
            status += '- 状态: ✅ 已初始化\n';
            try {
                const info = await storage.getStorageInfo();
                status += `- 总项目数: ${info.totalItems}\n`;
                status += `- 备份数量: ${info.backupCount}\n`;
                status += `- 主数据大小: ${(info.mainDataSize / 1024).toFixed(2)} KB\n`;
                status += `- 最后备份: ${info.lastBackup ? new Date(info.lastBackup).toLocaleString() : '无'}\n`;
                
                // 显示当前内存中的数据状态
                const notesData = getNotesData();
                const noteCount = Object.keys(notesData.notes || {}).length;
                status += `- 内存中笔记数量: ${noteCount}\n`;
                status += `- 当前笔记ID: ${notesData.currentNoteId || '无'}\n`;
            } catch (error) {
                status += `- 错误: ${error.message}\n`;
            }
        } else {
            status += '- 状态: ❌ 未初始化\n';
        }
    } catch (error) {
        status += `- 错误: ${error.message}\n`;
    }
    
    // 检查 localStorage（兼容性）
    status += '\n📦 localStorage 兼容性检查:\n';
    try {
        const localData = localStorage.getItem('notesData');
        const localBackup = localStorage.getItem('notesData_backup');
        
        status += `- 旧版主数据: ${localData ? '✅ 存在' : '❌ 不存在'}\n`;
        status += `- 旧版备份: ${localBackup ? '✅ 存在' : '❌ 不存在'}\n`;
        
        if (localData) {
            const parsedData = JSON.parse(localData);
            const noteCount = Object.keys(parsedData.notes || {}).length;
            const dataSize = (localData.length / 1024).toFixed(2);
            status += `- 旧版笔记数量: ${noteCount}\n`;
            status += `- 旧版数据大小: ${dataSize} KB\n`;
        }
    } catch (error) {
        status += `- 错误: ${error.message}\n`;
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
        
        // 导出 localStorage 数据（兼容性）
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
        try {
            const storage = getStorage();
            if (storage) {
                const data = await storage.exportData();
                exportData.indexedDB = data;
            } else {
                exportData.indexedDB = { error: '存储模块不可用' };
            }
        } catch (error) {
            exportData.indexedDB = { error: error.message };
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
 * 从备份恢复数据
 * @param {string} backupId - 备份ID，如果不指定则使用最新备份
 * @returns {Promise<boolean>} 是否成功恢复
 */
export async function recoverData(backupId = null) {
    try {
        const storage = getStorage();
        if (!storage) {
            throw new Error('存储模块不可用');
        }

        // 获取所有备份
        const backups = await storage.getAllBackups();
        if (backups.length === 0) {
            throw new Error('没有可用的备份数据');
        }

        // 选择要恢复的备份
        let targetBackup;
        if (backupId) {
            targetBackup = backups.find(b => b.id === backupId);
            if (!targetBackup) {
                throw new Error(`未找到指定的备份: ${backupId}`);
            }
        } else {
            // 使用最新备份
            targetBackup = backups[0];
        }

        // 恢复数据
        const recoveredData = targetBackup.data;
        await storage.saveData(recoveredData);
        
        // 更新内存中的数据
        setNotesData(recoveredData);
        
        console.log(`✅ 数据恢复成功，使用备份: ${targetBackup.id}`);
        showToast(`数据恢复成功！使用备份: ${targetBackup.id}`, 'success');
        
        return true;
    } catch (error) {
        console.error('数据恢复失败:', error);
        showToast('数据恢复失败: ' + error.message, 'error');
        return false;
    }
}

/**
 * 数据健康监控
 * @returns {Promise<Object>} 健康状态报告
 */
export async function monitorDataHealth() {
    const healthReport = {
        timestamp: new Date().toISOString(),
        overall: 'unknown',
        issues: [],
        recommendations: []
    };

    try {
        const storage = getStorage();
        if (!storage) {
            healthReport.overall = 'critical';
            healthReport.issues.push('存储模块不可用');
            healthReport.recommendations.push('检查浏览器IndexedDB支持');
            return healthReport;
        }

        // 检查主数据完整性
        try {
            const mainData = await storage.loadData();
            if (!mainData || typeof mainData !== 'object') {
                healthReport.issues.push('主数据结构异常');
                healthReport.recommendations.push('尝试从备份恢复数据');
            } else {
                // 检查笔记数据完整性
                const notes = mainData.notes || {};
                const noteIds = Object.keys(notes);
                
                if (noteIds.length === 0) {
                    healthReport.issues.push('没有笔记数据');
                } else {
                    // 检查每个笔记的完整性
                    let corruptedNotes = 0;
                    noteIds.forEach(noteId => {
                        const note = notes[noteId];
                        if (!note || typeof note.content !== 'string' || typeof note.title !== 'string') {
                            corruptedNotes++;
                        }
                    });
                    
                    if (corruptedNotes > 0) {
                        healthReport.issues.push(`${corruptedNotes} 个笔记数据损坏`);
                        healthReport.recommendations.push('运行数据修复或从备份恢复');
                    }
                }
            }
        } catch (error) {
            healthReport.issues.push(`主数据加载失败: ${error.message}`);
            healthReport.recommendations.push('尝试紧急数据恢复');
        }

        // 检查备份数据
        try {
            const backups = await storage.getAllBackups();
            if (backups.length === 0) {
                healthReport.issues.push('没有备份数据');
                healthReport.recommendations.push('建议立即创建备份');
            } else {
                // 检查备份的时效性
                const latestBackup = backups[0];
                const backupAge = Date.now() - latestBackup.timestamp;
                const oneDay = 24 * 60 * 60 * 1000;
                
                if (backupAge > oneDay) {
                    healthReport.issues.push('备份数据较旧（超过1天）');
                    healthReport.recommendations.push('建议创建新的备份');
                }
            }
        } catch (error) {
            healthReport.issues.push(`备份数据检查失败: ${error.message}`);
        }

        // 检查存储空间
        try {
            const storageInfo = await storage.getStorageInfo();
            const totalSize = storageInfo.mainDataSize + (storageInfo.backupCount * 100); // 估算备份大小
            const sizeLimit = 50 * 1024 * 1024; // 50MB 限制
            
            if (totalSize > sizeLimit) {
                healthReport.issues.push('存储空间使用量较大');
                healthReport.recommendations.push('考虑清理旧备份或导出数据');
            }
        } catch (error) {
            healthReport.issues.push(`存储空间检查失败: ${error.message}`);
        }

        // 确定整体健康状态
        if (healthReport.issues.length === 0) {
            healthReport.overall = 'healthy';
            healthReport.recommendations.push('数据状态良好，建议定期备份');
        } else if (healthReport.issues.some(issue => issue.includes('不可用') || issue.includes('失败'))) {
            healthReport.overall = 'critical';
        } else {
            healthReport.overall = 'warning';
        }

    } catch (error) {
        healthReport.overall = 'critical';
        healthReport.issues.push(`健康检查失败: ${error.message}`);
        healthReport.recommendations.push('重启应用或联系技术支持');
    }

    return healthReport;
}

/**
 * 显示数据健康报告
 */
export async function showDataHealthReport() {
    try {
        const healthReport = await monitorDataHealth();
        
        let reportText = `=== 数据健康报告 ===\n`;
        reportText += `时间: ${new Date(healthReport.timestamp).toLocaleString()}\n`;
        reportText += `状态: ${getHealthStatusText(healthReport.overall)}\n\n`;
        
        if (healthReport.issues.length > 0) {
            reportText += `⚠️ 发现的问题:\n`;
            healthReport.issues.forEach(issue => {
                reportText += `- ${issue}\n`;
            });
            reportText += `\n`;
        }
        
        if (healthReport.recommendations.length > 0) {
            reportText += `💡 建议:\n`;
            healthReport.recommendations.forEach(rec => {
                reportText += `- ${rec}\n`;
            });
        }
        
        alert(reportText);
        
        // 如果是严重问题，提供快速修复选项
        if (healthReport.overall === 'critical') {
            if (confirm('检测到严重问题，是否尝试紧急数据恢复？')) {
                await emergencyDataRecovery();
            }
        }
        
    } catch (error) {
        console.error('生成健康报告失败:', error);
        alert('生成健康报告失败: ' + error.message);
    }
}

/**
 * 获取健康状态文本
 */
function getHealthStatusText(status) {
    const statusMap = {
        'healthy': '✅ 健康',
        'warning': '⚠️ 警告',
        'critical': '❌ 严重',
        'unknown': '❓ 未知'
    };
    return statusMap[status] || status;
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
        // Ctrl+Shift+H 显示数据健康报告
        if (e.ctrlKey && e.shiftKey && e.key === 'H') {
            e.preventDefault();
            showDataHealthReport();
        }
    });
}
