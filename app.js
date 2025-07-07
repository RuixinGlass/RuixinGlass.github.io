// 笔记数据存储结构
const notesData = {
    currentNoteId: null,
    notes: {}
};

// DOM元素
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

// 云同步弹窗逻辑
const cloudSyncBtn = document.getElementById('cloudSyncBtn');
const cloudSyncModal = document.getElementById('cloudSyncModal');
const cloudSyncCloseBtn = document.getElementById('cloudSyncCloseBtn');

// 云同步上传到Gist
const cloudSyncPushBtn = document.getElementById('cloudSyncPushBtn');
const cloudTokenInput = document.getElementById('cloudTokenInput');
const cloudGistIdInput = document.getElementById('cloudGistIdInput');
const cloudSyncStatus = document.getElementById('cloudSyncStatus');

// 云同步拉取Gist
const cloudSyncPullBtn = document.getElementById('cloudSyncPullBtn');

// 移动端更多按钮弹出菜单逻辑
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenuDropdown = document.getElementById('mobile-menu-dropdown');

// 当前选中的标签（支持多选）
let selectedTags = [];

// 单篇笔记导出功能
const exportNoteBtn = document.getElementById('exportNoteBtn');

// 全部导入功能
const importAllBtn = document.getElementById('importAllBtn');

// 导入弹窗交互
const importModal = document.getElementById('importModal');
const importMdBtn = document.getElementById('importMdBtn');
const importFolderBtn = document.getElementById('importFolderBtn');
const importZipBtn = document.getElementById('importZipBtn');
const importModalCloseBtn = document.getElementById('importModalCloseBtn');

// ===== 统一初始化逻辑，合并侧栏初始状态设置 =====
window.addEventListener('DOMContentLoaded', function() {
    // 只在PC端移除drawer-collapsed，移动端不处理
    const sidebar = document.querySelector('.notes-list-panel');
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
    var cloudSyncBtnMobile = document.getElementById('cloudSyncBtnMobile');
    if (cloudSyncBtnMobile && cloudSyncBtn) {
        cloudSyncBtnMobile.addEventListener('click', function(e) {
            e.preventDefault();
            cloudSyncBtn.click();
        });
    }

    // 4. 移动端侧栏滑动手势
    let startX = 0;
    let startY = 0;
    let isTouching = false;
    const drawerCollapsedClass = 'drawer-collapsed';
    function isMobile() { return window.innerWidth <= 768; }
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
        if (deltaY > 80) return;
        if (startX < 40 && deltaX > 40 && sidebar && sidebar.classList.contains(drawerCollapsedClass)) {
            sidebar.classList.remove(drawerCollapsedClass);
        }
        if (startX > 180 && deltaX < -40 && sidebar && !sidebar.classList.contains(drawerCollapsedClass)) {
            sidebar.classList.add(drawerCollapsedClass);
        }
    }, {passive: true});

    // 5. 移动端小箭头点击
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

let searchKeyword = '';

// 初始化
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

// 从本地存储加载数据
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

// 保存数据到本地存储
function saveToLocalStorage() {
    localStorage.setItem('notesData', JSON.stringify(notesData));
}

// 渲染笔记列表
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

// 切换笔记
function switchNote(noteId) {
    notesData.currentNoteId = noteId;
    const note = notesData.notes[noteId];
    
    noteTitleEl.value = note.title || '';
    noteEditorEl.value = note.content || '';
    
    // 渲染Markdown预览
    renderMarkdown(note.content || '');
    
    // 确保处于预览模式
    noteEditorEl.style.display = 'none';
    notePreviewEl.style.display = 'block';
    editBtn.innerHTML = '<i class="fas fa-edit"></i><span class="btn-text"> 编辑笔记</span>';
    
    // 更新字数统计
    updateWordCount();
    
    // 重新渲染笔记列表以更新活动状态
    renderNotesList();
    
    // 如果历史版本面板是打开的，自动刷新为当前笔记的历史
    if (versionsPanelEl.classList.contains('active')) {
        showVersions();
    }
    
    saveToLocalStorage();
}

// 渲染Markdown内容
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

// 生成版本哈希
function generateVersionHash(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        hash = ((hash << 5) - hash) + content.charCodeAt(i);
        hash |= 0;
    }
    return 'v' + Math.abs(hash).toString(16).substring(0, 6);
}

// 比较版本差异
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

// 显示历史版本
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

// 完全重写showVersionDiff函数（支持切换显示/隐藏）
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

// 恢复历史版本
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

// 字数统计功能
function updateWordCount() {
    const content = noteEditorEl.value || '';
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const charCount = content.length;
    
    wordCountEl.textContent = `${wordCount} 字 ${charCount} 字符`;
}

// 显示Toast通知
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

// 设置事件监听器
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
        // 立即切换并保存
        switchNote(noteId);
        saveToLocalStorage();
        renderNotesList();
        // 让新笔记处于编辑状态
        noteEditorEl.style.display = 'block';
        notePreviewEl.style.display = 'none';
        editBtn.innerHTML = '<i class="fas fa-eye"></i><span class="btn-text"> 预览笔记</span>';
        noteTitleEl.focus();
    });
    
    // 编辑/预览切换
    editBtn.addEventListener('click', () => {
        if (noteEditorEl.style.display === 'none') {
            // 切换到编辑模式
            noteEditorEl.style.display = 'block';
            notePreviewEl.style.display = 'none';
            noteEditorEl.classList.add('editing');
            editBtn.innerHTML = '<i class="fas fa-eye"></i><span class="btn-text"> 预览笔记</span>';
        } else {
            // 切换回预览模式
            noteEditorEl.style.display = 'none';
            notePreviewEl.style.display = 'block';
            noteEditorEl.classList.remove('editing');
            editBtn.innerHTML = '<i class="fas fa-edit"></i><span class="btn-text"> 编辑笔记</span>';
            // 如果内容有变化，自动保存
            if (notesData.currentNoteId && 
                notesData.notes[notesData.currentNoteId].content !== noteEditorEl.value) {
                saveVersion();
            }
        }
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

// 启动应用
init();

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

// 解析 front matter，返回 {tags: [], ...}
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

// 获取所有标签（去重，按出现频率排序）
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

// 渲染标签列表到侧边栏
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

// 解析zip包批量导入
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

// 解析md文件批量导入
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

// 动态加载JS
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

// 恢复saveVersion函数，实现自动保存和新建版本
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
