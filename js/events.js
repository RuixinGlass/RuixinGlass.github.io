/**
 * 事件中心
 * 集中管理所有DOM事件监听器和自定义事件监听器
 * 
 * @description 此模块负责所有事件的监听和处理，实现模块间的松耦合通信
 * @author 简·记项目组
 * @version 1.0.0
 * 
 * ========== 自定义事件定义 ==========
 * 
 * 业务逻辑事件（由业务模块触发）：
 * - loadNote: 加载指定笔记 { detail: { noteId: string } }
 * - sceneChanged: 场景切换 { detail: { scene: 'welcome' | 'note' } }
 * - noteSwitched: 笔记切换完成 { detail: { noteId: string } }
 * - editModeEntered: 进入编辑模式
 * - previewModeEntered: 进入预览模式
 * - previewContentUpdate: 预览内容更新 { detail: { content: string } }
 * - wordCountUpdate: 字数统计更新
 * - sidebarCollapse: 侧边栏收起
 * - versionSaved: 版本保存成功 { detail: { noteId: string } }
 * - showVersionDiff: 显示版本差异 { detail: { currentContent, previousContent, versionIndex } }
 * - uiInitialized: UI初始化完成
 * 
 * DOM事件（由用户交互触发）：
 * - 点击事件：新建笔记、编辑切换、版本操作等
 * - 输入事件：搜索、标题编辑等
 * - 触摸事件：移动端侧边栏手势等
 * - 键盘事件：快捷键等
 */
import * as dom from './dom.js';
import { createNote, deleteNote, switchNote, saveCurrentNote, enterEditMode, enterPreviewMode } from './note.js';
import { saveVersion, restoreVersion, deleteVersion, showVersionDiff } from './version.js';
import { renderNotesList, showVersions, hideVersions, switchScene, updateSidebarToggleIcon, toggleSidebar, collapseSidebar, expandSidebar, showCloudSyncModal, hideCloudSyncModal, showImportModal, hideImportModal } from './ui.js';
import { setSearchKeyword, setSelectedTags, getCmEditor, setLastMainPanelScrollRatio, getCurrentNoteId } from './state.js';
import { handleError, showToast, isMobile } from './utils.js';
// 移除业务模块导入，事件中心只负责事件绑定

