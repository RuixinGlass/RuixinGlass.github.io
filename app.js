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
const saveVersionBtn = document.getElementById('saveVersionBtn');
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
    editBtn.innerHTML = '<i class="fas fa-edit"></i> 编辑笔记';
    
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
    // 过滤笔记
    const filteredNotes = Object.keys(notesData.notes).filter(noteId => {
        const note = notesData.notes[noteId];
        if (!searchKeyword) return true;
        const kw = searchKeyword.toLowerCase();
        return (
            (note.title && note.title.toLowerCase().includes(kw)) ||
            (note.content && note.content.toLowerCase().includes(kw))
        );
    });
    if (filteredNotes.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-state';
        li.innerHTML = '<span>未找到相关笔记</span>';
        notesListEl.appendChild(li);
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
                        notePreviewEl.innerHTML = '<div class="empty-state"><h3><i class="fas fa-book-open"></i> 欢迎使用笔记系统</h3><p>点击左侧的"新建笔记"按钮开始记录你的想法</p></div>';
                    }
                }
                saveToLocalStorage();
                renderNotesList();
            }
        };
        li.appendChild(delBtn);
        notesListEl.appendChild(li);
    });
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
    editBtn.innerHTML = '<i class="fas fa-edit"></i> 编辑笔记';
    
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

// 保存当前笔记的版本
function saveVersion() {
    if (!notesData.currentNoteId) return;
    
    const note = notesData.notes[notesData.currentNoteId];
    const currentContent = noteEditorEl.value;
    
    // 生成版本信息
    const version = {
        hash: generateVersionHash(currentContent),
        timestamp: new Date().toISOString(),
        content: currentContent,
        message: prompt('请输入本次修改的备注：') || '无备注',
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
    showToast('版本已保存');
    
    // 切换到预览模式
    noteEditorEl.style.display = 'none';
    notePreviewEl.style.display = 'block';
    editBtn.innerHTML = '<i class="fas fa-edit"></i> 编辑笔记';
    
    saveToLocalStorage();
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
    editBtn.textContent = '编辑笔记';
    
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
        const newNote = {
            title: '新笔记',
            content: '# 新笔记\n\n开始记录你的想法吧！',
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
    editBtn.innerHTML = '<i class="fas fa-eye"></i> 预览笔记';
    noteTitleEl.focus();
    });
    
    // 编辑/预览切换
    editBtn.addEventListener('click', () => {
        if (noteEditorEl.style.display === 'none') {
            // 切换到编辑模式
            noteEditorEl.style.display = 'block';
            notePreviewEl.style.display = 'none';
            editBtn.innerHTML = '<i class="fas fa-eye"></i> 预览笔记';
        } else {
            // 切换回预览模式
            noteEditorEl.style.display = 'none';
            notePreviewEl.style.display = 'block';
            editBtn.innerHTML = '<i class="fas fa-edit"></i> 编辑笔记';
            
            // 如果内容有变化，自动保存
            if (notesData.currentNoteId && 
                notesData.notes[notesData.currentNoteId].content !== noteEditorEl.value) {
                saveVersion();
            }
        }
    });
    
    // 实时字数统计
    noteEditorEl.addEventListener('input', updateWordCount);
    
    // 保存版本
    saveVersionBtn.addEventListener('click', saveVersion);
    
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