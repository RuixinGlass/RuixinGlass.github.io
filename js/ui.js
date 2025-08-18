/**
 * UI渲染器
 * 负责所有界面渲染和更新操作
 * 
 * @description 此模块负责所有UI渲染和更新操作
 * @author 简·记项目组
 * @version 1.0.0
 */

// 导入依赖模块
import * as dom from './dom.js';
import { getNotesData, getSelectedTags, getSearchKeyword, getSessionState, getCmEditor, getCurrentNoteId, setCurrentNoteId } from './state.js';
import { parseFrontMatter, isMobile } from './utils.js';
// 移除业务逻辑导入，UI模块只负责渲染

/**
 * 渲染笔记列表
 */
export function renderNotesList() {
    dom.notesListEl.innerHTML = '';
    
    const notesData = getNotesData();
    const selectedTags = getSelectedTags();
    const searchKeyword = getSearchKeyword();
    
    // 标签筛选
    let filteredNotes = Object.keys(notesData.notes);
    if (selectedTags.length > 0) {
        filteredNotes = filteredNotes.filter(noteId => {
            const note = notesData.notes[noteId];
            // ✅ 【修复】使用对象解构直接获取 frontMatter
            const { frontMatter } = parseFrontMatter(note.content);
            if (!frontMatter.tags || !Array.isArray(frontMatter.tags)) return false;
            return selectedTags.every(tag => frontMatter.tags.includes(tag));
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
        dom.notesListEl.appendChild(li);
        renderTagsList();
        return;
    }
    
            filteredNotes.forEach(noteId => {
            const note = notesData.notes[noteId];
            const li = document.createElement('li');
            li.className = noteId === notesData.currentNoteId ? 'active' : '';
            
            // ✅ 【新增】检查是否存在编辑会话
            const hasSession = !!getSessionState(noteId);
            const sessionClass = hasSession ? 'has-session' : '';

            // ✅ 【修改】在 class 中加入 sessionClass
            li.innerHTML = `
                <div class="note-item-content ${sessionClass}">
                    <div class="note-title">${note.title || '未命名笔记'}</div>
                    <div class="note-meta">
                        <span class="note-date">${new Date(note.lastModified || Date.now()).toLocaleDateString()}</span>
                        <span class="note-version-count">${note.versions ? note.versions.length : 0} 版本</span>
                    </div>
                </div>
            `;
            li.dataset.noteId = noteId;
        
        // ✅ 移除事件绑定，由 events.js 统一处理
        
        // 删除按钮
        const delBtn = document.createElement('button');
        delBtn.className = 'note-delete-btn';
        delBtn.title = '删除笔记';
        delBtn.innerHTML = '<i class="fas fa-trash"></i>';
        // ✅ 移除事件绑定，由 events.js 统一处理
        li.appendChild(delBtn);
        dom.notesListEl.appendChild(li);
    });
    
    renderTagsList();
}

/**
 * 渲染标签列表
 */
export function renderTagsList() {
    if (!dom.tagsListEl) return;
    
    const tags = getAllTags();
    dom.tagsListEl.innerHTML = '';
    
    if (tags.length === 0) {
        dom.tagsListEl.style.display = 'none';
        return;
    }
    
    dom.tagsListEl.style.display = '';
    const selectedTags = getSelectedTags();
    
    tags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag-item' + (selectedTags.includes(tag) ? ' selected' : '');
        tagEl.textContent = tag;
        // ✅ 移除事件绑定，由 events.js 统一处理
        dom.tagsListEl.appendChild(tagEl);
    });
}

/**
 * 获取所有标签
 */
function getAllTags() {
    const notesData = getNotesData();
    const tagCount = {};
    
    for (const noteId in notesData.notes) {
        const note = notesData.notes[noteId];
        
        // ✅ 【修复】使用对象解构直接获取 frontMatter
        const { frontMatter } = parseFrontMatter(note.content); 
        
        // ✅ 【修复】现在可以正确地从 frontMatter 中访问 tags
        if (frontMatter.tags && Array.isArray(frontMatter.tags)) {
            frontMatter.tags.forEach(tag => {
                // 将所有 tag 转换为字符串以避免潜在问题
                const tagStr = String(tag).trim();
                if (!tagStr) return;
                tagCount[tagStr] = (tagCount[tagStr] || 0) + 1;
            });
        }
    }
    
    // 按出现频率降序
    return Object.keys(tagCount).sort((a, b) => tagCount[b] - tagCount[a]);
}

/**
 * 渲染Markdown内容
 */
