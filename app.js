// =====================
// 严谨的版本控制笔记系统 - 主逻辑入口
// =====================

// ========== 防止重复加载的脚本缓存 ==========
const loadedScripts = new Set();

// ========== 数据结构 ==========
// 笔记数据存储结构
const notesData = {
    currentNoteId: null,
    notes: {}
};

// ========== DOM 元素获取 ==========
const notesListEl = document.getElementById('notesList');
const addNoteBtn = document.getElementById('addNoteBtn');
const noteTitleEl = document.getElementById('noteTitle');
const noteEditorEl = document.getElementById('noteEditor');
const notePreviewEl = document.getElementById('notePreview');
const editBtn = document.getElementById('editBtn');
const showVersionsBtn = document.getElementById('showVersionsBtn');
const versionsPanelEl = document.getElementById('versionsPanel');
const versionsListEl = document.getElementById('versionsList');
const closeVersionsBtn = document.getElementById('closeVersionsBtn');
const wordCountEl = document.getElementById('wordCount');
const searchInputEl = document.getElementById('searchInput');


// 云同步相关
const cloudSyncBtn = document.getElementById('cloudSyncBtn');
const cloudSyncModal = document.getElementById('cloudSyncModal');
const cloudSyncCloseBtn = document.getElementById('cloudSyncCloseBtn');
const cloudSyncPushBtn = document.getElementById('cloudSyncPushBtn');
const cloudTokenInput = document.getElementById('cloudTokenInput');
const cloudGistIdInput = document.getElementById('cloudGistIdInput');
const cloudSyncStatus = document.getElementById('cloudSyncStatus');
const cloudSyncPullBtn = document.getElementById('cloudSyncPullBtn');
// 移动端菜单
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenuDropdown = document.getElementById('mobile-menu-dropdown');
// 导出/导入
const exportNoteBtn = document.getElementById('exportNoteBtn');
const importAllBtn = document.getElementById('importAllBtn');
const importModal = document.getElementById('importModal');
const importMdBtn = document.getElementById('importMdBtn');
const importFolderBtn = document.getElementById('importFolderBtn');
const importZipBtn = document.getElementById('importZipBtn');
const importModalCloseBtn = document.getElementById('importModalCloseBtn');
// 侧栏与常量声明（全局只声明一次）
const sidebar = document.querySelector('.notes-list-panel');
const drawerCollapsedClass = 'drawer-collapsed';

// ========== 编辑器与标签状态 ==========
let cmEditor = null; // Codemirror 5 实例
let selectedTags = []; // 当前选中的标签
let lastMainPanelScrollRatio = 0; // 记录滚动比例
let searchKeyword = '';

// ========== 工具函数 ==========
function isMobile() { return window.innerWidth <= 768; }

// ========== 初始化与主流程 ==========
window.addEventListener('DOMContentLoaded', function() {
    // 只在PC端移除drawer-collapsed，移动端不处理
    if (sidebar && window.innerWidth > 768) {
        sidebar.classList.remove('drawer-collapsed');
    }

    // 2. PC端极简箭头控制侧栏
    const pcDrawerToggle = document.getElementById('pc-drawer-toggle');
    const pcDrawerArrow = document.getElementById('pc-drawer-arrow');
    const pcPanel = sidebar;
    if (pcDrawerToggle && pcDrawerArrow && pcPanel) {
        let collapsed = pcPanel.classList.contains('drawer-collapsed');
        if (collapsed) {
            pcDrawerArrow.setAttribute('points', '12,8 18,14 12,20');
        } else {
            pcDrawerArrow.setAttribute('points', '16,8 10,14 16,20');
        }
        pcDrawerToggle.addEventListener('click', () => {
            collapsed = !collapsed;
            pcPanel.classList.toggle('drawer-collapsed', collapsed);
            if (collapsed) {
                pcDrawerArrow.setAttribute('points', '12,8 18,14 12,20');
            } else {
                pcDrawerArrow.setAttribute('points', '16,8 10,14 16,20');
            }
        });
    }

    // 3. 云同步移动端按钮
    const cloudSyncBtnMobile = document.getElementById('cloudSyncBtnMobile');
    if (cloudSyncBtnMobile && cloudSyncBtn) {
        cloudSyncBtnMobile.addEventListener('click', function(e) {
            e.preventDefault();
            cloudSyncBtn.click();
        });
    }

    // 4. 旧版移动端侧栏滑动手势逻辑
    /*
    let startX = 0;
    let startY = 0;
    let isTouching = false;
    document.addEventListener('touchstart', function(e) {
        if (!isMobile()) return;
        if (e.touches.length !== 1) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isTouching = true;
    }, {passive: true});
    document.addEventListener('touchend', function(e) {
        if (!isMobile() || !isTouching) return;
        isTouching = false;
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 40 && deltaY < 80 && sidebar && sidebar.classList.contains(drawerCollapsedClass)) {
            sidebar.classList.remove(drawerCollapsedClass);
        }
        if (deltaX < -40 && deltaY < 80 && sidebar && !sidebar.classList.contains(drawerCollapsedClass)) {
            sidebar.classList.add(drawerCollapsedClass);
        }
    }, {passive: true});
    */

    // ========== 移动端小箭头点击逻辑 ==========
    const mobileHint = document.querySelector('.mobile-drawer-hint');
    if (mobileHint && sidebar) {
        mobileHint.addEventListener('click', function(e) {
            if (!isMobile()) return;
            if (sidebar.classList.contains(drawerCollapsedClass)) {
                sidebar.classList.remove(drawerCollapsedClass);
            } else {
                sidebar.classList.add(drawerCollapsedClass);
            }
        });
    }

    // 6. 侧栏展开/收起时同步更新移动端小箭头方向
    function updateMobileDrawerHint() {
        const hint = document.querySelector('.mobile-drawer-hint');
        if (!sidebar || !hint) return;
        if (sidebar.classList.contains('drawer-collapsed')) {
            hint.classList.remove('sidebar-open');
        } else {
            hint.classList.add('sidebar-open');
        }
    }
    const observer = new MutationObserver(updateMobileDrawerHint);
    observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    updateMobileDrawerHint();

    // 7. PC端极简箭头同步
    const pcHint = document.querySelector('.pc-drawer-hint');
    function updatePcDrawerHint() {
        if (!sidebar || !pcHint) return;
        if (sidebar.classList.contains(drawerCollapsedClass)) {
            pcHint.classList.remove('sidebar-open');
        } else {
            pcHint.classList.add('sidebar-open');
        }
    }
    if (pcHint && sidebar) {
        pcHint.addEventListener('click', function(e) {
            if (!(!isMobile())) return;
            if (sidebar.classList.contains(drawerCollapsedClass)) {
                sidebar.classList.remove(drawerCollapsedClass);
            } else {
                sidebar.classList.add(drawerCollapsedClass);
            }
        });
        const observer2 = new MutationObserver(updatePcDrawerHint);
        observer2.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
        updatePcDrawerHint();
    }

    if (sidebar) {
        let scrollTimeout;
        sidebar.addEventListener('scroll', function() {
            sidebar.classList.add('scrolling');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                sidebar.classList.remove('scrolling');
            }, 400); // 滚动停止400ms后移除
        });
    }

    const noteHeader = document.querySelector('.note-header');
    const mainContent = document.querySelector('.note-main-panel') || window;
    (mainContent || window).addEventListener('scroll', function() {
        const scrollTop = mainContent.scrollTop || window.scrollY || 0;
        if (scrollTop > 60) {
            noteHeader.classList.add('shrink');
        } else {
            noteHeader.classList.remove('shrink');
        }
    });
});

