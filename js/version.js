/**
 * 版本控制模块
 * 负责笔记版本的管理，包括创建、恢复、删除、差异对比等操作
 * 
 * @description 此模块包含所有与版本控制直接相关的业务逻辑
 * @author 简·记项目组
 * @version 1.0.0
 */

// 导入依赖模块
import * as dom from './dom.js';
import { 
    getNotesData, setNotesData, getCurrentNoteId,
    getCmEditor, setCmEditor
} from './state.js';
import { generateVersionHash, handleError, showToast, isMobile } from './utils.js';
import { getStorage } from './storage-manager.js';
// 移除UI相关导入，通过事件通知UI更新

/**
 * 创建一个新的笔记版本
 * @returns {Promise<boolean>} 是否成功创建版本
 */
export async function saveVersion() {
    const currentNoteId = getCurrentNoteId();
    if (!currentNoteId) return false;

    const cmEditor = getCmEditor();
    if (!cmEditor || cmEditor.isClean()) {
        console.log('内容未修改，无需创建新版本。');
        return false;
    }

    try {
        const notesData = getNotesData();
        const note = notesData.notes[currentNoteId];
        const currentContent = cmEditor.getValue();

        const newVersion = {
            // 使用 utils.js 中的函数
            hash: generateVersionHash(currentContent), 
            timestamp: new Date().toISOString(),
            content: currentContent,
            // ✅ 【核心修复】重新添加 message 字段
            message: '自动保存'
        };

        if (!note.versions) {
            note.versions = [];
        }
        
        // 将新版本添加到版本历史的开头
        note.versions.unshift(newVersion);
        note.content = currentContent;
        note.lastModified = Date.now();

        setNotesData(notesData);
        
        // 保存到本地存储
        const storage = getStorage();
        await storage.saveData(notesData);

        cmEditor.markClean(); // 标记为"干净"状态

        // ✅ 【核心修复】在成功保存版本后，立即销毁当前笔记的编辑会话
        const { deleteSessionState } = await import('./state.js');
        deleteSessionState(currentNoteId);

        // 触发版本保存成功事件
        document.dispatchEvent(new CustomEvent('versionSaved', { detail: { noteId: currentNoteId } }));

        console.log(`✅ 新版本创建成功: ${currentNoteId}`);
        showToast('新版本已保存', 'success');
        return true;
    } catch (error) {
        handleError(error, '创建新版本失败');
        return false;
    }
}

/**
 * 恢复指定版本
 * @param {number} versionIndex - 版本索引
 * @returns {Promise<boolean>} 是否成功恢复版本
 */
export async function restoreVersion(versionIndex) {
    const currentNoteId = getCurrentNoteId();
    if (!currentNoteId) return false;

    const notesData = getNotesData();
    const note = notesData.notes[currentNoteId];
    const versions = note.versions || [];

    if (versionIndex < 0 || versionIndex >= versions.length) {
        showToast('版本索引无效', 'error');
        return false;
    }

    const version = versions[versionIndex];
    
    try {
        // 恢复版本内容
        note.content = version.content;
        note.lastModified = Date.now();
        setNotesData(notesData);
        
        // 保存到本地存储
        const storage = getStorage();
        storage.saveData(notesData).catch(error => {
            console.error('恢复版本后保存失败:', error);
        });

        // 根据当前模式更新内容
        const cmEditor = getCmEditor();
        if (cmEditor) {
            // 如果当前在编辑模式，更新编辑器内容
            cmEditor.setValue(version.content);
            cmEditor.markClean();
            
            // ✅ 【新增】触发字数统计更新（版本恢复时需要更新）
            document.dispatchEvent(new CustomEvent('wordCountUpdate'));
        } else {
            // 如果当前在预览模式，刷新预览内容
            const { enterPreviewMode } = await import('./note.js');
            enterPreviewMode();
            
            // ✅ 【新增】触发字数统计更新（版本恢复时需要更新）
            document.dispatchEvent(new CustomEvent('wordCountUpdate'));
        }

        // 检测设备类型并决定是否关闭版本历史栏
        if (isMobile()) {
            // 移动端：自动关闭版本历史栏
            const { hideVersions } = await import('./ui.js');
            hideVersions();
        }
        // PC端：保持版本历史栏打开

        showToast('版本恢复成功', 'success');
        return true;
    } catch (error) {
        handleError(error, '恢复版本失败');
        return false;
    }
}