export function renderMarkdown(content) {
    try {
        let rawContent = content || '';

        // ✅ 【核心修复】恢复识别 front matter 并为其包裹特殊 div 的逻辑
        rawContent = rawContent.replace(
            /^---([\s\S]*?)---/,
            (match) => {
                // 将匹配到的内容（包括---）包裹起来，并移除前后的 ---
                const innerContent = match.replace(/---/g, '').trim();
                return `<div class="front-matter">${innerContent}</div>`;
            }
        );

        const html = marked.parse(rawContent);
        const cleanHtml = DOMPurify.sanitize(html);
        dom.notePreviewEl.innerHTML = cleanHtml;
    } catch (error) {
        console.error('Markdown渲染失败:', error);
        dom.notePreviewEl.innerHTML = '<div class="error">内容渲染失败</div>';
    }
}

/**
 * 更新字数统计
 */
export function updateWordCount() {
    const cmEditor = getCmEditor(); // 尝试获取当前激活的编辑器实例
    let content = '';

    // ✅ 【核心修复】如果编辑器存在（即处于编辑模式），则直接从编辑器获取实时内容
    if (cmEditor) {
        content = cmEditor.getValue();
    } 
    // 否则（处于预览模式或无笔记状态），从数据模型中获取已保存的内容
    else {
        const notesData = getNotesData();
        const currentNoteId = notesData.currentNoteId;
        if (currentNoteId && notesData.notes[currentNoteId]) {
            const note = notesData.notes[currentNoteId];
            content = note.content || '';
        }
    }
    
    // 统计逻辑保持不变
    const charCount = content.replace(/\s/g, '').length;
    if (dom.wordCountEl) {
        dom.wordCountEl.textContent = `${charCount} 字`;
    }
}

/**
 * 更新侧边栏激活状态
 */
export function updateSidebarActiveState(noteId) {
    // 移除所有激活状态
    const allItems = dom.notesListEl.querySelectorAll('li');
    allItems.forEach(item => item.classList.remove('active'));
    
    // 添加当前激活状态
    const currentItem = dom.notesListEl.querySelector(`[data-note-id="${noteId}"]`);
    if (currentItem) {
        currentItem.classList.add('active');
    }
}

/**
 * 显示版本历史
 */
export function showVersions() {
    const notesData = getNotesData();
    const currentNoteId = notesData.currentNoteId;

    if (!currentNoteId || !notesData.notes[currentNoteId]) {
        showToast('没有可显示的版本历史', 'warning');
        return;
    }

    const note = notesData.notes[currentNoteId];
    const versions = note.versions || [];

    dom.versionsListEl.innerHTML = '';

    if (versions.length === 0) {
        dom.versionsListEl.innerHTML = '<li class="empty-state">暂无版本历史</li>';
    } else {
        versions.forEach((version, index) => {
            const li = document.createElement('li');
            li.className = 'version-item'; // ✅ 使用正确的样式类
            li.dataset.index = index; // ✅ 【新增】添加索引属性
            
            // ✅ 【核心修复】恢复旧版的分行布局HTML结构
            li.innerHTML = `
                <div class="version-hash">
                    <i class="fas fa-code-branch"></i> ${version.hash || 'N/A'}
                </div>
                <div class="version-message">
                    ${version.message || '自动保存'}
                </div>
                <div class="version-meta">
                    <span class="version-date">${new Date(version.timestamp).toLocaleString()}</span>
                    <div class="version-actions">
                        <span class="version-diff" data-index="${index}">
                            <i class="fas fa-eye"></i> 查看差异
                        </span>
                        <span class="version-restore" data-index="${index}">
                            <i class="fas fa-undo"></i> 恢复
                        </span>
                        <span class="version-delete" data-index="${index}">
                             <i class="fas fa-trash"></i>
                        </span>
                    </div>
                </div>
            `;
            dom.versionsListEl.appendChild(li);
        });
    }

    dom.versionsPanelEl.classList.add('active');
}

/**
 * 隐藏版本历史
 */
export function hideVersions() {
    if (dom.versionsPanelEl) {
        dom.versionsPanelEl.classList.remove('active');
        // ✅ 【Bug #5 & #6 修复】关闭主面板时，确保移除所有已打开的 diff 子面板
        const openDiffs = dom.versionsPanelEl.querySelectorAll('.diff-panel');
        openDiffs.forEach(panel => panel.remove());
    }
}

/**
 * 显示云同步状态
 */
export function showCloudSyncStatus(message, type = 'info') {
    if (dom.cloudSyncStatus) {
        dom.cloudSyncStatus.textContent = message;
        dom.cloudSyncStatus.className = `cloud-sync-status ${type}`;
    }
}

/**
 * 隐藏云同步状态
 */
export function hideCloudSyncStatus() {
    if (dom.cloudSyncStatus) {
        dom.cloudSyncStatus.textContent = '';
        dom.cloudSyncStatus.className = 'cloud-sync-status';
    }
}

/**
 * 更新编辑/预览按钮的状态
 * @param {boolean} isEditing - 当前是否处于编辑模式
 */
