/**
 * 笔记核心操作模块
 * 负责笔记的增、删、改、查、切换等核心操作
 * 
 * @description 此模块包含所有与笔记直接相关的业务逻辑
 * @author 简·记项目组
 * @version 1.0.0
 */

// 导入依赖模块
import * as dom from './dom.js';
import { 
    getNotesData, setNotesData, getCurrentNoteId, setCurrentNoteId,
    getCmEditor, setCmEditor, SessionState, setSessionState, getSessionState, deleteSessionState,
    getLastMainPanelScrollRatio, setLastMainPanelScrollRatio
} from './state.js';
import { generateId, handleError, showToast, debounce, isMobile } from './utils.js';
import { initializeStorage, saveNotesData, loadNotesData } from './storage-manager.js';

/**
 * 从本地存储加载数据
 */
export async function loadFromLocalStorage() {
    try {
        // 初始化存储系统
        await initializeStorage();
        
        // 尝试从 IndexedDB 加载数据
        const data = await loadNotesData();
        const notesData = getNotesData();
        notesData.currentNoteId = data.currentNoteId;
        notesData.notes = data.notes;
        setNotesData(notesData);
        console.log('从 IndexedDB 加载数据成功');
        
    } catch (error) {
        console.error('数据加载失败:', error);
        
        // 尝试自动数据恢复
        try {
            const { recoverData } = await import('./data-migration-manager.js');
            const recoverySuccess = await recoverData();
            
            if (recoverySuccess) {
                console.log('✅ 自动数据恢复成功');
                showToast('数据已从备份自动恢复', 'success');
                return; // 恢复成功，重新加载数据
            }
        } catch (recoveryError) {
            console.error('自动数据恢复失败:', recoveryError);
        }
        
        // 恢复失败，使用默认空数据
        const notesData = getNotesData();
        notesData.currentNoteId = null;
        notesData.notes = {};
        setNotesData(notesData);
        
        // 提示用户手动恢复
        console.warn('建议使用 Ctrl+Shift+R 进行手动数据恢复');
    }
}

/**
 * 保存数据到本地存储
 */
export async function saveToLocalStorage() {
    try {
        const notesData = getNotesData();
        await saveNotesData(notesData);
        console.log('IndexedDB 数据保存成功，笔记数量:', Object.keys(notesData.notes).length);
    } catch (error) {
        console.error('保存数据到 IndexedDB 失败:', error);
        // 不抛出错误，让应用继续运行
    }
}

/**
 * 检查并修复数据完整性
 */
export function checkAndRepairData() {
    console.log('开始数据完整性检查...');
    
    const notesData = getNotesData();
    
    // 检查笔记数据结构
    if (!notesData.notes || typeof notesData.notes !== 'object') {
        console.warn('笔记数据结构异常，正在修复...');
        notesData.notes = {};
    }
    
    // 检查每个笔记的完整性
    const noteIds = Object.keys(notesData.notes);
    
    noteIds.forEach(noteId => {
        const note = notesData.notes[noteId];
        
        // 检查笔记对象是否存在
        if (!note || typeof note !== 'object') {
            console.warn(`笔记 ${noteId} 数据异常，正在删除...`);
            delete notesData.notes[noteId];
            return;
        }
        
        // 检查必要字段
        if (typeof note.content !== 'string') {
            note.content = '';
        }
        
        if (typeof note.title !== 'string') {
            note.title = '未命名笔记';
        }
        
        if (!Array.isArray(note.versions)) {
            note.versions = [];
        }
        
        if (!note.lastModified) {
            note.lastModified = Date.now();
        }
    });
    
    // 检查当前笔记ID是否有效
    if (notesData.currentNoteId && !notesData.notes[notesData.currentNoteId]) {
        console.warn('当前笔记ID无效，正在重置...');
        notesData.currentNoteId = null;
    }
    
    setNotesData(notesData);
    console.log('数据完整性检查完成');
}

/**
 * 创建新笔记
 */
export function createNote() {
    const noteId = generateId('note');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    // ✅ 【修复】恢复旧版的 front matter 和默认内容
    const frontMatter = `---\ntitle: 新笔记\ntags: []\ndate: ${dateStr}\n---\n\n`;
    
    const notesData = getNotesData();
    notesData.notes[noteId] = {
        title: '新笔记', // 标题也恢复为不带日期的'新笔记'
        content: frontMatter + '开始记录你的想法吧！',
        versions: [],
        lastModified: Date.now()
    };
    
    setNotesData(notesData);
    setCurrentNoteId(noteId);
    
    console.log('新笔记创建成功:', noteId);
    return noteId;
}