export function setupDOMEventListeners() {
    console.log('🔗 绑定DOM事件监听器...');
    
    // ✅ 【新增】为全屏欢迎页添加点击事件
    if (dom.fullscreenWelcome) {
        dom.fullscreenWelcome.addEventListener('click', async () => {
            try {
                const newNoteId = createNote();
                // ✅ 【优化】直接进入编辑模式，避免不必要的预览模式切换
                await switchNote(newNoteId, true); // 传入 true 表示直接进入编辑模式
                showToast('新笔记已创建，开始书写吧！', 'success');
            } catch (error) {
                handleError(error, '创建第一篇笔记失败');
            }
        });
    }

    // 新建笔记
    if (dom.addNoteBtn) {
        dom.addNoteBtn.addEventListener('click', async () => {
            try {
                const newNoteId = createNote();
                await switchNote(newNoteId);
                // switchNote 内部已经调用了 renderNotesList
                enterEditMode(); // 创建后直接进入编辑模式
                showToast('新笔记创建成功', 'success');
            } catch (error) {
                handleError(error, '创建笔记失败');
            }
        });
    }

    // 搜索输入框
    if (dom.searchInputEl) {
        dom.searchInputEl.addEventListener('input', (e) => {
            try {
                const keyword = e.target.value;
                setSearchKeyword(keyword);
                renderNotesList();
            } catch (error) {
                handleError(error, '搜索失败');
            }
        });
    }

    // 编辑/预览切换按钮
    if (dom.editBtn) {
        dom.editBtn.addEventListener('click', async () => {
            try {
                            const contentArea = dom.contentArea;
            const isEditing = contentArea && contentArea.classList.contains('editing-mode');

            // ✅ 【核心修复】在使用前，先定义 mainPanel 变量
            const mainPanel = dom.mainPanel;

            // 无论当前是何种模式，都在切换前
            // 从唯一的滚动容器 .note-main-panel 捕获滚动位置。
            if (mainPanel) {
                setLastMainPanelScrollRatio(mainPanel.scrollTop);
                console.log('📝 捕获 .note-main-panel 滚动位置:', mainPanel.scrollTop, 'px');
            }

                if (isEditing) {
                    await saveVersion();
                    enterPreviewMode();
                } else {
                    enterEditMode();
                }
            } catch (error) {
                handleError(error, '切换编辑模式失败');
            }
        });
    }

    // 显示版本历史按钮
    if (dom.showVersionsBtn) {
        dom.showVersionsBtn.addEventListener('click', () => {
            try {
                showVersions();
            } catch (error) {
                handleError(error, '显示版本历史失败');
            }
        });
    }

    // 关闭版本历史按钮
    if (dom.closeVersionsBtn) {
        dom.closeVersionsBtn.addEventListener('click', () => {
            try {
                hideVersions();
            } catch (error) {
                handleError(error, '关闭版本历史失败');
            }
        });
    }

    // 导出笔记按钮
    if (dom.exportNoteBtn) {
        dom.exportNoteBtn.addEventListener('click', () => {
            try {
                showToast('导出功能即将实现', 'info');
            } catch (error) {
                handleError(error, '导出笔记失败');
            }
        });
    }

    // 云同步按钮
    if (dom.cloudSyncBtn) {
        dom.cloudSyncBtn.addEventListener('click', () => {
            try {
                showCloudSyncModal();
            } catch (error) {
                handleError(error, '打开云同步失败');
            }
        });
    }

    // 移动端云同步按钮
    if (dom.cloudSyncBtnMobile) {
        dom.cloudSyncBtnMobile.addEventListener('click', () => {
            try {
                showCloudSyncModal();
            } catch (error) {
                handleError(error, '打开云同步失败');
            }
        });
    }

    // 云同步关闭按钮
    if (dom.cloudSyncCloseBtn) {
        dom.cloudSyncCloseBtn.addEventListener('click', () => {
            try {
                hideCloudSyncModal();
            } catch (error) {
                handleError(error, '关闭云同步失败');
            }
        });
    }

    // 云同步上传按钮
    if (dom.cloudSyncPushBtn) {
        dom.cloudSyncPushBtn.addEventListener('click', () => {
            try {
                showToast('云同步上传功能即将实现', 'info');
            } catch (error) {
                handleError(error, '云同步上传失败');
            }
        });
    }

    // 云同步下载按钮
    if (dom.cloudSyncPullBtn) {
        dom.cloudSyncPullBtn.addEventListener('click', () => {
            try {
                showToast('云同步下载功能即将实现', 'info');
            } catch (error) {
                handleError(error, '云同步下载失败');
            }
        });
    }

    // 导入全部按钮
    if (dom.importAllBtn) {
        dom.importAllBtn.addEventListener('click', () => {
            try {
                showImportModal();
            } catch (error) {
                handleError(error, '打开导入功能失败');
            }
        });
    }

    // 导入模态框关闭按钮
    if (dom.importModalCloseBtn) {
        dom.importModalCloseBtn.addEventListener('click', () => {
            try {
                hideImportModal();
            } catch (error) {
                handleError(error, '关闭导入功能失败');
            }
        });
    }

    // 笔记标题输入框
    if (dom.noteTitleEl) {
        dom.noteTitleEl.addEventListener('input', async () => {
            try {
                await saveCurrentNote();
                // ✅ 【新增】标题修改后需要更新笔记列表显示
                renderNotesList();
            } catch (error) {
                handleError(error, '保存标题失败');
            }
        });
    }

    // 笔记内容输入框
    if (dom.noteEditorEl) {
        dom.noteEditorEl.addEventListener('input', async () => {
            try {
                await saveCurrentNote();
            } catch (error) {
                handleError(error, '保存内容失败');
            }
        });
    }

    // 移动端工具栏按钮
    if (dom.btnUndo) {
        dom.btnUndo.addEventListener('click', () => {
            try {
                const cmEditor = getCmEditor();
                if (cmEditor) {
                    cmEditor.undo();
                    showToast('撤销操作完成', 'success');
                } else {
                    showToast('当前不在编辑模式', 'warning');
                }
            } catch (error) {
                handleError(error, '撤销操作失败');
            }
        });
    }

    if (dom.btnRedo) {
        dom.btnRedo.addEventListener('click', () => {
            try {
                const cmEditor = getCmEditor();
                if (cmEditor) {
                    cmEditor.redo();
                    showToast('重做操作完成', 'success');
                } else {
                    showToast('当前不在编辑模式', 'warning');
                }
            } catch (error) {
                handleError(error, '重做操作失败');
            }
        });
    }

    if (dom.btnPreview) {
        dom.btnPreview.addEventListener('click', async () => {
            try {
                const contentArea = dom.contentArea;
                if (contentArea && contentArea.classList.contains('editing-mode')) {
                    // 切换到预览模式
                    await saveVersion();
                    enterPreviewMode();
                } else {
                    // 切换到编辑模式
                    enterEditMode();
                }
            } catch (error) {
                handleError(error, '预览操作失败');
            }
        });
    }

    // 笔记列表事件委托
    if (dom.notesListEl) {
        dom.notesListEl.addEventListener('click', async (e) => {
            try {
                const noteItem = e.target.closest('li[data-note-id]');
                const deleteBtn = e.target.closest('.note-delete-btn');

                // --- 处理删除逻辑 ---
                if (deleteBtn) {
                    e.stopPropagation(); // 阻止事件冒泡触发笔记切换
                    const noteIdToDelete = deleteBtn.closest('li[data-note-id]').dataset.noteId;
                    
                    if (confirm('确定要删除该笔记吗？此操作不可恢复！')) {
                        // ✅ 【Bug #5 & #4 修复】在所有操作之前，先检查并关闭版本历史面板
                        if (dom.versionsPanelEl.classList.contains('active')) {
                            hideVersions();
                        }

                        const nextNoteId = await deleteNote(noteIdToDelete);
                        
                        if (nextNoteId) {
                            // 如果还有其他笔记，切换到下一篇
                            await switchNote(nextNoteId);
                        } else {
                            // 如果没有笔记了，切换到欢迎场景
                            switchScene('welcome');
                            
                            // ✅ 【核心修复】在这里也填充欢迎页面的内容
                            if (dom.fullscreenWelcome) {
                                dom.fullscreenWelcome.innerHTML = `
                                    <div class="welcome-content">
                                        <div class="welcome-icon"><i class="fas fa-feather-alt"></i></div>
                                        <h1>开启你的创作之旅</h1>
                                        <p>点击任意位置，创建你的第一篇笔记</p>
                                    </div>
                                `;
                            }
                            
                            // 手动清空标题栏
                            dom.noteTitleEl.value = '';
                        }

                        // 最后统一重新渲染列表
                        renderNotesList(); 
                        showToast('笔记已删除', 'success');
                    }
                } 
                // --- 处理切换逻辑 ---
                else if (noteItem) {
                    const noteId = noteItem.dataset.noteId;
                    if (noteId !== getCurrentNoteId()) {
                        await switchNote(noteId);
                    }
                }

            } catch (error) {
                handleError(error, '笔记列表操作失败');
            }
        });
    }

    // 标签点击事件委托
    if (dom.tagsListEl) {
        dom.tagsListEl.addEventListener('click', (e) => {
            try {
                if (e.target.classList.contains('tag-item')) {
                    const tag = e.target.textContent;
                    const selectedTags = Array.from(dom.tagsListEl.querySelectorAll('.tag-item.selected'))
                        .map(el => el.textContent);
                    
                    if (e.target.classList.contains('selected')) {
                        // 取消选中
                        const newTags = selectedTags.filter(t => t !== tag);
                        setSelectedTags(newTags);
                    } else {
                        // 添加选中
                        const newTags = [...selectedTags, tag];
                        setSelectedTags(newTags);
                    }
                    
                    renderNotesList();
                }
            } catch (error) {
                handleError(error, '标签筛选失败');
            }
        });
    }

    // ✅ 【新增】版本历史面板的事件委托
    if (dom.versionsListEl) {
        dom.versionsListEl.addEventListener('click', async (e) => {
            const target = e.target;
            const actionTarget = target.closest('.version-restore, .version-delete, .version-diff');

            if (!actionTarget) return;

            const versionIndex = parseInt(actionTarget.dataset.index, 10);
            
            try {
                if (actionTarget.classList.contains('version-restore')) {
                    // 调用恢复版本的逻辑
                    await restoreVersion(versionIndex);
                } else if (actionTarget.classList.contains('version-delete')) {
                    // 调用删除版本的逻辑
                    await deleteVersion(versionIndex);
                } else if (actionTarget.classList.contains('version-diff')) {
                    // 调用显示差异的逻辑
                    showVersionDiff(versionIndex);
                }
            } catch (error) {
                handleError(error, '版本操作失败');
            }
        });
    }

    // 侧边栏展开/收起功能
    setupSidebarToggle();
    
    // ✅ 【新增】设置移动端侧边栏手势
    setupMobileDrawerGestures();
    
    // ✅ 【新增】设置标题栏滚动收起监听器
    setupHeaderScrollListener();
    
    // ✅ 【新增】应用键盘快捷键支持
    setupAppKeyboardShortcuts();
    
    // 迁移相关快捷键支持已移至 main.js
    
    // 业务模块初始化已移至 main.js
    
    console.log('✅ 事件监听器绑定完成');
}