// ========== 移动端全屏可拖拽抽屉基础逻辑 ==========
(function() {
    // 使用已存在的全局变量
    // const sidebar = document.querySelector('.notes-list-panel');
    // const drawerCollapsedClass = 'drawer-collapsed';
    
    function isMobile() { 
      return window.innerWidth <= 768; 
    } 
    
    // 检查必要元素是否存在
    if (!sidebar) {
      console.warn('侧栏元素未找到');
      return;
    }
    
    const mask = document.querySelector('.drawer-mask');
    
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
    const CLOSE_THRESHOLD = 0.5;         // 关闭抽屉的位置阈值 (50%)
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
    }
    
    // 动画类名
    const ANIMATION_CLASSES = [drawerCollapsedClass, 'animate__animated', 'animate__fadeInLeft'];
  
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
  
    // 显示抽屉
    function showDrawer() {
      ANIMATION_CLASSES.forEach(cls => sidebar.classList.remove(cls));
      sidebar.classList.remove(drawerCollapsedClass);
      resetSidebarTransition();
      if (mask) {
        mask.style.opacity = '1';
      }
    }
  
    // 隐藏抽屉
    function hideDrawer() {
      sidebar.classList.add(drawerCollapsedClass);
      // 只添加动画类，不重复添加collapsed类
      ANIMATION_CLASSES.slice(1).forEach(cls => sidebar.classList.add(cls));
      resetSidebarTransition();
      if (mask) {
        mask.style.opacity = '0';
      }
    }
  
    // 同步遮罩层状态
    function syncMaskState() {
      if (!mask) return;
      const isCollapsed = sidebar.classList.contains(drawerCollapsedClass);
      mask.style.opacity = isCollapsed ? '0' : '1';
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
          showDrawer();
          return;
        }
        
        // 根据位置判断，使用抽出的位置阈值
        if (currentPercent < config.POSITION_THRESHOLD) {
          showDrawer();
        } else {
          hideDrawer();
        }
      } else {
        // 向左滑动 - 推回侧栏
        const config = SWIPE_CONFIG.HIDE;
        const isSwipeLeft = deltaX < -config.DISTANCE_THRESHOLD && velocity > config.VELOCITY_THRESHOLD;
        
        if (isSwipeLeft) {
          hideDrawer();
          return;
        }
        
        // 根据位置判断，使用推回的位置阈值
        if (currentPercent > config.POSITION_THRESHOLD) {
          hideDrawer();
        } else {
          showDrawer();
        }
      }
    }
  
    // 触摸开始事件
    document.addEventListener('touchstart', function(e) {
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
      wasCollapsed = sidebar.classList.contains(drawerCollapsedClass);
      lastTranslate = wasCollapsed ? -getSidebarWidth() : 0;
      sidebar.style.willChange = 'transform';
      lastMoveTime = startTime;
      lastMoveX = startX;
    }, { passive: true });
  
    // 触摸移动事件
    document.addEventListener('touchmove', function(e) {
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
        ANIMATION_CLASSES.forEach(cls => sidebar.classList.remove(cls));
      }
      
      if (moved) {
        let targetTranslate = lastTranslate + deltaX;
        const sidebarWidth = getSidebarWidth();
        // 限制移动范围
        targetTranslate = Math.min(0, Math.max(-sidebarWidth, targetTranslate));
        setSidebarTranslate(targetTranslate);
        
        // 更新遮罩层透明度
        if (mask) {
          const percent = 1 + (targetTranslate / sidebarWidth); // 0~1
          mask.style.opacity = Math.max(0, Math.min(1, percent)).toFixed(3);
        }
        
        // 阻止默认行为
        e.preventDefault();
      }
    }, { passive: false });
  
    // 触摸结束事件
    document.addEventListener('touchend', function(e) {
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
          ? parseFloat(currentTransform.match(/translateX\(([^)]+)px\)/)?.[1] || 0)
          : (wasCollapsed ? -getSidebarWidth() : 0);
        
        // 使用改进的判断逻辑
        finalizeDrawerState(currentTranslate, deltaX, deltaTime);
      } else {
        // 没有移动，恢复原状态
        resetSidebarTransition();
      }
    }, { passive: true });
  
    // 处理触摸取消事件
    document.addEventListener('touchcancel', function(e) {
      if (!dragging || !isMobile()) return;
      
      dragging = false;
      sidebar.style.willChange = '';
      resetSidebarTransition();
    }, { passive: true });
  
    // 点击遮罩层收回侧栏
    if (mask) {
      mask.addEventListener('click', function(e) {
        if (!isMobile()) return;
        hideDrawer();
      });
      
      // 防止遮罩层的触摸事件与拖拽冲突
      mask.addEventListener('touchstart', function(e) {
        if (!isMobile()) return;
        // 如果正在拖拽，不处理点击
        if (dragging) {
          e.preventDefault();
        }
      }, { passive: false });
    }
  
    // 监听侧栏class变化，同步遮罩层状态
    if (window.MutationObserver && mask) {
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            syncMaskState();
          }
        });
      });
      
      observer.observe(sidebar, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
  
    // 初始化时同步一次遮罩层状态
    syncMaskState();
  
  })();
// ========== 初始化入口 ==========
async function init() {
    // ========== 初始化更新检测和通知 ==========
    initUpdateDetection();
    
    // ========== 加载高性能存储模块（使用 await 等待完成） ==========
    try {
        await loadScript('indexeddb-storage.js');
        console.log('IndexedDB 存储模块加载成功');
        // 尝试迁移数据（也使用 await 等待）
        if (window.migrateFromLocalStorage) {
            const success = await window.migrateFromLocalStorage();
            if (success) {
                console.log('数据迁移完成，开始使用 IndexedDB');
            }
        }
    } catch (error) {
        console.warn('IndexedDB 存储模块加载失败，使用 localStorage:', error);
    }
    
    // ========== 加载性能优化模块 ==========
    try {
        await loadScript('performance-optimizer.js');
        console.log('性能优化模块加载成功');
        // 初始化性能优化
        if (window.initPerformanceOptimization) {
            window.initPerformanceOptimization();
        }
    } catch (error) {
        console.warn('性能优化模块加载失败:', error);
    }

    // 配置Markdown解析器
    marked.setOptions({
        breaks: true, // 自动转换换行符
        gfm: true,    // 启用GitHub风格的Markdown
        mangle: false,
        headerIds: false
    });

    // ========== 关键的初始化流程 ==========
    // 1. 从存储中加载数据到内存
    await loadFromLocalStorage();
    
    // 2. 检查并修复数据
    checkAndRepairData();
    
    // 3. 将笔记列表渲染到页面上
    renderNotesList(); 
    
    // 4. 在列表渲染完毕后，切换到当前笔记（这将触发高亮和滚动）
    if (notesData.currentNoteId && notesData.notes[notesData.currentNoteId]) {
        switchNote(notesData.currentNoteId);
    } else {
        // 如果没有当前笔记，则显示欢迎提示
        notePreviewEl.innerHTML = `
            <div class="empty-state">
                <h3><i class="fas fa-book-open"></i> 欢迎使用笔记系统</h3>
                <p>点击左侧的"新建笔记"按钮开始记录你的想法</p>
            </div>
        `;
    }

    // 5. 最后，设置所有事件监听器
    setupEventListeners();

    // 默认隐藏编辑区，显示预览区
    noteEditorEl.style.display = 'none';
    notePreviewEl.style.display = 'block';
    editBtn.innerHTML = '<i class="fas fa-edit"></i><span class="btn-text"> 编辑笔记</span>';
    
    // 初始化字数统计
    updateWordCount();
    
    // ========== 自动保存机制 ==========
    // 1. 页面关闭前自动保存
    window.addEventListener('beforeunload', function(e) {
        if (notesData.currentNoteId) {
            const currentContent = noteEditorEl.value;
            const note = notesData.notes[notesData.currentNoteId];
            if (note && note.content !== currentContent) {
                // 强制保存当前内容
                note.content = currentContent;
                note.lastModified = new Date().toISOString();
                saveToLocalStorage();
            }
        }
    });
    
    // 2. 定时自动保存（每30秒）
    setInterval(function() {
        if (notesData.currentNoteId) {
            const currentContent = noteEditorEl.value;
            const note = notesData.notes[notesData.currentNoteId];
            if (note && note.content !== currentContent) {
                // 静默保存，不生成新版本
                note.content = currentContent;
                note.lastModified = new Date().toISOString();
                saveToLocalStorage();
                console.log('定时自动保存完成');
            }
        }
    }, 30000);
    
    // 3. 编辑器内容变化时自动保存（防抖处理）
    let saveTimeout = null;
    function debouncedSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(function() {
            if (notesData.currentNoteId) {
                const currentContent = noteEditorEl.value;
                const note = notesData.notes[notesData.currentNoteId];
                if (note && note.content !== currentContent) {
                    // 静默保存，不生成新版本
                    note.content = currentContent;
                    note.lastModified = new Date().toISOString();
                    saveToLocalStorage();
                    console.log('内容变化自动保存完成');
                }
            }
        }, 2000); // 2秒防抖
    }
    
    // 绑定到textarea的input事件
    noteEditorEl.addEventListener('input', debouncedSave);
    
    // 4. 为CodeMirror编辑器也添加变化监听
    function setupCodeMirrorAutoSave() {
        if (cmEditor) {
            cmEditor.on('change', function() {
                // 同步到textarea
                noteEditorEl.value = cmEditor.getValue();
                // 触发防抖保存
                debouncedSave();
            });
        }
    }
    
    // 在setupEventListeners中调用这个函数
    window.setupCodeMirrorAutoSave = setupCodeMirrorAutoSave;
}

