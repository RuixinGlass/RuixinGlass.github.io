// =====================
// 严谨的版本控制笔记系统 - 主逻辑入口
// =====================

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

    // 4. 移动端侧栏滑动手势


    // ========== 旧版全屏滑动抽拉逻辑 ==========
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
function init() {
    // 配置Markdown解析器
    marked.setOptions({
        breaks: true, // 自动转换换行符
        gfm: true,    // 启用GitHub风格的Markdown
        mangle: false,
        headerIds: false
    });

    loadFromLocalStorage();
    renderNotesList();
    setupEventListeners();
    
    // 如果没有当前笔记，则显示提示
    if (!notesData.currentNoteId) {
        notePreviewEl.innerHTML = `
            <div class="empty-state">
                <h3><i class="fas fa-book-open"></i> 欢迎使用笔记系统</h3>
                <p>点击左侧的"新建笔记"按钮开始记录你的想法</p>
            </div>
        `;
    }

    // 默认隐藏编辑区，显示预览区
    noteEditorEl.style.display = 'none';
    notePreviewEl.style.display = 'block';
    editBtn.innerHTML = '<i class="fas fa-edit"></i><span class="btn-text"> 编辑笔记</span>';
    
    // 初始化字数统计
    updateWordCount();
}

// ========== 本地存储 ==========
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('notesData');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        notesData.currentNoteId = parsedData.currentNoteId;
        notesData.notes = parsedData.notes;
        
        // 如果有当前笔记，切换到该笔记
        if (notesData.currentNoteId) {
            switchNote(notesData.currentNoteId);
        }
    }
}

function saveToLocalStorage() {
    localStorage.setItem('notesData', JSON.stringify(notesData));
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
        cmEditor.toTextArea(); // 恢复 textarea
        cmEditor.getWrapperElement().remove(); // 移除 Codemirror DOM
        cmEditor = null;
    }
    noteTitleEl.value = note.title || '';
    noteEditorEl.value = note.content || '';
    noteEditorEl.style.display = 'none';
    notePreviewEl.style.display = 'block';
    noteEditorEl.classList.remove('editing');
    editBtn.innerHTML = '<i class="fas fa-edit"></i><span class="btn-text"> 编辑笔记</span>';
    renderMarkdown(note.content || '');
    updateWordCount();
    if (versionsPanelEl.classList.contains('active')) {
        showVersions();
    }
    saveToLocalStorage();
    // --- 修复1：同步侧边栏 active 状态 ---
    const activeLi = notesListEl.querySelector('li.active');
    if (activeLi) activeLi.classList.remove('active');
    const newActiveLi = notesListEl.querySelector(`li[data-note-id="${noteId}"]`);
    if (newActiveLi) newActiveLi.classList.add('active');
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

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('animate__fadeOut');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ========== 事件监听器归类 ==========
function setupEventListeners() {
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
    editBtn.addEventListener('click', () => {
        const mainPanel = document.querySelector('.note-main-panel');
        const scrollTop = mainPanel.scrollTop;
        const isEditing = cmEditor && cmEditor.getWrapperElement().style.display !== 'none';
        const contentArea = document.querySelector('.content-area');
        if (!isEditing) {
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
                cmEditor.setSize('100%');
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
            }
            // 始终以当前textarea内容为准
            cmEditor.setValue(noteEditorEl.value);
            cmEditor.getWrapperElement().style.display = 'block';
            if(contentArea) contentArea.classList.add('editing-mode');
        } else {
            // 始终以当前cmEditor内容为准
            noteEditorEl.value = cmEditor.getValue();
            cmEditor.getWrapperElement().style.display = 'none';
            notePreviewEl.style.display = 'block';
            noteEditorEl.classList.remove('editing');
            editBtn.innerHTML = '<i class="fas fa-edit"></i><span class="btn-text"> 编辑笔记</span>';
            if (notesData.currentNoteId &&
                notesData.notes[notesData.currentNoteId].content !== noteEditorEl.value) {
                saveVersion();
            }
            if(contentArea) contentArea.classList.remove('editing-mode');
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
                cloudSyncStatus.textContent = '上传成功！Gist ID: ' + newGistId;
                cloudGistIdInput.value = newGistId;
            } catch (err) {
                cloudSyncStatus.textContent = '上传失败：' + err.message;
            }
        });
    }

    // 云同步拉取Gist
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
                localStorage.setItem('notesData', JSON.stringify(data));
                cloudSyncStatus.textContent = '拉取成功，已覆盖本地数据！';
                // 刷新页面数据
                location.reload();
            } catch (err) {
                cloudSyncStatus.textContent = '拉取失败：' + err.message;
            }
        });
    }

    // 移动端菜单逻辑
    if (mobileMenuBtn && mobileMenuDropdown) {
        // 确保菜单初始隐藏
        mobileMenuDropdown.style.display = 'none';
        let menuOpen = false;
        // 显示/隐藏菜单
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuOpen = !menuOpen;
            mobileMenuDropdown.style.display = menuOpen ? 'block' : 'none';
        });
        // 点击空白处关闭菜单
        document.addEventListener('click', (e) => {
            if (menuOpen) {
                if (!mobileMenuDropdown.contains(e.target) && e.target !== mobileMenuBtn) {
                    mobileMenuDropdown.style.display = 'none';
                    menuOpen = false;
                }
            }
        });
        // 菜单按钮事件绑定
        document.getElementById('mobile-new-note').onclick = () => {
            mobileMenuDropdown.style.display = 'none';
            menuOpen = false;
            document.getElementById('new-note-btn')?.click();
        };
        document.getElementById('mobile-upload-cloud').onclick = () => {
            mobileMenuDropdown.style.display = 'none';
            menuOpen = false;
            document.getElementById('upload-cloud-btn')?.click();
        };
        document.getElementById('mobile-download-cloud').onclick = () => {
            mobileMenuDropdown.style.display = 'none';
            menuOpen = false;
            document.getElementById('download-cloud-btn')?.click();
        };
        document.getElementById('mobile-more').onclick = () => {
            mobileMenuDropdown.style.display = 'none';
            menuOpen = false;
            document.getElementById('more-btn')?.click();
        };
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
            input.accept = '.md';
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
            input.accept = '.md';
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
}