/**
 * 设置侧边栏展开/收起功能
 */
function setupSidebarToggle() {
    // 移动端侧边栏提示
    const mobileDrawerHint = dom.mobileDrawerHint;
    const pcDrawerHint = dom.pcDrawerHint;
    const notesListPanel = dom.notesListPanel;
    const drawerMask = dom.drawerMask;
    
    // 移动端侧边栏切换
    if (mobileDrawerHint) {
        mobileDrawerHint.addEventListener('click', () => {
            toggleSidebar();
        });
    }
    
    // PC端侧边栏切换
    if (pcDrawerHint) {
        pcDrawerHint.addEventListener('click', () => {
            toggleSidebar();
        });
    }
    
    // 遮罩层点击关闭侧边栏
    if (drawerMask) {
        drawerMask.addEventListener('click', () => {
            if (notesListPanel && !notesListPanel.classList.contains('drawer-collapsed')) {
                toggleSidebar();
            }
        });
    }
    
    // ✅ 【优化】使用 ui.js 中的统一 toggleSidebar 函数
}

// ✅ 【优化】使用 ui.js 中的统一模态框操作函数

/**
 * 设置应用键盘快捷键
 */
function setupAppKeyboardShortcuts() {
    document.addEventListener('keydown', async (e) => {
        // Ctrl+S 手动保存版本
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            try {
                await saveVersion();
            } catch (error) {
                handleError(error, '快捷键保存失败');
            }
        }
        
        // Ctrl+N 新建笔记
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            try {
                const newNoteId = createNote();
                await switchNote(newNoteId);
                // switchNote 内部已经调用了 renderNotesList
                enterEditMode();
                showToast('新笔记创建成功', 'success');
            } catch (error) {
                handleError(error, '快捷键新建笔记失败');
            }
        }
        
        // 数据恢复与开发者工具快捷键
        // Ctrl+Shift+R 紧急恢复数据
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            try {
                const { emergencyDataRecovery } = await import('./data-migration-manager.js');
                await emergencyDataRecovery();
            } catch (error) {
                handleError(error, '紧急数据恢复失败');
            }
        }
        
        // Ctrl+Shift+D 查看存储状态
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            try {
                const { showStorageStatus } = await import('./data-migration-manager.js');
                await showStorageStatus();
            } catch (error) {
                handleError(error, '显示存储状态失败');
            }
        }
        
        // Ctrl+Shift+E 导出所有存储数据
        if (e.ctrlKey && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            try {
                const { exportAllStorageData } = await import('./data-migration-manager.js');
                await exportAllStorageData();
            } catch (error) {
                handleError(error, '导出存储数据失败');
            }
        }
        
        // Ctrl+Shift+H 显示数据健康报告
        if (e.ctrlKey && e.shiftKey && e.key === 'H') {
            e.preventDefault();
            try {
                const { showDataHealthReport } = await import('./data-migration-manager.js');
                await showDataHealthReport();
            } catch (error) {
                handleError(error, '显示健康报告失败');
            }
        }
    });
}