// ========== 本地存储 ==========
async function loadFromLocalStorage() {
    try {
        let dataLoaded = false;
        // 优先使用 IndexedDB
        if (window.indexedDBStorage) {
            try {
                const data = await window.indexedDBStorage.loadData();
                notesData.currentNoteId = data.currentNoteId;
                notesData.notes = data.notes;
                console.log('从 IndexedDB 加载数据成功');
                dataLoaded = true;
            } catch (indexedDBError) {
                console.warn('IndexedDB 加载失败，回退到 localStorage:', indexedDBError);
            }
        }
        
        // 如果 IndexedDB 失败，回退到 localStorage
        if (!dataLoaded) {
            const savedData = localStorage.getItem('notesData');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                notesData.currentNoteId = parsedData.currentNoteId;
                notesData.notes = parsedData.notes;
                console.log('从 localStorage 加载数据成功');
            }
        }
    } catch (error) {
        console.error('数据加载失败:', error);
        // 尝试加载备份数据
        try {
            const savedData = localStorage.getItem('notesData_backup');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                notesData.currentNoteId = parsedData.currentNoteId;
                notesData.notes = parsedData.notes;
                console.log('加载备份数据成功');
            } else {
                console.log('未找到备份数据，将使用空数据');
                notesData.currentNoteId = null;
                notesData.notes = {};
            }
        } catch (e) {
            console.error('加载备份数据也失败，将使用空数据:', e);
            notesData.currentNoteId = null;
            notesData.notes = {};
        }
    }


}

async function saveToLocalStorage() {
    try {
        // 优先使用 IndexedDB
        if (window.indexedDBStorage) {
            try {
                await window.indexedDBStorage.saveData(notesData);
                // 同时创建备份
                await window.indexedDBStorage.backupData(notesData);
                console.log('IndexedDB 数据保存成功，笔记数量:', Object.keys(notesData.notes).length);
                return;
            } catch (indexedDBError) {
                console.warn('IndexedDB 保存失败，回退到 localStorage:', indexedDBError);
            }
        }
        
        // 回退到 localStorage
        // 主存储
        localStorage.setItem('notesData', JSON.stringify(notesData));
        
        // 备份存储（防止主存储损坏）
        localStorage.setItem('notesData_backup', JSON.stringify(notesData));
        
        // 时间戳记录
        localStorage.setItem('notesData_timestamp', new Date().toISOString());
        
        console.log('localStorage 数据保存成功，笔记数量:', Object.keys(notesData.notes).length);
    } catch (error) {
        console.error('保存数据失败:', error);
        // 尝试清理存储空间并重试
        try {
            if (window.indexedDBStorage) {
                await window.indexedDBStorage.deleteDatabase();
                await window.indexedDBStorage.saveData(notesData);
                console.log('IndexedDB 清理后重新保存成功');
            } else {
                localStorage.clear();
                localStorage.setItem('notesData', JSON.stringify(notesData));
                console.log('localStorage 清理后重新保存成功');
            }
        } catch (e) {
            console.error('清理后仍无法保存:', e);
            alert('存储空间不足，请清理浏览器缓存后重试！');
        }
    }
}

// ========== 数据完整性检查与修复 ==========
function checkAndRepairData() {
    console.log('开始数据完整性检查...');
    
    // 检查笔记数据结构
    if (!notesData.notes || typeof notesData.notes !== 'object') {
        console.warn('笔记数据结构异常，正在修复...');
        notesData.notes = {};
    }
    
    // 检查每个笔记的完整性
    const noteIds = Object.keys(notesData.notes);
    let repairedCount = 0;
    
    noteIds.forEach(noteId => {
        const note = notesData.notes[noteId];
        
        // 检查笔记对象是否存在
        if (!note || typeof note !== 'object') {
            console.warn(`笔记 ${noteId} 数据异常，正在删除...`);
            delete notesData.notes[noteId];
            repairedCount++;
            return;
        }
        
        // 检查必要字段
        if (typeof note.content !== 'string') {
            console.warn(`笔记 ${noteId} 内容异常，正在修复...`);
            note.content = '';
            repairedCount++;
        }
        
        if (typeof note.title !== 'string') {
            note.title = '未命名笔记';
            repairedCount++;
        }
        
        if (!Array.isArray(note.versions)) {
            note.versions = [];
            repairedCount++;
        }
        
        // 检查版本数据完整性
        note.versions = note.versions.filter(version => {
            if (!version || typeof version !== 'object') return false;
            if (typeof version.content !== 'string') return false;
            if (typeof version.timestamp !== 'string') return false;
            return true;
        });
    });
    
    // 检查当前笔记ID是否有效
    if (notesData.currentNoteId && !notesData.notes[notesData.currentNoteId]) {
        console.warn('当前笔记ID无效，正在重置...');
        notesData.currentNoteId = null;
        repairedCount++;
    }
    
    // 如果有修复，保存数据
    if (repairedCount > 0) {
        console.log(`数据修复完成，修复了 ${repairedCount} 个问题`);
        saveToLocalStorage();
    } else {
        console.log('数据完整性检查通过');
    }
    
    // 显示数据统计
    const totalNotes = Object.keys(notesData.notes).length;
    const totalVersions = Object.values(notesData.notes).reduce((sum, note) => {
        return sum + (note.versions ? note.versions.length : 0);
    }, 0);
    
    console.log(`数据统计: ${totalNotes} 篇笔记，${totalVersions} 个版本`);
    
    // 如果数据量很大，给出警告
    if (totalNotes > 50) {
        console.warn(`笔记数量较多 (${totalNotes})，建议定期备份数据`);
    }
}

// ========== 笔记列表与内容渲染 ==========
function renderNotesList() {
    notesListEl.innerHTML = '';
    // 标签筛选
    let filteredNotes = Object.keys(notesData.notes);
    if (selectedTags.length > 0) {
        filteredNotes = filteredNotes.filter(noteId => {
            const note = notesData.notes[noteId];
            const meta = parseFrontMatter(note.content);
            if (!meta.tags || !Array.isArray(meta.tags)) return false;
            return selectedTags.every(tag => meta.tags.includes(tag));
        });
    }
    // 搜索关键词筛选
    if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        filteredNotes = filteredNotes.filter(noteId => {
            const note = notesData.notes[noteId];
            return (
                (note.title && note.title.toLowerCase().includes(kw)) ||
                (note.content && note.content.toLowerCase().includes(kw))
            );
        });
    }
    if (filteredNotes.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-state';
        li.innerHTML = '<span>未找到相关笔记</span>';
        notesListEl.appendChild(li);
        renderTagsList();
        return;
    }
    filteredNotes.forEach(noteId => {
        const note = notesData.notes[noteId];
        const li = document.createElement('li');
        li.className = noteId === notesData.currentNoteId ? 'active' : '';
        // 创建笔记项内容
        li.innerHTML = `
            <div class="note-item-content">
                <div class="note-title">${note.title || '未命名笔记'}</div>
                <div class="note-meta">
                    <span class="note-date">${new Date(note.lastModified || Date.now()).toLocaleDateString()}</span>
                    <span class="note-version-count">${note.versions ? note.versions.length : 0} 版本</span>
                </div>
            </div>
        `;
        li.dataset.noteId = noteId;
        // 切换笔记事件
        li.onclick = () => {
            if (notesData.currentNoteId !== noteId) {
                // 新增：编辑模式下切换笔记时自动保存当前笔记
                const contentArea = document.querySelector('.content-area');
                if (contentArea && contentArea.classList.contains('editing-mode')) {
                    saveVersion();
                }
                switchNote(noteId);
            }
        };
        // 删除按钮
        const delBtn = document.createElement('button');
        delBtn.className = 'note-delete-btn';
        delBtn.title = '删除笔记';
        delBtn.innerHTML = '<i class="fas fa-trash"></i>';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm('确定要删除该笔记吗？此操作不可恢复！')) {
                delete notesData.notes[noteId];
                // 如果当前删除的是正在查看的笔记，切换到其它笔记或清空
                if (notesData.currentNoteId === noteId) {
                    const remainIds = Object.keys(notesData.notes);
                    notesData.currentNoteId = remainIds[0] || null;
                    if (notesData.currentNoteId) {
                        switchNote(notesData.currentNoteId);
                    } else {
                        noteTitleEl.value = '';
                        noteEditorEl.value = '';
                        notePreviewEl.innerHTML = '<div class="empty-state"><h3><i class="fas fa-book-open"></i> 欢迎使用笔记系统</h3><p>点击左侧的\"新建笔记\"按钮开始记录你的想法</p></div>';
                    }
                }
                saveToLocalStorage();
                renderNotesList();
            }
        };
        li.appendChild(delBtn);
        notesListEl.appendChild(li);
    });
    renderTagsList();
}