/**
 * 删除笔记
 * @param {string} noteId - 笔记ID
 * @returns {Promise<string|null>} 返回新的当前笔记ID，如果没有笔记则返回null
 */
export async function deleteNote(noteId) {
    const notesData = getNotesData();
    if (!notesData.notes[noteId]) return null;

    const currentNoteId = getCurrentNoteId();
    delete notesData.notes[noteId];
    
    // 如果删除的是当前笔记
    if (currentNoteId === noteId) {
        const remainingIds = Object.keys(notesData.notes);
        // ✅ 【优化】设置并返回新的笔记ID，如果没有则返回 null
        const newCurrentNoteId = remainingIds.length > 0 ? remainingIds[remainingIds.length - 1] : null;
        setCurrentNoteId(newCurrentNoteId);
        setNotesData(notesData);
        await saveToLocalStorage();
        return newCurrentNoteId;
    }

    // 如果删除的不是当前笔记，当前笔记ID不变
    setNotesData(notesData);
    await saveToLocalStorage();
    return currentNoteId; 
}

/**
 * 切换笔记
 * @param {string} noteId - 笔记ID
 * @param {boolean} forceEditMode - 是否强制进入编辑模式（可选）
 */
export async function switchNote(noteId, forceEditMode = false) {
    // ✅ 【优化】在函数开头调用场景切换，确保离开欢迎页
    // 触发场景切换事件，让UI模块响应
    document.dispatchEvent(new CustomEvent('sceneChanged', { detail: { scene: 'note' } }));

    const notesData = getNotesData();
    const oldNoteId = getCurrentNoteId();

    if (!notesData.notes[noteId]) {
        console.warn('尝试切换到不存在的笔记:', noteId);
        return false;
    }
    
    // --- 核心修复：在这里立即更新并保存 currentNoteId ---
    setCurrentNoteId(noteId);
    await saveToLocalStorage(); // 确保新的 currentNoteId 被立即持久化
    // ----------------------------------------------------

    // ✅ 【修复核心】在切换前，无条件销毁任何可能存在的旧编辑器实例
    const cmEditor = getCmEditor();
    if (cmEditor) {
        // 如果旧笔记处于编辑模式，保存其会话状态
        if (oldNoteId && !cmEditor.isClean()) {
             console.log(`📝 正在为笔记 ${oldNoteId} 保存编辑会话...`);
             const sessionEntry = SessionState.fromCodeMirror(oldNoteId, cmEditor);
             setSessionState(oldNoteId, sessionEntry);
        }
        cmEditor.toTextArea(); // 彻底销毁实例
        setCmEditor(null);     // 清空状态
    }

    // --- 现在我们处于一个干净的状态，开始加载新笔记 ---
    const note = notesData.notes[noteId];

    // 更新基础UI元素
    if (dom.noteTitleEl) {
        dom.noteTitleEl.value = note.title || '';
    }
    if (dom.noteEditorEl) {
        dom.noteEditorEl.value = note.content || ''; // 为编辑器预置内容
    }

    // ✅ 【修复核心】决策逻辑：检查新笔记是否存在会话或强制编辑模式
    const sessionToRestore = getSessionState(noteId);
    if (sessionToRestore || forceEditMode) {
        if (sessionToRestore) {
            console.log(`🔄 发现笔记 ${noteId} 的编辑会话，正在恢复...`);
        } else {
            console.log(`📝 强制进入编辑模式: ${noteId}`);
        }
        enterEditMode(true); // 恢复会话或直接进入编辑模式
    } else {
        console.log(`👁️ 笔记 ${noteId} 无会话，默认进入预览模式。`);
        enterPreviewMode(); // 默认进入预览模式
    }

    console.log('笔记切换成功:', noteId);
    
    // ✅ 【Bug #6 修复】如果版本历史面板是打开的，强制用新笔记的内容刷新它
    if (dom.versionsPanelEl.classList.contains('active')) {
        const { showVersions } = await import('./ui.js');
        showVersions();
    }
    
    // 触发UI更新事件
    document.dispatchEvent(new CustomEvent('noteSwitched', { detail: { noteId } }));
    
    // ✅ 【新增】触发字数统计更新（笔记切换时需要更新）
    document.dispatchEvent(new CustomEvent('wordCountUpdate'));
    
    // ✅ 【新增】在移动端自动收起侧边栏
    // 检查当前是否为移动端视图，并且侧边栏是否处于展开状态
    if (isMobile() && dom.notesListPanel && !dom.notesListPanel.classList.contains('drawer-collapsed')) {
        // 触发侧边栏收起事件
        document.dispatchEvent(new CustomEvent('sidebarCollapse'));
        
        console.log('📱 移动端检测到侧边栏展开，已自动收起');
    }
    
    return true;
}