/**
 * @function setupHeaderScrollListener
 * @description 设置主内容面板的滚动监听，以在滚动时收起/展开笔记标题栏。
 */
function setupHeaderScrollListener() {
    const mainPanel = dom.mainPanel;
    const noteHeader = dom.noteHeader;

    if (!mainPanel || !noteHeader) return;

    mainPanel.addEventListener('scroll', () => {
        // 当向下滚动超过 60px 时，添加 shrink 类来收起标题
        if (mainPanel.scrollTop > 60) {
            noteHeader.classList.add('shrink');
        } else {
            noteHeader.classList.remove('shrink');
        }
    });
}

/**
 * @function setupMobileDrawerGestures
 * @description 为移动端设置完整的侧边栏触摸滑动（抽屉）功能，遵循CSS驱动动画的原则。
 */
function setupMobileDrawerGestures() {
    const sidebar = dom.notesListPanel;
    const mask = dom.drawerMask;
    if (!sidebar || !mask) return;

    // 状态变量
    let dragging = false, startX = 0, startY = 0, startTime = 0;
    let lastTranslate = 0, moved = false, directionLocked = false, isDrawerDrag = false;
    
    // 配置常量
    const DRAG_THRESHOLD = 20, DIRECTION_THRESHOLD = 15;
    const SWIPE_CONFIG = {
        SHOW: { VELOCITY_THRESHOLD: 0.2, DISTANCE_THRESHOLD: 30, POSITION_THRESHOLD: 0.3 },
        HIDE: { VELOCITY_THRESHOLD: 0.2, DISTANCE_THRESHOLD: 10, POSITION_THRESHOLD: 0.5 } // 提高关闭阈值到50%
    };

    function getSidebarWidth() { return sidebar.offsetWidth || 320; }

    // 触摸开始事件
    document.addEventListener('touchstart', (e) => {
        if (!isMobile() || e.touches.length !== 1 || e.target.closest('pre, code, .tags-list, .MathJax_Display')) return;
        
        dragging = true;
        startTime = Date.now();
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        moved = false;
        directionLocked = false;
        isDrawerDrag = false;
        const wasCollapsed = sidebar.classList.contains('drawer-collapsed');
        lastTranslate = wasCollapsed ? -getSidebarWidth() : 0;

        // 关键：添加 is-dragging 类来禁用 CSS transition
        sidebar.classList.add('is-dragging');

    }, { passive: true });

    // 触摸移动事件
    document.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        
        const moveX = e.touches[0].clientX;
        const deltaX = moveX - startX;
        
        if (!directionLocked) {
            const deltaY = e.touches[0].clientY - startY;
            if (Math.abs(deltaX) > DIRECTION_THRESHOLD || Math.abs(deltaY) > DIRECTION_THRESHOLD) {
                directionLocked = true;
                isDrawerDrag = Math.abs(deltaX) > Math.abs(deltaY);
            }
        }

        if (!isDrawerDrag) return;
        e.preventDefault();

        moved = true;
        let targetTranslate = Math.min(0, Math.max(-getSidebarWidth(), lastTranslate + deltaX));
        sidebar.style.transform = `translateX(${targetTranslate}px)`;
        
        const percent = 1 + (targetTranslate / getSidebarWidth());
        mask.style.opacity = Math.max(0, Math.min(1, percent)).toFixed(3);

    }, { passive: false });

    // 触摸结束事件
    document.addEventListener('touchend', (e) => {
        if (!dragging) return;
        
        dragging = false;

        // 关键：立即移除 is-dragging 类，为即将到来的动画做准备
        sidebar.classList.remove('is-dragging');

        if (moved && isDrawerDrag) {
            const endX = e.changedTouches[0].clientX;
            const deltaX = endX - startX;
            const deltaTime = Date.now() - startTime;
            
            const currentTransform = new DOMMatrix(getComputedStyle(sidebar).transform);
            const currentTranslate = currentTransform.m41;

            const sidebarWidth = getSidebarWidth();
            const currentPercent = Math.abs(currentTranslate) / sidebarWidth;
            const velocity = deltaTime > 0 ? Math.abs(deltaX) / deltaTime : 0;
            
            let shouldOpen = false;
            if (deltaX > 0) { // 向右滑
                const config = SWIPE_CONFIG.SHOW;
                shouldOpen = velocity > config.VELOCITY_THRESHOLD || currentPercent < (1 - config.POSITION_THRESHOLD);
            } else { // 向左滑
                const config = SWIPE_CONFIG.HIDE;
                shouldOpen = !(velocity > config.VELOCITY_THRESHOLD || currentPercent > config.POSITION_THRESHOLD);
            }

            // 决定最终状态并调用UI函数
            if (shouldOpen) {
                expandSidebar();
            } else {
                collapseSidebar();
            }

        } else {
            // 如果没有有效移动，也清理样式
            sidebar.style.transform = '';
        }
        
        // 重置状态
        isDrawerDrag = false;
        moved = false;

    }, { passive: true });

    // 点击遮罩层收回侧栏
    mask.addEventListener('click', () => {
        if (!isMobile()) return;
        collapseSidebar();
    });
}

