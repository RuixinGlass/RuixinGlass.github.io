/**
 * 应用状态管理器
 * 提供安全的getter/setter函数，避免直接状态修改
 * 
 * @description 此模块负责管理应用的全局状态，提供统一的状态访问接口
 * @author 简·记项目组
 * @version 1.0.0
 */

// ========== 核心状态变量 ==========
let notesData = {
    currentNoteId: null,
    notes: {}
};

let cmEditor = null; // Codemirror 5 实例
let selectedTags = []; // 当前选中的标签
let searchKeyword = '';
let lastMainPanelScrollRatio = 0; // 记录滚动像素值

// ========== 会话状态档案馆 ==========
const sessionState = new Map();

// 会话状态对象结构
class SessionState {
    constructor(noteId) {
        this.noteId = noteId;
        this.content = '';
        this.history = null;
        this.cursor = null;
        this.scrollPosition = null;
        this.mode = 'preview';
        this.lastAccess = Date.now();
        this.isDirty = false;
    }
    
    // 从CodeMirror实例创建会话状态
    static fromCodeMirror(noteId, cmEditor) {
        const state = new SessionState(noteId);
        state.content = cmEditor.getValue();
        state.history = cmEditor.getHistory();
        state.cursor = cmEditor.getCursor();
        state.scrollPosition = cmEditor.getScrollInfo();
        state.mode = 'edit';
        state.isDirty = !cmEditor.isClean();
        state.lastAccess = Date.now();
        return state;
    }
    
    // 恢复到CodeMirror实例
    restoreToCodeMirror(cmEditor) {
        try {
            if (this.content) {
                cmEditor.setValue(this.content);
            }
            if (this.history) {
                cmEditor.setHistory(this.history);
            }
            if (this.cursor) {
                cmEditor.setCursor(this.cursor);
            }
            if (this.scrollPosition) {
                cmEditor.scrollTo(this.scrollPosition.left, this.scrollPosition.top);
            }
        } catch (error) {
            console.error('恢复会话状态失败:', error);
        }
    }
}

// ========== 状态访问器函数 ==========

/**
 * 获取笔记数据
 * @returns {Object} 当前笔记数据
 */
export function getNotesData() {
    return notesData;
}

/**
 * 设置笔记数据
 * @param {Object} newNotesData - 新的笔记数据
 */
export function setNotesData(newNotesData) {
    notesData = newNotesData;
}

/**
 * 获取当前笔记ID
 * @returns {string|null} 当前笔记ID
 */
export function getCurrentNoteId() {
    return notesData.currentNoteId;
}

/**
 * 设置当前笔记ID
 * @param {string} noteId - 笔记ID
 */
export function setCurrentNoteId(noteId) {
    notesData.currentNoteId = noteId;
}

/**
 * 获取编辑器实例
 * @returns {Object|null} CodeMirror编辑器实例
 */
export function getCmEditor() {
    return cmEditor;
}

/**
 * 设置编辑器实例
 * @param {Object} editor - CodeMirror编辑器实例
 */
export function setCmEditor(editor) {
    cmEditor = editor;
}

/**
 * 获取选中的标签
 * @returns {Array} 选中的标签数组
 */
export function getSelectedTags() {
    return selectedTags;
}

/**
 * 设置选中的标签
 * @param {Array} tags - 标签数组
 */
export function setSelectedTags(tags) {
    selectedTags = tags;
}

/**
 * 获取搜索关键词
 * @returns {string} 搜索关键词
 */
export function getSearchKeyword() {
    return searchKeyword;
}

/**
 * 设置搜索关键词
 * @param {string} keyword - 搜索关键词
 */
export function setSearchKeyword(keyword) {
    searchKeyword = keyword;
}

/**
 * 获取主面板滚动像素值
 * @returns {number} 滚动像素值
 */
export function getLastMainPanelScrollRatio() {
    return lastMainPanelScrollRatio;
}

/**
 * 设置主面板滚动像素值
 * @param {number} pixels - 滚动像素值
 */
export function setLastMainPanelScrollRatio(pixels) {
    lastMainPanelScrollRatio = pixels;
}

// ========== 会话状态管理 ==========

/**
 * 获取会话状态
 * @param {string} noteId - 笔记ID
 * @returns {SessionState|null} 会话状态对象
 */
export function getSessionState(noteId) {
    return sessionState.get(noteId);
}

/**
 * 设置会话状态
 * @param {string} noteId - 笔记ID
 * @param {SessionState} state - 会话状态对象
 */
export function setSessionState(noteId, state) {
    sessionState.set(noteId, state);
}

/**
 * 删除会话状态
 * @param {string} noteId - 笔记ID
 */
export function deleteSessionState(noteId) {
    sessionState.delete(noteId);
}

/**
 * 清理过期的会话状态（超过1小时未访问）
 */
export function cleanupExpiredSessionStates() {
    const oneHourAgo = Date.now() - 3600000;
    for (const [noteId, state] of sessionState) {
        if (state.lastAccess < oneHourAgo) {
            sessionState.delete(noteId);
        }
    }
}

/**
 * 获取所有会话状态
 * @returns {Map} 会话状态Map
 */
export function getAllSessionStates() {
    return sessionState;
}

// ========== 应用状态查询 ==========

/**
 * 获取应用状态概览
 * @returns {Object} 应用状态信息
 */
export function getAppStatus() {
    return {
        notesCount: Object.keys(notesData.notes || {}).length,
        currentNoteId: notesData.currentNoteId,
        selectedTagsCount: selectedTags.length,
        searchKeyword: searchKeyword,
        sessionStatesCount: sessionState.size,
        cmEditorLoaded: !!cmEditor
    };
}

/**
 * 检查是否有未保存的更改
 * @returns {boolean} 是否有未保存的更改
 */
export function hasUnsavedChanges() {
    if (!cmEditor) return false;
    return !cmEditor.isClean();
}

// ========== 导出状态变量（只读） ==========
export { SessionState };