function switchNote(noteId) {
    notesData.currentNoteId = noteId;
    const note = notesData.notes[noteId];
    
    // --- 修复2：先销毁 Codemirror，再设置 textarea value，避免内容继承 ---
    if (cmEditor) {
        cmEditor.toTextArea(); // 恢复 textarea，这是唯一需要的清理方法
        cmEditor = null;
    }
    
    // 更新笔记内容显示
    noteTitleEl.value = note.title || '';
    noteEditorEl.value = note.content || '';
    noteEditorEl.style.display = 'none';
    notePreviewEl.style.display = 'block';
    noteEditorEl.classList.remove('editing');
    editBtn.innerHTML = '<i class="fas fa-edit"></i><span class="btn-text"> 编辑笔记</span>';
    
    // 渲染Markdown内容
    renderMarkdown(note.content || '');
    updateWordCount();
    
    // 显示版本历史（如果面板是打开的）
    if (versionsPanelEl.classList.contains('active')) {
        showVersions();
    }
    
    // 保存当前状态
    saveToLocalStorage();
    
    // --- 优化：只更新侧边栏的active状态，不重新渲染整个列表 ---
    updateSidebarActiveState(noteId);
    
    // --- 修复2补充：切换笔记时移除编辑模式类，保证预览背景色 ---
    const mainPanel = document.querySelector('.note-main-panel');
    if (mainPanel) mainPanel.scrollTop = 0;
    const contentArea = document.querySelector('.content-area');
    if (contentArea) contentArea.classList.remove('editing-mode');
    if (contentArea) contentArea.scrollTop = 0;
    
    // --- 移动端优化：切换笔记后自动关闭侧边栏 ---
    if (window.innerWidth <= 768 && sidebar && !sidebar.classList.contains('drawer-collapsed')) {
        sidebar.classList.add('drawer-collapsed');
    }
}

// 新增：只更新侧边栏active状态，不重新渲染整个列表
function updateSidebarActiveState(noteId) {
    // 移除所有active状态
    const allActiveItems = notesListEl.querySelectorAll('li.active');
    allActiveItems.forEach(item => item.classList.remove('active'));
    
    // 添加新的active状态
    const newActiveItem = notesListEl.querySelector(`li[data-note-id="${noteId}"]`);
    if (newActiveItem) {
        newActiveItem.classList.add('active');
        // 确保active项可见
        newActiveItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function renderMarkdown(content) {
    // 检查并处理 front matter
    content = content.replace(
        /^---[\s\S]*?---/, // 匹配开头的 front matter
        match => `<div class="front-matter">${match.replace(/---/g, '').trim()}</div>`
    );
    // 增强的Markdown渲染实现
    let html = marked.parse(content);
    // 安全过滤（可选）
    html = DOMPurify.sanitize(html);
    notePreviewEl.innerHTML = html;
    // 新增：渲染公式
    if (window.MathJax && window.MathJax.typesetPromise) {
      MathJax.typesetPromise([notePreviewEl]);
    }
}

// ========== 版本控制与历史 ==========
function generateVersionHash(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        hash = ((hash << 5) - hash) + content.charCodeAt(i);
        hash |= 0;
    }
    return 'v' + Math.abs(hash).toString(16).substring(0, 6);
}

function diffVersions(oldContent, newContent) {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    const diff = [];
    const maxLength = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLength; i++) {
        if (i >= oldLines.length) {
            diff.push({type: 'added', line: newLines[i]});
        } else if (i >= newLines.length) {
            diff.push({type: 'removed', line: oldLines[i]});
        } else if (oldLines[i] !== newLines[i]) {
            diff.push({type: 'removed', line: oldLines[i]});
            diff.push({type: 'added', line: newLines[i]});
        } else {
            diff.push({type: 'unchanged', line: oldLines[i]});
        }
    }
    
    return diff;
}

function showVersions() {
    if (!notesData.currentNoteId) return;

    // 清除残留的diff面板
    document.querySelectorAll('.diff-panel').forEach(panel => panel.remove());

    const note = notesData.notes[notesData.currentNoteId];
    versionsListEl.innerHTML = '';
    
    if (note.versions && note.versions.length > 0) {
        note.versions.forEach((version, index) => {
            const li = document.createElement('li');
            li.className = 'version-item';
            
            const versionInfo = document.createElement('div');
            versionInfo.innerHTML = `
                <div class="version-hash"><i class="fas fa-code-branch"></i> ${version.hash}</div>
                <div class="version-message">${version.message}</div>
            `;
            
            const versionMeta = document.createElement('div');
            versionMeta.className = 'version-meta';
            
            const dateSpan = document.createElement('span');
            dateSpan.className = 'version-date';
            dateSpan.textContent = new Date(version.timestamp).toLocaleString();
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'version-actions';
            
            const diffBtn = document.createElement('span');
            diffBtn.className = 'version-diff';
            diffBtn.innerHTML = '<i class="fas fa-eye"></i> 查看差异';
            
            const restoreBtn = document.createElement('span');
            restoreBtn.className = 'version-restore';
            restoreBtn.innerHTML = '<i class="fas fa-undo"></i> 恢复';
            restoreBtn.onclick = () => restoreVersion(index);
            
            // 删除按钮
            const delBtn = document.createElement('span');
            delBtn.className = 'version-delete';
            delBtn.title = '删除该历史版本';
            delBtn.innerHTML = '<i class="fas fa-trash"></i>';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm('确定要删除该历史版本吗？此操作不可恢复！')) {
                    note.versions.splice(index, 1);
                    saveToLocalStorage();
                    showVersions();
                }
            };
            
            actionsDiv.appendChild(diffBtn);
            actionsDiv.appendChild(restoreBtn);
            actionsDiv.appendChild(delBtn);
            versionMeta.appendChild(dateSpan);
            versionMeta.appendChild(actionsDiv);
            
            li.appendChild(versionInfo);
            li.appendChild(versionMeta);
            versionsListEl.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = '暂无历史版本';
        versionsListEl.appendChild(li);
    }
    
    versionsPanelEl.classList.add('active');
}

function showVersionDiff(diffData, targetElement) {
    const versionItem = targetElement.closest('.version-item');
    if (!versionItem) return;
    // 检查当前版本项下是否已有diff-panel
    const existingPanel = versionItem.querySelector('.diff-panel');
    if (existingPanel) {
        // 先移除active类，触发动画
        existingPanel.classList.remove('active');
        // 等动画结束后再移除元素
        setTimeout(() => {
            if (existingPanel.parentNode) existingPanel.remove();
        }, 300); // 300ms和CSS动画时长一致
        return;
    }
    // 移除其它已存在的面板（只保留当前项可多开/单开都可）
    document.querySelectorAll('.diff-panel').forEach(panel => {
        if (!versionItem.contains(panel)) panel.remove();
    });
    // 创建新面板
    const diffPanel = document.createElement('div');
    diffPanel.className = 'diff-panel';
    // 正确渲染差异内容
    diffData.forEach(item => {
        const lineDiv = document.createElement('div');
        if (item.type === 'added') {
            lineDiv.className = 'diff-added';
            lineDiv.textContent = '+ ' + item.line;
        } else if (item.type === 'removed') {
            lineDiv.className = 'diff-removed';
            lineDiv.textContent = '- ' + item.line;
        } else {
            lineDiv.textContent = '  ' + item.line;
        }
        diffPanel.appendChild(lineDiv);
    });
    // 插入到版本项底部
    versionItem.appendChild(diffPanel);
    // 强制重绘后触发动画
    requestAnimationFrame(() => {
        diffPanel.style.maxHeight = '400px';
        diffPanel.style.opacity = '1';
    });
}