// ========== 启动应用 ==========
init();

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
    const res = await fetch(url, {
        method,
        headers: {
            'Authorization': 'token ' + token,
            'Accept': 'application/vnd.github+json'
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Gist同步失败: ' + res.status);
    const result = await res.json();
    return result.id;
}

async function fetchFromGist(token, gistId) {
    if (!gistId) throw new Error('请填写 Gist ID');
    const url = `https://api.github.com/gists/${gistId}`;
    const res = await fetch(url, {
        headers: {
            'Authorization': 'token ' + token,
            'Accept': 'application/vnd.github+json'
        }
    });
    if (!res.ok) throw new Error('拉取失败: ' + res.status);
    const result = await res.json();
    const file = result.files['notes-data.json'];
    if (!file) throw new Error('云端未找到 notes-data.json 文件');
    return JSON.parse(file.content);
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
        let content = file.content || await file.text();
        // 解析front matter，提取title
        let title = '未命名笔记';
        const fm = content.match(/^---([\s\S]*?)---/);
        if (fm) {
            const titleMatch = fm[1].match(/title:\s*(.*)/);
            if (titleMatch) {
                title = titleMatch[1].replace(/^['"]|['"]$/g, '').trim() || title;
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
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

// ========== 版本自动保存 ==========
function saveVersion() {
    if (!notesData.currentNoteId) return;
    const note = notesData.notes[notesData.currentNoteId];
    const currentContent = noteEditorEl.value;
    // 如果内容没变，不保存
    if (note.content === currentContent) return;
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
    // 更新UI
    renderMarkdown(currentContent);
    updateWordCount();
    renderNotesList();
    showToast('已自动保存并生成新版本');
    saveToLocalStorage();
}
