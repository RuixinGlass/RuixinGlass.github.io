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
        dom.noteTitleEl.addEventListener('input', () => {
            try {
                saveCurrentNote();
                // ✅ 【新增】标题修改后需要更新笔记列表显示
                renderNotesList();
            } catch (error) {
                handleError(error, '保存标题失败');
            }
        });
    }

    // 笔记内容输入框
    if (dom.noteEditorEl) {
        dom.noteEditorEl.addEventListener('input', () => {
            try {
                saveCurrentNote();
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

                        const nextNoteId = deleteNote(noteIdToDelete);
                        
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
 * @description 为移动端设置完整的侧边栏触摸滑动（抽屉）功能，恢复旧版高级逻辑。
 */
function setupMobileDrawerGestures() {
    const sidebar = dom.notesListPanel;
    const mask = dom.drawerMask;
    if (!sidebar || !mask) return;

    // 拖拽状态变量
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let lastTranslate = 0;
    let wasCollapsed = false;
    let moved = false;
    let directionLocked = false;
    let isDrawerDrag = false;
    let lastMoveTime = 0;
    let lastMoveX = 0;
    
    // 配置常量
    const DRAG_THRESHOLD = 20;           // 开始拖拽的阈值
    const DIRECTION_THRESHOLD = 15;      // 方向判定阈值 (px)
    
    // 分开设置的速度和距离阈值
    const SWIPE_CONFIG = {
        // 抽出侧栏（向右滑动）- 更容易触发
        SHOW: {
            VELOCITY_THRESHOLD: 0.2,    // 抽出速度阈值 (px/ms) - 较低，更容易抽出
            DISTANCE_THRESHOLD: 30,     // 抽出距离阈值 (px) - 较低
            POSITION_THRESHOLD: 0.3     // 位置阈值 (30%) - 较低，更容易保持打开
        },
        // 推回侧栏（向左滑动）- 避免误关闭
        HIDE: {
            VELOCITY_THRESHOLD: 0.2,   // 推回速度阈值 (px/ms) - 较高，避免误关闭
            DISTANCE_THRESHOLD: 10,     // 推回距离阈值 (px) - 较高
            POSITION_THRESHOLD: 0.4     // 位置阈值 (70%) - 较高，不容易意外关闭
        }
    };

    // 获取侧栏宽度
    function getSidebarWidth() {
        return sidebar.offsetWidth || 320;
    }

    // 设置侧栏位移
    function setSidebarTranslate(x) {
        sidebar.style.transition = 'none';
        sidebar.style.transform = `translateX(${x}px)`;
    }

    // 重置侧栏过渡效果
    function resetSidebarTransition() {
        sidebar.style.transition = '';
        sidebar.style.transform = '';
    }

    // 计算滑动速度
    function calculateVelocity(currentTime, currentX, lastTime, lastX) {
        const timeDelta = currentTime - lastTime;
        const distanceDelta = currentX - lastX;
        return timeDelta > 0 ? Math.abs(distanceDelta) / timeDelta : 0;
    }

    // 根据最终位置和速度决定抽屉状态
    function finalizeDrawerState(currentTranslate, deltaX, deltaTime) {
        const sidebarWidth = getSidebarWidth();
        const currentPercent = Math.abs(currentTranslate) / sidebarWidth;
        
        // 计算速度
        const velocity = deltaTime > 0 ? Math.abs(deltaX) / deltaTime : 0;
        
        // 判断滑动方向并使用对应的阈值
        if (deltaX > 0) {
            // 向右滑动 - 抽出侧栏
            const config = SWIPE_CONFIG.SHOW;
            const isSwipeRight = deltaX > config.DISTANCE_THRESHOLD && velocity > config.VELOCITY_THRESHOLD;
            
            if (isSwipeRight) {
                expandSidebar();
                return;
            }
            
            // 根据位置判断，使用抽出的位置阈值
            if (currentPercent < config.POSITION_THRESHOLD) {
                expandSidebar();
            } else {
                collapseSidebar();
            }
        } else {
            // 向左滑动 - 推回侧栏
            const config = SWIPE_CONFIG.HIDE;
            const isSwipeLeft = deltaX < -config.DISTANCE_THRESHOLD && velocity > config.VELOCITY_THRESHOLD;
            
            if (isSwipeLeft) {
                collapseSidebar();
                return;
            }
            
            // 根据位置判断，使用推回的位置阈值
            if (currentPercent > config.POSITION_THRESHOLD) {
                collapseSidebar();
            } else {
                expandSidebar();
            }
        }
    }

    // 触摸开始事件
    document.addEventListener('touchstart', (e) => {
        if (!isMobile()) return;
        if (e.touches.length !== 1) return;
        
        const target = e.target;
        if (
            target.closest('pre') ||
            target.closest('code') ||
            target.closest('.tags-list') ||
            target.closest('.MathJax_Display')
        ) {
            e._isContentScroll = true;
            return;
        }
        
        dragging = true;
        startTime = Date.now();
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        moved = false;
        directionLocked = false;
        isDrawerDrag = false;
        wasCollapsed = sidebar.classList.contains('drawer-collapsed');
        lastTranslate = wasCollapsed ? -getSidebarWidth() : 0;
        sidebar.style.willChange = 'transform';
        lastMoveTime = startTime;
        lastMoveX = startX;
    }, { passive: true });

    // 触摸移动事件
    document.addEventListener('touchmove', (e) => {
        if (e._isContentScroll) return;
        if (!dragging || !isMobile()) return;
        
        const moveX = e.touches[0].clientX;
        const moveY = e.touches[0].clientY;
        const deltaX = moveX - startX;
        const deltaY = moveY - startY;

        // 方向锁定判断 - 只有水平滑动距离大于垂直滑动距离时才认为是抽屉拖拽
        if (!directionLocked) {
            if (Math.abs(deltaX) > DIRECTION_THRESHOLD || Math.abs(deltaY) > DIRECTION_THRESHOLD) {
                directionLocked = true;
                // 关键逻辑：只有当水平距离明显大于垂直距离时才判定为抽屉拖拽
                isDrawerDrag = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > DIRECTION_THRESHOLD;
            }
        }
        
        // 如果不是水平滑动，让页面正常滚动
        if (!isDrawerDrag) return;

        // 达到拖拽阈值后开始移动
        if (!moved && Math.abs(deltaX) > DRAG_THRESHOLD) {
            moved = true;
        }
        
        if (moved) {
            let targetTranslate = lastTranslate + deltaX;
            const sidebarWidth = getSidebarWidth();
            // 限制移动范围
            targetTranslate = Math.min(0, Math.max(-sidebarWidth, targetTranslate));
            setSidebarTranslate(targetTranslate);
            
            // 更新遮罩层透明度
            const percent = 1 + (targetTranslate / sidebarWidth); // 0~1
            mask.style.opacity = Math.max(0, Math.min(1, percent)).toFixed(3);
            
            // 阻止默认行为
            e.preventDefault();
        }
    }, { passive: false });

    // 触摸结束事件
    document.addEventListener('touchend', (e) => {
        if (!dragging || !isMobile()) return;
        
        dragging = false;
        sidebar.style.willChange = '';
        
        if (moved && isDrawerDrag) {
            const endX = e.changedTouches[0].clientX;
            const endTime = Date.now();
            const deltaX = endX - startX;
            const deltaTime = endTime - startTime;
            
            // 获取当前位置
            const currentTransform = sidebar.style.transform;
            const currentTranslate = currentTransform 
                ? parseFloat((currentTransform.match(/translateX\(([^)]+)px\)/) || [])[1] || 0)
                : (wasCollapsed ? -getSidebarWidth() : 0);
            
            // 使用改进的判断逻辑
            finalizeDrawerState(currentTranslate, deltaX, deltaTime);
        } else {
            // 没有移动，恢复原状态
            resetSidebarTransition();
        }
    }, { passive: true });

    // 处理触摸取消事件
    document.addEventListener('touchcancel', (e) => {
        if (!dragging || !isMobile()) return;
        
        dragging = false;
        sidebar.style.willChange = '';
        resetSidebarTransition();
    }, { passive: true });

    // 点击遮罩层收回侧栏
    mask.addEventListener('click', (e) => {
        if (!isMobile()) return;
        collapseSidebar();
    });
    
    // 防止遮罩层的触摸事件与拖拽冲突
    mask.addEventListener('touchstart', (e) => {
        if (!isMobile()) return;
        // 如果正在拖拽，不处理点击
        if (dragging) {
            e.preventDefault();
        }
    }, { passive: false });
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
        switchNote(noteId);
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