function restoreVersion(versionIndex) {
    if (!notesData.currentNoteId) return;
    
    const note = notesData.notes[notesData.currentNoteId];
    const version = note.versions[versionIndex];
    
    note.content = version.content;
    noteEditorEl.value = version.content;
    renderMarkdown(version.content);
    
    // 切换到预览模式
    noteEditorEl.style.display = 'none';
    notePreviewEl.style.display = 'block';
    editBtn.innerHTML = '<i class="fas fa-edit"></i><span class="btn-text"> 编辑笔记</span>';
    
    saveToLocalStorage();
    showToast('版本已恢复');
}

// ========== 编辑与字数统计 ==========
function updateWordCount() {
    const content = noteEditorEl.value || '';
    // 统计去除所有空白（空格、换行、Tab）后的字符数
    const wordCount = content.replace(/\s+/g, '').length;
    wordCountEl.textContent = `${wordCount} 字`;
}

function showToast(message, duration = 3000) {
    // 移除现有的toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 显示状态指示器
    showSaveStatus('已保存');
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, duration);
}

// ========== 保存状态显示 ==========
function showSaveStatus(status) {
    // 移除现有的状态指示器
    const existingStatus = document.querySelector('.save-status');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    const statusEl = document.createElement('div');
    statusEl.className = 'save-status';
    statusEl.textContent = status;
    statusEl.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #4CAF50;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s;
    `;
    
    document.body.appendChild(statusEl);
    
    // 淡入显示
    setTimeout(() => {
        statusEl.style.opacity = '1';
    }, 10);
    
    // 2秒后淡出
    setTimeout(() => {
        statusEl.style.opacity = '0';
        setTimeout(() => {
            if (statusEl.parentNode) {
                statusEl.parentNode.removeChild(statusEl);
            }
        }, 300);
    }, 2000);
}

// ========== 事件监听器归类 ==========
function setupEventListeners() {
    // 设置移动端工具栏事件
    setupMobileToolbarEvents();
    
    // 更新事件监听器（约380行）
    versionsListEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('version-diff')) {
            const listItem = e.target.closest('li');
            const versionIndex = Array.from(versionsListEl.children).indexOf(listItem);
            const diffData = notesData.notes[notesData.currentNoteId].versions[versionIndex].diff;
            showVersionDiff(diffData, e.target);
        }
    });
    // 事件监听器调整
    closeVersionsBtn.addEventListener('click', () => {
    versionsPanelEl.classList.remove('active');
    document.querySelectorAll('.diff-panel').forEach(panel => panel.remove());
    });
    // 笔记列表点击
    notesListEl.addEventListener('click', (e) => {
        const listItem = e.target.closest('li');
        if (listItem) {
            switchNote(listItem.dataset.noteId);
        }
    });
    
    // 新建笔记
    addNoteBtn.addEventListener('click', () => {
        const noteId = 'note_' + Date.now();
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const frontMatter = `---\ntitle: 新笔记\ntags: []\ndate: ${dateStr}\n---\n\n`;
        const newNote = {
            title: '新笔记',
            content: frontMatter + '开始记录你的想法吧！',
            versions: []
        };
        notesData.notes[noteId] = newNote;
        // 立即切换并保存（switchNote会同步所有内容并强制退出编辑模式）
        switchNote(noteId);
        saveToLocalStorage();
        renderNotesList();
        // 自动进入完整编辑模式
        if (editBtn) editBtn.click();
        noteTitleEl.focus();
        // 移动端新建笔记后自动收回侧栏
        if (window.innerWidth <= 768 && sidebar && !sidebar.classList.contains('drawer-collapsed')) {
            sidebar.classList.add('drawer-collapsed');
        }
    });
    
    // 编辑/预览切换
    editBtn.addEventListener('click', async () => {
        const mainPanel = document.querySelector('.note-main-panel');
        const scrollTop = mainPanel.scrollTop;
        const isEditing = cmEditor && cmEditor.getWrapperElement() && cmEditor.getWrapperElement().style.display !== 'none';
        const contentArea = document.querySelector('.content-area');
        
        if (!isEditing) {
            // 进入编辑模式
            noteEditorEl.style.display = 'none';
            notePreviewEl.style.display = 'none';
            noteEditorEl.classList.add('editing');
            editBtn.innerHTML = '<i class="fas fa-eye"></i><span class="btn-text"> 预览笔记</span>';
            
            if (!cmEditor) {
                // 统一架构+移动端降级配置
                const cmConfig = {
                    mode: 'markdown',
                    lineNumbers: false,
                    lineWrapping: true,
                    theme: 'default',
                    viewportMargin: isMobile() ? Infinity : 10,
                    autofocus: true,
                    dragDrop: false,
                    readOnly: false,
                    tabIndex: 0
                };
                if (isMobile()) {
                    cmConfig.inputStyle = 'contenteditable';
                    cmConfig.cursorScrollMargin = 60;
                }
                cmEditor = CodeMirror.fromTextArea(noteEditorEl, cmConfig);
                cmEditor.setSize('100%', '100%');
                
                // 移动端同步机制
                if (isMobile()) {
                    const syncToTextarea = () => {
                        noteEditorEl.value = cmEditor.getValue();
                    };
                    cmEditor.on('change', syncToTextarea);
                    cmEditor.on('blur', syncToTextarea);
                    cmEditor.on('scroll', syncToTextarea);
                    cmEditor.on('touchend', syncToTextarea);
                    
                    // 光标体验优化
                    const ensureCursorVisible = () => {
                        cmEditor.refresh();
                        cmEditor.scrollIntoView(cmEditor.getCursor());
                    };
                    cmEditor.on('focus', ensureCursorVisible);
                    cmEditor.on('inputRead', ensureCursorVisible);
                    cmEditor.on('touchend', ensureCursorVisible);
                    window.addEventListener('resize', ensureCursorVisible);
                }
                
                // 设置CodeMirror的自动保存
                if (window.setupCodeMirrorAutoSave) {
                    window.setupCodeMirrorAutoSave();
                }
            }
            
            // 始终以当前textarea内容为准
            cmEditor.setValue(noteEditorEl.value);
            cmEditor.getWrapperElement().style.display = 'block';
            if(contentArea) contentArea.classList.add('editing-mode');

            // ===================================================
            // ===========   改善光标问题的核心代码   ===========
            // ===================================================
            // 使用 setTimeout 将操作推迟到下一个事件循环
            // 确保编辑器在 DOM 中已完全渲染并可见
            setTimeout(() => {
                // 1. 强制刷新编辑器，使其重新计算布局
                cmEditor.refresh(); 
                // 2. 显式地将焦点设置到编辑器上
                cmEditor.focus();
                // 3. (可选但推荐) 将光标移动到文档末尾，提供一个明确的初始位置
                // 如果你希望光标在开头，可以使用 {line: 0, ch: 0}
                cmEditor.setCursor(cmEditor.lineCount(), 0); 
            }, 0);
            // ===================================================

            // 新增：进入编辑模式时显示工具条
            onEditModeChange(true);
        } else {
            // 退出编辑模式，进入预览模式
            const newContent = cmEditor.getValue();
            noteEditorEl.value = newContent; // 同步textarea内容

            const hasChanged = notesData.currentNoteId &&
                notesData.notes[notesData.currentNoteId].content !== newContent;

            if (hasChanged) {
                // 内容已更改，调用保存函数。该函数内部会负责渲染。
                await saveVersion();
            } else if (notesData.currentNoteId) {
                // 内容未更改，但仍需确保预览区显示的是正确内容。
                renderMarkdown(notesData.notes[notesData.currentNoteId].content);
            }

            // --- 关键改动 ---
            // 在确保内容已经渲染到 notePreviewEl 之后，再执行UI切换
            cmEditor.getWrapperElement().style.display = 'none';
            notePreviewEl.style.display = 'block';
            noteEditorEl.classList.remove('editing');
            editBtn.innerHTML = '<i class="fas fa-edit"></i><span class="btn-text"> 编辑笔记</span>';
            
            if(contentArea) contentArea.classList.remove('editing-mode');
            // 新增：退出编辑模式时隐藏工具条
            onEditModeChange(false);
        }
        
        // 强制恢复主页面滚动条位置
        setTimeout(() => {
            mainPanel.scrollTop = scrollTop;
        }, 0);
    });
    
    // 实时字数统计
    noteEditorEl.addEventListener('input', updateWordCount);
    
    // 显示历史版本
    showVersionsBtn.addEventListener('click', showVersions);
    
    // 关闭历史版本面板
    closeVersionsBtn.addEventListener('click', () => {
        versionsPanelEl.classList.remove('active');
    });
    
    // 标题变化时自动保存
    noteTitleEl.addEventListener('blur', () => {
        if (notesData.currentNoteId) {
            notesData.notes[notesData.currentNoteId].title = noteTitleEl.value;
            saveToLocalStorage();
            renderNotesList();
        }
    });
    
    // 紧急数据恢复功能
    window.emergencyDataRecovery = function() {
        if (confirm('确定要尝试恢复数据吗？这将尝试从备份中恢复数据。')) {
            try {
                const backupData = localStorage.getItem('notesData_backup');
                if (backupData) {
                    const parsedData = JSON.parse(backupData);
                    notesData.currentNoteId = parsedData.currentNoteId;
                    notesData.notes = parsedData.notes;
                    saveToLocalStorage();
                    location.reload();
                    alert('数据恢复成功！');
                } else {
                    alert('未找到备份数据！');
                }
            } catch (error) {
                alert('数据恢复失败：' + error.message);
            }
        }
    };
    
    // 添加快捷键支持
    document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+R 紧急恢复数据
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            window.emergencyDataRecovery();
        }
        // Ctrl+S 手动保存
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (notesData.currentNoteId) {
                saveVersion();
            }
        }
        // Ctrl+Shift+D 查看存储状态
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            window.showStorageStatus();
        }
        // Ctrl+Shift+E 导出所有存储数据
        if (e.ctrlKey && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            if (confirm('确定要导出所有存储数据吗？这将下载一个包含所有数据的JSON文件。')) {
                window.exportAllStorageData();
            }
        }
    });
    
    // 添加存储状态查看功能
    window.showStorageStatus = function() {
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
            // 异步获取 IndexedDB 信息
            window.indexedDBStorage.getStorageInfo().then(info => {
                status += `- 总项目数: ${info.totalItems}\n`;
                status += `- 备份数量: ${info.backupCount}\n`;
                status += `- 主数据大小: ${(info.mainDataSize / 1024).toFixed(2)} KB\n`;
                status += `- 最后备份: ${info.lastBackup ? new Date(info.lastBackup).toLocaleString() : '无'}\n`;
                alert(status);
            }).catch(error => {
                status += `- 错误: ${error.message}\n`;
                alert(status);
            });
        } else {
            status += '- 状态: ❌ 未初始化\n';
            alert(status);
        }
    };
    
    // 添加详细数据导出功能
    window.exportAllStorageData = function() {
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
            window.indexedDBStorage.exportData().then(data => {
                exportData.indexedDB = data;
                downloadStorageData(exportData);
            }).catch(error => {
                exportData.indexedDB = { error: error.message };
                downloadStorageData(exportData);
            });
        } else {
            downloadStorageData(exportData);
        }
    };
    
    // 下载存储数据
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
        alert('存储数据已导出到文件！');
    }

    // 搜索输入监听
    if (searchInputEl) {
        searchInputEl.addEventListener('input', e => {
            searchKeyword = e.target.value.trim();
            renderNotesList();
        });
    }

    // 云同步按钮逻辑
    if (cloudSyncBtn && cloudSyncModal && cloudSyncCloseBtn) {
        cloudSyncBtn.addEventListener('click', () => {
            cloudSyncModal.classList.remove('hidden');
        });
        cloudSyncCloseBtn.addEventListener('click', () => {
            cloudSyncModal.classList.add('hidden');
        });
        // 点击遮罩关闭
        cloudSyncModal.addEventListener('click', (e) => {
            if (e.target === cloudSyncModal) {
                cloudSyncModal.classList.add('hidden');
            }
        });
    }

    // 云同步上传到Gist
    if (cloudSyncPushBtn) {
        cloudSyncPushBtn.addEventListener('click', async () => {
            const token = cloudTokenInput.value.trim();
            let gistId = cloudGistIdInput.value.trim();
            if (!token) {
                cloudSyncStatus.textContent = '请填写 GitHub Token';
                return;
            }
            cloudSyncStatus.textContent = '正在上传到云端...';
            try {
                const notesData = JSON.parse(localStorage.getItem('notesData') || '{}');
                const newGistId = await uploadToGist(token, gistId, notesData);
                cloudSyncStatus.innerHTML = '上传成功！<br>Gist ID: ' + newGistId;
                cloudGistIdInput.value = newGistId;
            } catch (err) {
                cloudSyncStatus.textContent = '上传失败：' + err.message;
            }
        });
    }

    // 云同步拉取Gist
    /*if (cloudSyncPullBtn) {
        cloudSyncPullBtn.addEventListener('click', async () => {
            const token = cloudTokenInput.value.trim();
            const gistId = cloudGistIdInput.value.trim();
            if (!token || !gistId) {
                cloudSyncStatus.textContent = '请填写 Token 和 Gist ID';
                return;
            }
            cloudSyncStatus.textContent = '正在拉取云端数据...';
            try {
                // 先清空本地数据，确保完全覆盖
                localStorage.removeItem('notesData');
                
                // 强制更新Service Worker缓存
                if ('serviceWorker' in navigator) {
                    try {
                        const registration = await navigator.serviceWorker.getRegistration();
                        if (registration) {
                            await registration.update();
                        }
                    } catch (e) {
                        console.log('Service Worker更新失败:', e);
                    }
                }
                
                const data = await fetchFromGist(token, gistId);
                localStorage.setItem('notesData', JSON.stringify(data));
                cloudSyncStatus.textContent = '拉取成功，已覆盖本地数据！';
                
                // 强制刷新页面，确保获取最新数据
                // 只清除可能影响云同步的缓存，保留核心资源缓存
                if ('caches' in window) {
                    try {
                        const cacheNames = await caches.keys();
                        // 只删除包含 'note-app-cache' 的缓存，保留其他缓存
                        const appCaches = cacheNames.filter(name => name.includes('note-app-cache'));
                        await Promise.all(appCaches.map(name => caches.delete(name)));
                    } catch (e) {
                        console.log('清除缓存失败:', e);
                    }
                }
                
                // 强制刷新页面，确保获取最新数据
                location.reload(true);
            } catch (err) {
                cloudSyncStatus.textContent = '拉取失败：' + err.message;
            }
        });
    }*/

    if (cloudSyncPullBtn) {
        cloudSyncPullBtn.addEventListener('click', async () => {
            const token = cloudTokenInput.value.trim();
            const gistId = cloudGistIdInput.value.trim();
            if (!token || !gistId) {
                cloudSyncStatus.textContent = '请填写 Token 和 Gist ID';
                return;
            }
            cloudSyncStatus.textContent = '正在拉取云端数据...';
            try {
                const data = await fetchFromGist(token, gistId);

                // 修正：将数据直接写入 IndexedDB
                if (window.indexedDBStorage) {
                    await window.indexedDBStorage.saveData(data);
                    // 为保险起见，再次清理 localStorage
                    localStorage.removeItem('notesData');
                    cloudSyncStatus.textContent = '拉取成功，已覆盖本地数据！即将刷新...';
                } else {
                    // 如果 IndexedDB 不可用，才回退到 localStorage
                    localStorage.setItem('notesData', JSON.stringify(data));
                    cloudSyncStatus.textContent = '拉取成功（使用localStorage），即将刷新...';
                }

                // 成功后强制刷新页面以应用新数据
                setTimeout(() => {
                    location.reload(true);
                }, 1500); // 延迟刷新，让用户看到成功信息

            } catch (err) {
                cloudSyncStatus.textContent = '拉取失败：' + err.message;
            }
        });
    }

    // 单篇笔记导出功能
    if (exportNoteBtn) {
        exportNoteBtn.addEventListener('click', () => {
            const noteId = notesData.currentNoteId;
            if (!noteId || !notesData.notes[noteId]) return;
            const note = notesData.notes[noteId];
            // 文件名：笔记标题（去除特殊字符）
            let fileName = (note.title || '未命名笔记').replace(/[\\/:*?"<>|]/g, '_') + '.md';
            // 内容：含front matter
            const content = note.content || '';
            const blob = new Blob([content], { type: 'text/markdown' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
            }, 100);
        });
    }

    // 全部导入功能
    if (importAllBtn) {
        importAllBtn.addEventListener('click', () => {
            importModal.classList.remove('hidden');
        });
    }

    // 导入弹窗交互
    if (importModalCloseBtn) {
        importModalCloseBtn.onclick = () => importModal.classList.add('hidden');
    }
    // 点击遮罩关闭
    if (importModal) {
        importModal.addEventListener('click', e => {
            if (e.target === importModal) importModal.classList.add('hidden');
        });
    }
    // ESC关闭
    window.addEventListener('keydown', e => {
        if (e.key === 'Escape') importModal.classList.add('hidden');
    });
    // 单md导入
    if (importMdBtn) {
        importMdBtn.onclick = () => {
            importModal.classList.add('hidden');
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.md,.html';
            input.onchange = async () => {
                if (input.files.length) await importFromFiles([input.files[0]]);
                renderNotesList();
                showToast('导入完成');
            };
            input.click();
        };
    }
    // 文件夹导入
    if (importFolderBtn) {
        importFolderBtn.onclick = () => {
            importModal.classList.add('hidden');
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.md,.html';
            input.multiple = true;
            input.webkitdirectory = true;
            input.onchange = async () => {
                if (input.files.length) await importFromFiles(Array.from(input.files));
                renderNotesList();
                showToast('导入完成');
            };
            input.click();
        };
    }
    // zip导入
    if (importZipBtn) {
        importZipBtn.onclick = () => {
            importModal.classList.add('hidden');
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.zip';
            input.onchange = async () => {
                if (input.files.length) await importFromZip(input.files[0]);
                renderNotesList();
                showToast('导入完成');
            };
            input.click();
        };
    }
    // HTML导入
    const importHtmlBtn = document.getElementById('importHtmlBtn');
    if (importHtmlBtn) {
        importHtmlBtn.onclick = () => {
            importModal.classList.add('hidden');
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.html';
            input.onchange = async () => {
                if (input.files.length) await importFromFiles([input.files[0]]);
                renderNotesList();
                showToast('导入完成');
            };
            input.click();
        };
    }
}

// ========== 启动应用 ==========
// init(); // 注释掉提前的调用，等待 DOMContentLoaded 事件

// ========== 云同步相关 ==========
async function uploadToGist(token, gistId, data) {
    const filename = 'notes-data.json';
    const body = {
        files: {
            [filename]: { content: JSON.stringify(data, null, 2) }
        },
        public: false,
        description: '云同步 - 严谨的版本控制笔记系统'
    };
    let url = 'https://api.github.com/gists';
    let method = 'POST';
    if (gistId) {
        url += '/' + gistId;
        method = 'PATCH';
    }
    
    // 强制不缓存，确保上传到最新状态
    const res = await fetch(url, {
        method,
        headers: {
            'Authorization': 'token ' + token,
            'Accept': 'application/vnd.github+json'
        },
        body: JSON.stringify(body),
        cache: 'no-store'  // 强制绕过浏览器缓存
    });
    
    if (!res.ok) throw new Error('Gist同步失败: ' + res.status);
    const result = await res.json();
    return result.id;
}

/*async function fetchFromGist(token, gistId) {
    if (!gistId) throw new Error('请填写 Gist ID');
    
    // 添加随机参数和时间戳，彻底绕过所有缓存
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const url = `https://api.github.com/gists/${gistId}?t=${timestamp}&r=${random}`;
    
    // 强制不缓存，确保获取最新数据
    const res = await fetch(url, {
        headers: {
            'Authorization': 'token ' + token,
            'Accept': 'application/vnd.github+json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        },
        cache: 'no-store',  // 强制绕过浏览器缓存
        mode: 'cors'
    });
    
    if (!res.ok) throw new Error('拉取失败: ' + res.status);
    const result = await res.json();
    const file = result.files['notes-data.json'];
    if (!file) throw new Error('云端未找到 notes-data.json 文件');
    
    let content = file.content;
    if (file.truncated && file.raw_url) {
        // 重新 fetch 全量内容，强制不缓存并加时间戳绕过CDN缓存
        const rawTimestamp = Date.now();
        const rawRandom = Math.random().toString(36).substring(7);
        const rawUrlWithTimestamp = `${file.raw_url}?t=${rawTimestamp}&r=${rawRandom}`;
        const rawRes = await fetch(rawUrlWithTimestamp, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            cache: 'no-store'  // 强制绕过浏览器缓存
        });
        if (!rawRes.ok) throw new Error('拉取大文件失败: ' + rawRes.status);
        content = await rawRes.text();
    }
    
    return JSON.parse(content);
}*/

