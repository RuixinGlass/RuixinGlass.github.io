/**
 * DOM元素管理器
 * 集中管理所有DOM元素引用，提供单一事实来源
 * 
 * @description 此模块负责获取和导出所有DOM元素引用，确保模块间DOM访问的一致性
 * @author 简·记项目组
 * @version 1.0.0
 */

// 导出常用的 DOM 元素引用
export const notesListEl = document.getElementById('notesList');
export const addNoteBtn = document.getElementById('addNoteBtn');
export const noteTitleEl = document.getElementById('noteTitle');
export const noteEditorEl = document.getElementById('noteEditor');
export const notePreviewEl = document.getElementById('notePreview');
export const editBtn = document.getElementById('editBtn');
export const showVersionsBtn = document.getElementById('showVersionsBtn');
export const exportNoteBtn = document.getElementById('exportNoteBtn');

// 欢迎界面
export const fullscreenWelcome = document.getElementById('fullscreenWelcome');

// 版本控制相关
export const versionsPanelEl = document.getElementById('versionsPanel');
export const versionsListEl = document.getElementById('versionsList');
export const closeVersionsBtn = document.getElementById('closeVersionsBtn');

// 搜索和标签
export const searchInputEl = document.getElementById('searchInput');
export const tagsListEl = document.getElementById('tagsList');
export const wordCountEl = document.getElementById('wordCount');

// 云同步相关
export const cloudSyncBtn = document.getElementById('cloudSyncBtn');
export const cloudSyncBtnMobile = document.getElementById('cloudSyncBtnMobile');
export const cloudSyncModal = document.getElementById('cloudSyncModal');
export const cloudSyncCloseBtn = document.getElementById('cloudSyncCloseBtn');
export const cloudSyncPushBtn = document.getElementById('cloudSyncPushBtn');
export const cloudSyncPullBtn = document.getElementById('cloudSyncPullBtn');
export const cloudTokenInput = document.getElementById('cloudTokenInput');
export const cloudGistIdInput = document.getElementById('cloudGistIdInput');
export const cloudSyncStatus = document.getElementById('cloudSyncStatus');

// 导入相关
export const importAllBtn = document.getElementById('importAllBtn');
export const importModal = document.getElementById('importModal');
export const importMdBtn = document.getElementById('importMdBtn');
export const importFolderBtn = document.getElementById('importFolderBtn');
export const importZipBtn = document.getElementById('importZipBtn');
export const importHtmlBtn = document.getElementById('importHtmlBtn');
export const importModalCloseBtn = document.getElementById('importModalCloseBtn');

// 工具栏
export const toolbar = document.getElementById('mobileToolbar');
export const btnUndo = document.getElementById('btnUndo');
export const btnRedo = document.getElementById('btnRedo');
export const btnPreview = document.getElementById('btnPreview');

// 侧边栏相关
export const notesListPanel = document.querySelector('.notes-list-panel');

// ✅ 新增：常用的 DOM 元素引用，避免重复查询
export const contentArea = document.querySelector('.content-area');
export const mainPanel = document.querySelector('.note-main-panel');
export const mobileDrawerHint = document.querySelector('.mobile-drawer-hint');
export const pcDrawerHint = document.querySelector('.pc-drawer-hint');
export const drawerMask = document.querySelector('.drawer-mask');
export const mainWrapper = document.querySelector('.main-content-wrapper');
export const noteHeader = document.querySelector('.note-header');

/**
 * 验证所有必需的DOM元素是否存在
 * @returns {Object} 验证结果 {success: boolean, missing: string[]}
 */
export function validateDOMElements() {
    const requiredElements = [
        'notesList', 'addNoteBtn', 'noteTitle', 'noteEditor', 'notePreview',
        'editBtn', 'showVersionsBtn', 'exportNoteBtn', 'versionsPanel',
        'versionsList', 'closeVersionsBtn', 'searchInput', 'tagsList',
        'wordCount', 'cloudSyncBtn', 'cloudSyncBtnMobile', 'cloudSyncModal',
        'cloudSyncCloseBtn', 'cloudSyncPushBtn', 'cloudSyncPullBtn',
        'cloudTokenInput', 'cloudGistIdInput', 'cloudSyncStatus',
        'importAllBtn', 'importModal', 'importMdBtn', 'importFolderBtn',
        'importZipBtn', 'importHtmlBtn', 'importModalCloseBtn',
        'mobileToolbar', 'btnUndo', 'btnRedo', 'btnPreview'
    ];

    const missing = [];
    const elements = {
        notesListEl, addNoteBtn, noteTitleEl, noteEditorEl, notePreviewEl,
        editBtn, showVersionsBtn, exportNoteBtn, versionsPanelEl,
        versionsListEl, closeVersionsBtn, searchInputEl, tagsListEl,
        wordCountEl, cloudSyncBtn, cloudSyncBtnMobile, cloudSyncModal,
        cloudSyncCloseBtn, cloudSyncPushBtn, cloudSyncPullBtn,
        cloudTokenInput, cloudGistIdInput, cloudSyncStatus,
        importAllBtn, importModal, importMdBtn, importFolderBtn,
        importZipBtn, importHtmlBtn, importModalCloseBtn,
        toolbar, btnUndo, btnRedo, btnPreview,
        // ✅ 新增：常用的 DOM 元素引用
        contentArea, mainPanel, mobileDrawerHint, pcDrawerHint, drawerMask, mainWrapper, noteHeader
    };

    for (const [name, element] of Object.entries(elements)) {
        if (!element) {
            missing.push(name);
        }
    }

    return {
        success: missing.length === 0,
        missing,
        total: requiredElements.length,
        found: requiredElements.length - missing.length
    };
}

/**
 * 获取DOM元素验证状态
 * @returns {string} 验证状态描述
 */
export function getDOMStatus() {
    const validation = validateDOMElements();
    if (validation.success) {
        return `✅ 所有DOM元素加载成功 (${validation.found}/${validation.total})`;
    } else {
        return `❌ DOM元素缺失: ${validation.missing.join(', ')} (${validation.found}/${validation.total})`;
    }
}