/**
 * 保存当前笔记
 */
export async function saveCurrentNote() {
    const currentNoteId = getCurrentNoteId();
    if (!currentNoteId) {
        console.warn('没有当前笔记，无法保存');
        return false;
    }
    
    const notesData = getNotesData();
    const note = notesData.notes[currentNoteId];
    
    if (!note) {
        console.warn('当前笔记不存在，无法保存');
        return false;
    }
    
    // 获取标题和内容
    if (dom.noteTitleEl) {
        note.title = dom.noteTitleEl.value || '未命名笔记';
    }
    
    // 获取编辑器内容
    const cmEditor = getCmEditor();
    if (cmEditor) {
        note.content = cmEditor.getValue();
    } else if (dom.noteEditorEl) {
        note.content = dom.noteEditorEl.value || '';
    }
    
    // 更新时间戳
    note.lastModified = Date.now();
    
    // 更新状态
    setNotesData(notesData);
    
    // 保存到本地存储
    try {
        await saveToLocalStorage();
    } catch (error) {
        console.error('保存笔记失败:', error);
        handleError(error, '保存笔记失败');
    }
    
    console.log('笔记保存成功:', currentNoteId);
    return true;
}

/**
 * 进入编辑模式
 * @param {boolean} [isRestoringSession=false] - 是否尝试恢复会话
 */
export function enterEditMode(isRestoringSession = false) {
    const currentNoteId = getCurrentNoteId();
    if (!currentNoteId) return;

    // 如果已经存在编辑器实例，则无需任何操作
    if (getCmEditor()) {
        getCmEditor().focus();
        return;
    }
    
    const notesData = getNotesData();
    const note = notesData.notes[currentNoteId];

    // 隐藏预览区域，显示编辑器
    dom.notePreviewEl.style.display = 'none';
    dom.noteEditorEl.style.display = 'block';
    
    try {
        const editor = CodeMirror.fromTextArea(dom.noteEditorEl, {
            mode: 'markdown',
            theme: 'default',
            lineNumbers: false, // 移除行号，保持简约风格
            lineWrapping: true,
            autofocus: true,
            extraKeys: {
                'Ctrl-S': async function(cm) {
                    try {
                        await saveCurrentNote();
                    } catch (error) {
                        console.error('Ctrl+S 保存失败:', error);
                    }
                }
            },
            
            // ✅ 【决定性修复】从旧版 app.js 恢复此关键选项。
            // 这会强制 CodeMirror 一次性渲染整个文档，确保其容器获得正确、完整的 scrollHeight。
            // 这是解决长文档滚动定位问题的最可靠方法。
            viewportMargin: Infinity
        });
        setCmEditor(editor);

        // ✅ 【修复核心】简化会话恢复逻辑
        const sessionEntry = getSessionState(currentNoteId);
        if (isRestoringSession && sessionEntry) {
            console.log(`🔄 恢复笔记 ${currentNoteId} 的编辑会话...`);
            sessionEntry.restoreToCodeMirror(editor);
        } else {
            // 无论是新编辑还是无会话可恢复，都使用笔记的当前内容
            editor.setValue(note.content || '');
            editor.markClean(); // 建立一个新的"干净"起点
        }
        
        // 绑定编辑器事件
        editor.on('change', () => {
            // 触发字数统计更新事件
            document.dispatchEvent(new CustomEvent('wordCountUpdate'));
        });
        
        // ✅ 【新增】为新创建的编辑器实例绑定防抖保存
        const debouncedSaveHandler = debounce(async () => {
            console.log('...自动保存(防抖)...');
            try {
                await saveCurrentNote();
            } catch (error) {
                console.error('防抖保存失败:', error);
            }
        }, 2000);
        editor.on('change', debouncedSaveHandler);
        
        // 触发编辑模式事件
        document.dispatchEvent(new CustomEvent('editModeEntered'));
        if(dom.contentArea) dom.contentArea.classList.add('editing-mode');

        // 关键：必须在设置完内容之后再调用 refresh，确保编辑器内部状态正确。
        editor.refresh();
        
        // ✅ 【修复】强制重新渲染编辑器，解决内容不显示的问题
        setTimeout(() => {
            editor.refresh();
            editor.focus();
        }, 10);
        
        // 保持 setTimeout(0) 结构，作为第二重保险，确保滚动在浏览器完成渲染之后发生。
        setTimeout(() => {
            if (dom.mainPanel) {
                const scrollTop = getLastMainPanelScrollRatio();
                dom.mainPanel.scrollTop = scrollTop;
            }
        }, 0);

        console.log('进入编辑模式:', currentNoteId);

    } catch (error) {
        handleError(error, '编辑器加载失败');
        setCmEditor(null); // 失败时清空实例
    }
}