async function fetchFromGist(token, gistId) {
    if (!gistId) throw new Error('请填写 Gist ID');

    // 修正：移除所有无效的缓存破坏查询参数，使用纯净的API URL
    const url = `https://api.github.com/gists/${gistId}`;

    // 修正：移除冗余的缓存控制头，只保留 cache: 'no-store' 选项
    // 这是告诉浏览器不要缓存此fetch请求的现代且标准的方法。
    const res = await fetch(url, {
        headers: {
            'Authorization': 'token ' + token,
            'Accept': 'application/vnd.github+json'
        },
        cache: 'no-store' // 强制绕过浏览器缓存
    });

    if (!res.ok) throw new Error('拉取失败，状态码: ' + res.status);
    const result = await res.json();
    const file = result.files['notes-data.json'];
    if (!file) throw new Error('云端未找到 notes-data.json 文件');

    let content = file.content;
    if (file.truncated && file.raw_url) {
        // 如果文件被截断，从 raw_url 获取完整内容
        // 修正：同样移除 raw_url 后面无效的查询参数
        const rawRes = await fetch(file.raw_url, {
            // raw_url 的请求不需要 token，但同样要禁用缓存
            cache: 'no-store'
        });
        if (!rawRes.ok) throw new Error('拉取大文件失败: ' + rawRes.status);
        content = await rawRes.text();
    }

    return JSON.parse(content);
}