export function updateEditButton(isEditing) {
    if (!dom.editBtn) return;
    
    if (isEditing) {
        dom.editBtn.innerHTML = '<i class="fas fa-eye"></i><span class="btn-text"> 预览笔记</span>';
    } else {
        dom.editBtn.innerHTML = '<i class="fas fa-edit"></i><span class="btn-text"> 编辑笔记</span>';
    }
}

/**
 * 渲染版本差异面板，带行号，显示全篇内容
 * @param {string} newContent - 新版本内容
 * @param {string} oldContent - 旧版本内容
 * @param {number} versionIndex - 版本索引，用于定位
 */
export function renderDiffPanel(newContent, oldContent, versionIndex) {
    const versionItemEl = dom.versionsListEl.querySelector(`[data-index='${versionIndex}']`);
    if (!versionItemEl) return;

    // 实现toggle效果
    const existingPanel = versionItemEl.querySelector('.diff-panel');
    if (existingPanel) {
        existingPanel.remove();
        return;
    }

    const diffPanel = document.createElement('div');
    diffPanel.className = 'diff-panel active';

    // ✅ 使用改进的差异比较逻辑，显示全篇内容
    const diff = diffVersions(oldContent || '', newContent || '');
    let diffHtml = '';
    
    // 检查是否所有行都是未改动的
    const hasChanges = diff.some(item => item.type === 'added' || item.type === 'removed');
    if (!hasChanges) {
        diffPanel.innerHTML = '<div class="no-diff" style="text-align:center; color: #888; padding: 1em 0;">内容无变化</div>';
        versionItemEl.appendChild(diffPanel);
        return;
    }

    diff.forEach(item => {
        // ✅ 关键修改：为每一种类型的行都生成HTML
        if (item.type === 'added') {
            // 新增的行
            diffHtml += `<div class="diff-added">+ ${item.line || '&nbsp;'}</div>`;
        } else if (item.type === 'removed') {
            // 删除的行
            diffHtml += `<div class="diff-removed">- ${item.line || '&nbsp;'}</div>`;
        } else {
            // 未改动的行（上下文）
            diffHtml += `<div class="diff-context">  ${item.line || '&nbsp;'}</div>`;
        }
    });
    
    diffPanel.innerHTML = diffHtml;
    versionItemEl.appendChild(diffPanel);
}

/**
 * 版本差异比较函数（从原始app.js移植）
 * @param {string} oldContent - 旧版本内容
 * @param {string} newContent - 新版本内容
 * @returns {Array} 差异数组
 */
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

/**
 * 统一的场景切换函数
 * @param {string} scene - 场景名称 ('welcome' | 'note')
 */
export function switchScene(scene) {
    const mainWrapper = dom.mainWrapper;
    if (!mainWrapper) return;

    mainWrapper.classList.remove('welcome-mode');

    if (scene === 'welcome') {
        mainWrapper.classList.add('welcome-mode');
    }
    // 当 scene 不是 'welcome' 时，我们默认进入笔记查看/编辑场景，
    // CSS 会自动隐藏欢迎页，显示笔记头部和内容区。
}

/**
 * @function initializeUI
 * @description 统一的UI初始化函数，负责在应用启动时设置所有UI相关的初始状态。
 * - 配置Markdown解析器
 * - 根据设备类型设置侧边栏状态
 * - 决定并渲染初始视图（欢迎页或笔记页）
 */
export function initializeUI() {
    // 1. 配置 Markdown 解析器
    if (window.marked) {
        marked.setOptions({
            breaks: true, // 将单次回车渲染为 <br>
            gfm: true     // 启用GitHub风格的Markdown
        });
    }

    // 2. 设置侧边栏的初始状态
    if (dom.notesListPanel) {
        console.log('🔧 开始设置侧边栏初始状态...');
        console.log('📱 设备类型检测:', isMobile() ? '移动端' : 'PC端');
        
        if (isMobile()) {
            console.log('📱 移动端：设置侧边栏为收起状态');
            setSidebarState(true); // 移动端默认收起
        } else {
            console.log('💻 PC端：设置侧边栏为展开状态');
            setSidebarState(false); // PC端默认展开
        }
        
        // 验证设置结果
        const isCollapsed = dom.notesListPanel.classList.contains('drawer-collapsed');
        console.log('✅ 侧边栏状态设置完成，当前状态:', isCollapsed ? '收起' : '展开');
    } else {
        console.warn('⚠️ 未找到侧边栏元素，跳过侧边栏状态设置');
    }

    // 3. 触发UI初始化完成事件，让业务模块决定下一步操作
    console.log('🔍 准备触发 uiInitialized 事件...');
    document.dispatchEvent(new CustomEvent('uiInitialized'));
    console.log('🔍 uiInitialized 事件已触发');

    // ✅ 【核心修复】在初始化UI的最后，调用函数来同步箭头的初始状态
    console.log('🔍 准备调用 updateSidebarToggleIcon...');
    updateSidebarToggleIcon();
    console.log('🔍 updateSidebarToggleIcon 调用完成');
    
    // ✅ 【新增】初始化字数统计（添加错误处理）
    console.log('🔍 准备调用 updateWordCount...');
    try {
        updateWordCount();
        console.log('🔍 updateWordCount 调用完成');
    } catch (error) {
        console.warn('⚠️ 初始化字数统计失败:', error);
        // 不抛出错误，让初始化流程继续
    }
    console.log('🔍 initializeUI 函数即将结束');
}