/**
 * 设置自定义事件监听器
 * 统一管理所有业务逻辑事件
 */
export function setupCustomEventListeners() {
    console.log('🎧 设置自定义事件监听器...');
    
    // ========== UI更新事件 ==========
    
    // 监听预览内容更新事件
    document.addEventListener('previewContentUpdate', async (event) => {
        const { content } = event.detail;
        const { renderMarkdown } = await import('./ui.js');
        renderMarkdown(content);
        console.log('Events: 更新预览内容');
    });
    
    // 监听编辑模式进入事件
    document.addEventListener('editModeEntered', async () => {
        const { updateEditButton } = await import('./ui.js');
        updateEditButton(true);
        console.log('Events: 进入编辑模式');
    });
    
    // 监听预览模式进入事件
    document.addEventListener('previewModeEntered', async () => {
        const { updateEditButton } = await import('./ui.js');
        updateEditButton(false);
        console.log('Events: 进入预览模式');
    });
    
    // 监听字数统计更新事件
    document.addEventListener('wordCountUpdate', async () => {
        const { updateWordCount } = await import('./ui.js');
        updateWordCount();
        console.log('Events: 更新字数统计');
    });
    
    // 监听侧边栏收起事件
    document.addEventListener('sidebarCollapse', () => {
        collapseSidebar();
        console.log('Events: 收起侧边栏');
    });
    
    // 监听版本差异显示事件
    document.addEventListener('showVersionDiff', async (event) => {
        const { currentContent, previousContent, versionIndex } = event.detail;
        const { renderDiffPanel } = await import('./ui.js');
        renderDiffPanel(currentContent, previousContent, versionIndex);
        console.log('Events: 显示版本差异');
    });
    
    // ========== 业务逻辑事件 ==========
    
    // 监听笔记切换事件
    document.addEventListener('loadNote', async (event) => {
        const { noteId } = event.detail;
        const { switchNote } = await import('./note.js');
        await switchNote(noteId);
    });
    
    // 监听场景切换事件
    document.addEventListener('sceneChanged', async (event) => {
        const { scene } = event.detail;
        console.log('Events: 场景切换:', scene);
        
        // ✅ 【修复】调用UI函数来切换场景
        const { switchScene } = await import('./ui.js');
        switchScene(scene);
    });
    
    // 监听笔记切换完成事件
    document.addEventListener('noteSwitched', async (event) => {
        const { noteId } = event.detail;
        const { renderNotesList } = await import('./ui.js');
        renderNotesList();
        
        console.log('Events: 笔记切换完成');
    });
    
    // 监听版本保存成功事件
    document.addEventListener('versionSaved', async (event) => {
        const { noteId } = event.detail;
        const { renderNotesList } = await import('./ui.js');
        renderNotesList();
        console.log('Events: 版本保存成功');
    });
    
    // 监听UI初始化完成事件
    document.addEventListener('uiInitialized', () => {
        console.log('Events: UI初始化完成');
        // 这个事件目前不需要特殊处理，业务逻辑已在main.js中处理
    });
    
    console.log('✅ 自定义事件监听器设置完成');
}