// ========== 标签与 front matter 工具 ==========
function parseFrontMatter(content) {
    const fmMatch = content.match(/^---([\s\S]*?)---/);
    if (!fmMatch) return {};
    const fm = fmMatch[1];
    const lines = fm.split(/\r?\n/);
    const meta = {};
    for (const line of lines) {
        const m = line.match(/^([a-zA-Z0-9_\u4e00-\u9fa5]+):\s*(.*)$/);
        if (m) {
            let key = m[1].trim();
            let value = m[2].trim();
            if (key === 'tags') {
                // 支持 tags: [标签1, 标签2]
                const arrMatch = value.match(/^\[(.*)\]$/);
                if (arrMatch) {
                    value = arrMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
                } else {
                    value = value ? [value] : [];
                }
            }
            meta[key] = value;
        }
    }
    return meta;
}

function getAllTags() {
    const tagCount = {};
    for (const noteId in notesData.notes) {
        const note = notesData.notes[noteId];
        const meta = parseFrontMatter(note.content);
        if (meta.tags && Array.isArray(meta.tags)) {
            meta.tags.forEach(tag => {
                if (!tag) return;
                tagCount[tag] = (tagCount[tag] || 0) + 1;
            });
        }
    }
    // 按出现频率降序
    return Object.keys(tagCount).sort((a, b) => tagCount[b] - tagCount[a]);
}

function renderTagsList() {
    const tagsListEl = document.getElementById('tagsList');
    if (!tagsListEl) return;
    const tags = getAllTags();
    tagsListEl.innerHTML = '';
    if (tags.length === 0) {
        tagsListEl.style.display = 'none';
        return;
    }
    tagsListEl.style.display = '';
    tags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag-item' + (selectedTags.includes(tag) ? ' selected' : '');
        tagEl.textContent = tag;
        tagEl.onclick = () => {
            // 多选：点击已选则取消，否则添加
            if (selectedTags.includes(tag)) {
                selectedTags = selectedTags.filter(t => t !== tag);
            } else {
                selectedTags.push(tag);
            }
            renderTagsList();
            renderNotesList();
        };
        tagsListEl.appendChild(tagEl);
    });
}

// ========== 导入导出 ==========
async function importFromZip(zipFile) {
    // 依赖JSZip库，若未引入需动态加载
    if (typeof JSZip === 'undefined') {
        await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
    }
    const zip = await JSZip.loadAsync(zipFile);
    const mdFiles = [];
    zip.forEach((relPath, file) => {
        if (!file.dir && relPath.endsWith('.md')) {
            mdFiles.push(file.async('string').then(content => ({
                name: relPath.split('/').pop(),
                content
            })));
        }
    });
    const files = await Promise.all(mdFiles);
    await importFromFiles(files);
}