/**
 * 进入预览模式
 */
export function enterPreviewMode() {
    const currentNoteId = getCurrentNoteId();
    if (!currentNoteId) {
        console.warn('没有当前笔记，无法进入预览模式');
        return;
    }

    // ✅ 【核心修复】作为退出编辑的统一出口，在这里立即销毁会话
    deleteSessionState(currentNoteId);

    // 触发预览模式事件
    document.dispatchEvent(new CustomEvent('previewModeEntered'));
    
    // ✅ 【新增】从状态管理器中获取当前笔记对象
    const notesData = getNotesData();
    const note = notesData.notes[currentNoteId];
    if (!note) {
        handleError(new Error(`笔记数据丢失: ${currentNoteId}`), '无法加载笔记内容');
        return;
    }
    
    // 保存当前编辑内容
    const cmEditor = getCmEditor();
    if (cmEditor) {
        // 🔴【清理】删除错误的滚动捕获代码，因为编辑器本身没有滚动
        // 滚动位置已经在 events.js 中从 .note-main-panel 正确捕获

        note.content = cmEditor.getValue();
        note.lastModified = Date.now();
        setNotesData(notesData);
        
        // 销毁编辑器
        cmEditor.toTextArea();
        setCmEditor(null);
    }
    
    // 显示预览区域，隐藏编辑器
    dom.notePreviewEl.style.display = 'block';
    dom.noteEditorEl.style.display = 'none';
    
    // 触发预览内容更新事件
    document.dispatchEvent(new CustomEvent('previewContentUpdate', { 
        detail: { content: note.content || '' } 
    }));
    
    // ✅【解决方案】使用 requestAnimationFrame 确保在浏览器绘制后执行滚动操作
    requestAnimationFrame(() => {
        if (dom.mainPanel) {
            const scrollTop = getLastMainPanelScrollRatio();
            console.log('🔄 恢复预览模式滚动位置:', scrollTop, 'px');
            dom.mainPanel.scrollTop = scrollTop;
        } else {
            console.warn('⚠️ 未找到主面板元素');
        }
    });
    
    // 更新内容区域样式
    if (dom.contentArea) {
        dom.contentArea.classList.remove('editing-mode');
    }
    
    console.log('进入预览模式:', currentNoteId);
}



// ✅ 移除重复的 updateEditButtonState 函数，UI更新逻辑已移至 ui.js

/**
 * 设置自动保存机制
 */
export function setupAutoSave() {
    console.log('🛡️ 启动自动保存机制...');

    // 1. 定时保存
    setInterval(async () => {
        const cmEditor = getCmEditor();
        if (cmEditor && !cmEditor.isClean()) {
            console.log('...自动保存(定时)...');
            try {
                await saveCurrentNote();
            } catch (error) {
                console.error('自动保存失败:', error);
            }
        }
    }, 30000); // 30秒

    // 2. 页面关闭前保存
    window.addEventListener('beforeunload', async () => {
        const cmEditor = getCmEditor();
        if (cmEditor && !cmEditor.isClean()) {
            console.log('...页面关闭前保存...');
            try {
                await saveCurrentNote();
            } catch (error) {
                console.error('页面关闭前保存失败:', error);
            }
        }
    });
}


