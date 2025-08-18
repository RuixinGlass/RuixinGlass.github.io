/**
 * @file 应用主入口 (指挥中心)
 * @description 负责应用初始化流程的编排和模块协调。
 * @author 简·记项目组
 * @version 2.0.0
 */

import { validateDOMElements } from './dom.js';
import { loadFromLocalStorage, checkAndRepairData, setupAutoSave, switchNote } from './note.js';
import { getCurrentNoteId, setCurrentNoteId, getNotesData } from './state.js';
import { initializeUI, renderNotesList, showWelcomePage } from './ui.js';
import { setupDOMEventListeners, setupCustomEventListeners } from './events.js';
import { handleError, showToast } from './utils.js';
import { initUpdateDetection, startPeriodicUpdateCheck } from './update-manager.js';
import { initializeCloudSync } from './cloud-sync.js';
import { initializeImportExport } from './import-export.js';
import { initializeAtomicMigration, setupKeyboardShortcuts as setupMigrationKeyboardShortcuts } from './data-migration-manager.js';

/**
 * @function initializeApp
 * @description 应用初始化总流程。
 * 按照 数据加载 -> UI初始化 -> 事件绑定 -> 启动后台服务 的顺序执行。
 */
async function initializeApp() {
    try {
        console.log('🚀 应用初始化开始...');

        // 1. 验证核心DOM元素
        const domValidation = validateDOMElements();
        if (!domValidation.success) {
            throw new Error(`DOM元素缺失: ${domValidation.missing.join(', ')}`);
        }

        // 2. 加载并校验数据
        await loadFromLocalStorage();
        checkAndRepairData();

        // 3. 渲染笔记列表 (在初始化UI之前，确保列表数据已准备好)
        renderNotesList();

        // 4. 设置自定义事件监听器 (必须在initializeUI之前设置)
        setupCustomEventListeners();

        // 5. 初始化整体UI（包括侧边栏、欢迎页/笔记页决策）
        console.log('🎨 开始初始化UI...');
        try {
            initializeUI();
            console.log('✅ UI初始化完成');
        } catch (error) {
            console.error('❌ UI初始化失败:', error);
            throw error; // 重新抛出错误，让外层catch处理
        }
        
        // 6. 处理业务决策逻辑
        console.log('🔍 准备调用 handleInitialBusinessLogic...');
        console.log('🔍 当前时间戳:', Date.now());
        try {
            handleInitialBusinessLogic();
            console.log('🔍 handleInitialBusinessLogic 调用完成');
        } catch (error) {
            console.error('❌ handleInitialBusinessLogic 调用失败:', error);
            throw error;
        }
        
        // 6. 启动自动保存等后台机制
        setupAutoSave();
        
        // 7. 初始化更新检测系统
        initUpdateDetection();
        startPeriodicUpdateCheck();
        
        // 8. 初始化业务模块
        initializeBusinessModules();
        
        // 9. 设置DOM事件监听器
        setupDOMEventListeners();

        console.log('✅ 应用加载完成！');
        showToast('应用加载完成！', 'success');

    } catch (error) {
        console.error('❌ 应用初始化失败:', error);
        handleError(error, '应用启动失败，请刷新页面。');
    }
}

/**
 * 初始化业务模块
 */
function initializeBusinessModules() {
    console.log('🔧 初始化业务模块...');
    
    // 初始化云同步功能
    initializeCloudSync({
        cloudSyncBtn: document.getElementById('cloudSyncBtn'),
        cloudSyncModal: document.getElementById('cloudSyncModal'),
        cloudSyncCloseBtn: document.getElementById('cloudSyncCloseBtn'),
        cloudSyncPushBtn: document.getElementById('cloudSyncPushBtn'),
        cloudSyncPullBtn: document.getElementById('cloudSyncPullBtn'),
        cloudTokenInput: document.getElementById('cloudTokenInput'),
        cloudGistIdInput: document.getElementById('cloudGistIdInput'),
        cloudSyncStatus: document.getElementById('cloudSyncStatus')
    });
    
    // 初始化导入导出功能
    initializeImportExport({
        exportNoteBtn: document.getElementById('exportNoteBtn'),
        importAllBtn: document.getElementById('importAllBtn'),
        importModal: document.getElementById('importModal'),
        importMdBtn: document.getElementById('importMdBtn'),
        importModalCloseBtn: document.getElementById('importModalCloseBtn')
    });
    
    // 初始化原子化存储迁移功能
    initializeAtomicMigration();
    
    // 设置迁移相关快捷键支持
    setupMigrationKeyboardShortcuts();
    
            console.log('✅ 业务模块初始化完成');
}

/**
 * 处理初始业务决策逻辑
 */
function handleInitialBusinessLogic() {
    console.log('🧠 处理初始业务决策逻辑...');
    
    try {
        const notesData = getNotesData();
        let noteIdToLoad = getCurrentNoteId();
        console.log('🔍 当前笔记ID:', noteIdToLoad);
        console.log('🔍 笔记数量:', Object.keys(notesData.notes).length);

    // 如果笔记列表不为空，但当前ID无效，则默认加载最后一篇
    if (Object.keys(notesData.notes).length > 0 && !notesData.notes[noteIdToLoad]) {
        const noteKeys = Object.keys(notesData.notes);
        noteIdToLoad = noteKeys[noteKeys.length - 1];
        setCurrentNoteId(noteIdToLoad);
        console.log('📝 设置默认笔记ID:', noteIdToLoad);
    }

        if (noteIdToLoad) {
            // 如果有笔记要加载，切换到笔记场景并触发笔记切换事件
            console.log('📖 加载笔记:', noteIdToLoad);
            document.dispatchEvent(new CustomEvent('loadNote', { detail: { noteId: noteIdToLoad } }));
        } else {
            // 否则，显示欢迎页面
            console.log('👋 显示欢迎页面');
            showWelcomePage();
        }
    } catch (error) {
        console.error('❌ 处理初始业务决策逻辑失败:', error);
        handleError(error, '初始化业务逻辑失败');
    }
}


// 监听DOM加载完成事件，启动应用
document.addEventListener('DOMContentLoaded', initializeApp);