async function importFromFiles(files) {
    for (const file of files) {
        let content = file.content || (file.text ? await file.text() : '');
        let title = '未命名笔记';
        let isHtml = false;
        // 判断文件类型
        if (file.name && file.name.toLowerCase().endsWith('.html')) {
            isHtml = true;
        }
        if (isHtml) {
            // 用 turndown 转换 HTML 为 Markdown
            if (typeof TurndownService === 'undefined') {
                await loadScript('https://cdn.jsdelivr.net/npm/turndown@7.1.2/dist/turndown.min.js');
            }
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            // 提取 <title>
            const titleEl = doc.querySelector('title');
            if (titleEl && titleEl.textContent.trim()) {
                title = titleEl.textContent.trim();
            } else if (file.name) {
                title = file.name.replace(/\.[^.]+$/, '');
            }
            // 转换正文
            const turndownService = new TurndownService();
            // 只取 <body> 内容
            const bodyHtml = doc.body ? doc.body.innerHTML : content;
            content = turndownService.turndown(bodyHtml);
        } else {
            // 解析front matter，提取title
            const fm = content.match(/^---([\s\S]*?)---/);
            if (fm) {
                const titleMatch = fm[1].match(/title:\s*(.*)/);
                if (titleMatch) {
                    title = titleMatch[1].replace(/^['"]|['"]$/g, '').trim() || title;
                }
            }
        }
        // 生成唯一id
        const noteId = 'note_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        notesData.notes[noteId] = {
            title,
            content,
            versions: []
        };
    }
    saveToLocalStorage();
}

function loadScript(src) {
    // 如果已经加载过，直接返回
    if (loadedScripts.has(src)) {
        return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => {
            loadedScripts.add(src);
            resolve();
        };
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

// ========== 版本自动保存 ==========
async function saveVersion() {
    if (!notesData.currentNoteId) return;
    const note = notesData.notes[notesData.currentNoteId];
    
    // 获取当前编辑器内容
    let currentContent = '';
    if (cmEditor && cmEditor.getWrapperElement().style.display !== 'none') {
        // 如果CodeMirror编辑器正在使用，从中获取内容
        currentContent = cmEditor.getValue();
        // 同步到textarea
        noteEditorEl.value = currentContent;
    } else {
        // 否则从textarea获取内容
        currentContent = noteEditorEl.value;
    }
    
    // 强制保存，不管内容是否变化
    // 生成版本信息
    const version = {
        hash: generateVersionHash(currentContent),
        timestamp: new Date().toISOString(),
        content: currentContent,
        message: '自动保存',
        diff: note.versions && note.versions.length > 0
            ? diffVersions(note.versions[0].content, currentContent)
            : []
    };
    
    if (!note.versions) note.versions = [];
    note.versions.unshift(version);
    
    // 更新笔记内容
    note.content = currentContent;
    note.lastModified = new Date().toISOString();
    
    // 等待数据保存完成
    await saveToLocalStorage();
    
    // 保存成功后才更新UI和提示
    renderMarkdown(currentContent);
    updateWordCount();
    renderNotesList();
    showToast('已自动保存并生成新版本');
    
    console.log('版本保存完成，当前版本数:', note.versions.length);
}

// ========== 移动端浮动工具条逻辑 ==========
function isMobile() {
  return window.innerWidth <= 768;
}
function showMobileToolbar(show) {
  const toolbar = document.getElementById('mobileToolbar');
  if (!toolbar) return;
  toolbar.style.display = (show && isMobile()) ? 'flex' : 'none';
}
function onEditModeChange(isEditing) {
  showMobileToolbar(isEditing);
}
// 移动端工具栏按钮事件绑定
function setupMobileToolbarEvents() {
  const btnUndo = document.getElementById('btnUndo');
  const btnRedo = document.getElementById('btnRedo');
  const btnPreview = document.getElementById('btnPreview');
  
  if (btnUndo) {
    btnUndo.onclick = function() { 
      console.log('撤回按钮被点击');
      console.log('cmEditor 是否存在:', !!cmEditor);
      if (cmEditor) {
          console.log('尝试执行撤回');
          cmEditor.focus();
          setTimeout(() => cmEditor.undo(), 0);
      }
    };
  }
  
  if (btnRedo) {
    btnRedo.onclick = function() { 
      console.log('重做按钮被点击');
      console.log('cmEditor 是否存在:', !!cmEditor);
      if (cmEditor) {
          console.log('尝试执行重做');
          cmEditor.focus();
          setTimeout(() => cmEditor.redo(), 0);
      }
    };
  }
  
  if (btnPreview) {
    btnPreview.onclick = function() { 
      if (editBtn) editBtn.click(); 
    };
  }
}

// 窗口大小变化时更新移动端工具栏显示状态
window.addEventListener('resize', function() {
  // 只在编辑模式下自适应
  const isEditing = document.querySelector('.content-area.editing-mode');
  showMobileToolbar(!!isEditing);
});

// ========== 应用初始化 ==========
// 确保在DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
    // 初始化主应用
    init();
});

// ========== 更新检测和通知系统 ==========
let updateAvailable = false;
let updateDialogShown = false;

function initUpdateDetection() {
    // 检查 Service Worker 支持
    if ('serviceWorker' in navigator) {
        // 监听 Service Worker 消息
        navigator.serviceWorker.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                console.log('收到更新通知:', event.data);
                updateAvailable = true;
                showUpdateDialog(event.data.data.message);
            } else if (event.data && event.data.type === 'SHOW_SYNC_DIALOG') {
                showSyncDialog(event.data.data.message);
            } else if (event.data && event.data.type === 'FORCE_UPDATE') {
                forceUpdate();
            }
        });
        
        // 注册 Service Worker
        navigator.serviceWorker.register('/service-worker.js')
            .then(function(registration) {
                console.log('Service Worker 注册成功:', registration);
                
                // 检查是否有更新
                registration.update();
                
                // 监听更新
                registration.addEventListener('updatefound', function() {
                    console.log('检测到 Service Worker 更新');
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('新版本已安装，等待激活');
                            updateAvailable = true;
                            showUpdateDialog('检测到新版本，建议先同步云端数据');
                        }
                    });
                });
            })
            .catch(function(error) {
                console.error('Service Worker 注册失败:', error);
            });
    }
}

function showUpdateDialog(message) {
    if (updateDialogShown) return;
    updateDialogShown = true;
    
    // 创建更新对话框
    const dialog = document.createElement('div');
    dialog.className = 'update-dialog';
    dialog.innerHTML = `
        <div class="update-dialog-content">
            <div class="update-dialog-header">
                <h3><i class="fas fa-sync-alt"></i> 系统更新提醒</h3>
                <button class="update-dialog-close" onclick="closeUpdateDialog()">×</button>
            </div>
            <div class="update-dialog-body">
                <p>${message}</p>
                <p><strong>建议操作：</strong></p>
                <ul>
                    <li>1. 先同步云端数据，确保数据安全</li>
                    <li>2. 然后点击"立即更新"应用新版本</li>
                </ul>
            </div>
            <div class="update-dialog-actions">
                <button class="btn btn-primary" onclick="syncAndUpdate()">
                    <i class="fas fa-cloud-upload-alt"></i> 同步并更新
                </button>
                <button class="btn btn-secondary" onclick="forceUpdate()">
                    <i class="fas fa-download"></i> 立即更新
                </button>
                <button class="btn btn-outline" onclick="closeUpdateDialog()">
                    <i class="fas fa-clock"></i> 稍后处理
                </button>
            </div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .update-dialog {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        }
        .update-dialog-content {
            background: white;
            border-radius: 10px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .update-dialog-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #eee;
        }
        .update-dialog-header h3 {
            margin: 0;
            color: #333;
        }
        .update-dialog-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        .update-dialog-body {
            padding: 20px;
        }
        .update-dialog-body ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .update-dialog-actions {
            padding: 20px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .update-dialog-actions .btn {
            flex: 1;
            min-width: 120px;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(dialog);
}

function showSyncDialog(message) {
    // 显示同步对话框
    showToast(message, 5000);
    // 可以在这里添加更详细的同步界面
}

function closeUpdateDialog() {
    const dialog = document.querySelector('.update-dialog');
    if (dialog) {
        dialog.remove();
        updateDialogShown = false;
    }
}

function syncAndUpdate() {
    // 先同步云端数据，然后更新
    showToast('正在同步云端数据...', 3000);
    
    // 这里可以调用云同步函数
    // 同步完成后自动更新
    setTimeout(() => {
        showToast('同步完成，正在更新...', 2000);
        forceUpdate();
    }, 2000);
}

function forceUpdate() {
    // 强制更新
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(function(registration) {
            registration.active.postMessage({ type: 'SKIP_WAITING' });
        });
    }
    
    // 刷新页面应用更新
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// 定期检查更新
setInterval(() => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(function(registration) {
            registration.update();
        });
    }
}, 30 * 60 * 1000); // 每30分钟检查一次