/**
 * 显示欢迎页面
 */
export function showWelcomePage() {
    switchScene('welcome');
    if (dom.fullscreenWelcome) {
        dom.fullscreenWelcome.innerHTML = `
            <div class="welcome-content">
                <div class="welcome-icon"><i class="fas fa-feather-alt"></i></div>
                <h1>开启你的创作之旅</h1>
                <p>点击任意位置，创建你的第一篇笔记</p>
            </div>
        `;
    }
}

/**
 * @function updateSidebarToggleIcon
 * @description 根据侧边栏的当前状态，同步更新PC和移动端切换箭头的方向。
 */
export function updateSidebarToggleIcon() {
    try {
        const notesListPanel = dom.notesListPanel;
        const pcDrawerHint = dom.pcDrawerHint;
        const mobileDrawerHint = dom.mobileDrawerHint;

        if (!notesListPanel) return;

        const isCollapsed = notesListPanel.classList.contains('drawer-collapsed');

        if (isCollapsed) {
            // 如果是收起的，箭头应该向右
            if (pcDrawerHint) pcDrawerHint.classList.remove('sidebar-open');
            if (mobileDrawerHint) mobileDrawerHint.classList.remove('sidebar-open');
        } else {
            // 如果是展开的，箭头应该向左
            if (pcDrawerHint) pcDrawerHint.classList.add('sidebar-open');
            if (mobileDrawerHint) mobileDrawerHint.classList.add('sidebar-open');
        }
    } catch (error) {
        console.warn('⚠️ updateSidebarToggleIcon 失败:', error);
        // 不抛出错误，让初始化流程继续
    }
}

/**
 * @function toggleSidebar
 * @description 切换侧边栏的展开/收起状态
 */
export function toggleSidebar() {
    const notesListPanel = dom.notesListPanel;
    if (!notesListPanel) return;

    notesListPanel.classList.toggle('drawer-collapsed');
    updateSidebarToggleIcon();
    console.log('侧边栏状态已切换');
}

/**
 * @function collapseSidebar
 * @description 收起侧边栏
 */
export function collapseSidebar() {
    const notesListPanel = dom.notesListPanel;
    if (!notesListPanel) return;

    notesListPanel.classList.add('drawer-collapsed');
    updateSidebarToggleIcon();
    console.log('侧边栏已收起');
}

/**
 * @function expandSidebar
 * @description 展开侧边栏
 */
export function expandSidebar() {
    const notesListPanel = dom.notesListPanel;
    if (!notesListPanel) return;

    notesListPanel.classList.remove('drawer-collapsed');
    updateSidebarToggleIcon();
    console.log('侧边栏已展开');
}

/**
 * @function setSidebarState
 * @description 设置侧边栏状态
 * @param {boolean} isCollapsed - 是否收起
 */
export function setSidebarState(isCollapsed) {
    const notesListPanel = dom.notesListPanel;
    if (!notesListPanel) return;

    if (isCollapsed) {
        collapseSidebar();
    } else {
        expandSidebar();
    }
}

/**
 * @function showModal
 * @description 显示模态框
 * @param {string} modalId - 模态框ID
 */
export function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

/**
 * @function hideModal
 * @description 隐藏模态框
 * @param {string} modalId - 模态框ID
 */
export function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * @function showCloudSyncModal
 * @description 显示云同步模态框
 */
export function showCloudSyncModal() {
    if (dom.cloudSyncModal) {
        dom.cloudSyncModal.classList.remove('hidden');
    }
}

/**
 * @function hideCloudSyncModal
 * @description 隐藏云同步模态框
 */
export function hideCloudSyncModal() {
    if (dom.cloudSyncModal) {
        dom.cloudSyncModal.classList.add('hidden');
    }
}

/**
 * @function showImportModal
 * @description 显示导入模态框
 */
export function showImportModal() {
    if (dom.importModal) {
        dom.importModal.classList.remove('hidden');
    }
}

/**
 * @function hideImportModal
 * @description 隐藏导入模态框
 */
export function hideImportModal() {
    if (dom.importModal) {
        dom.importModal.classList.add('hidden');
    }
}