/**
 * 删除指定版本
 * @param {number} versionIndex - 版本索引
 * @returns {Promise<boolean>} 是否成功删除版本
 */
export async function deleteVersion(versionIndex) {
    const currentNoteId = getCurrentNoteId();
    if (!currentNoteId) return false;

    const notesData = getNotesData();
    const note = notesData.notes[currentNoteId];
    const versions = note.versions || [];

    if (versionIndex < 0 || versionIndex >= versions.length) {
        showToast('版本索引无效', 'error');
        return false;
    }

    if (!confirm('确定要删除这个版本吗？此操作不可恢复！')) {
        return false;
    }

    try {
        // 删除指定版本
        versions.splice(versionIndex, 1);
        note.versions = versions;
        setNotesData(notesData);
        
        // 保存到本地存储
        const storage = getStorage();
        await storage.saveData(notesData);

        // 重新渲染版本历史
        const { showVersions } = await import('./ui.js');
        showVersions();

        showToast('版本删除成功', 'success');
        return true;
    } catch (error) {
        handleError(error, '删除版本失败');
        return false;
    }
}

/**
 * 对比并显示版本差异
 * @param {number} versionIndex - 版本索引
 * @returns {boolean} 是否成功显示差异
 */
export function showVersionDiff(versionIndex) {
    const currentNoteId = getCurrentNoteId();
    if (!currentNoteId) return false;

    const notesData = getNotesData();
    const note = notesData.notes[currentNoteId];
    const versions = note.versions || [];

    if (versionIndex < 0 || versionIndex >= versions.length) {
        handleError(new Error('版本索引无效'), '版本索引无效');
        return false;
    }

    const selectedVersion = versions[versionIndex];
    const previousVersionContent = versions[versionIndex + 1] 
        ? versions[versionIndex + 1].content 
        : ''; // 如果是第一个版本，则与空内容比较
    
    // 调用UI模块来渲染差异面板
            // 触发版本差异显示事件
        document.dispatchEvent(new CustomEvent('showVersionDiff', { 
            detail: { 
                currentContent: selectedVersion.content, 
                previousContent: previousVersionContent, 
                versionIndex 
            } 
        }));

    return true;
}

/**
 * 获取当前笔记的版本历史
 * @returns {Array} 版本历史数组
 */
export function getVersionHistory() {
    const currentNoteId = getCurrentNoteId();
    if (!currentNoteId) return [];

    const notesData = getNotesData();
    const note = notesData.notes[currentNoteId];
    return note.versions || [];
}

/**
 * 获取指定版本的详细信息
 * @param {number} versionIndex - 版本索引
 * @returns {Object|null} 版本信息对象，如果索引无效则返回null
 */
export function getVersionInfo(versionIndex) {
    const versions = getVersionHistory();
    if (versionIndex < 0 || versionIndex >= versions.length) {
        return null;
    }
    return versions[versionIndex];
}

/**
 * 检查当前笔记是否有未保存的更改
 * @returns {boolean} 是否有未保存的更改
 */
export function hasUnsavedChanges() {
    const cmEditor = getCmEditor();
    return cmEditor && !cmEditor.isClean();
}

/**
 * 获取版本统计信息
 * @returns {Object} 版本统计信息
 */
export function getVersionStats() {
    const versions = getVersionHistory();
    return {
        totalVersions: versions.length,
        latestVersion: versions[0] || null,
        oldestVersion: versions[versions.length - 1] || null
    };
}
