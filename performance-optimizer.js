// =====================
// 性能优化模块
// =====================

class PerformanceOptimizer {
    constructor() {
        this.virtualScroller = null;
        this.renderCache = new Map();
        this.debounceTimers = new Map();
        this.observer = null;
        this.performanceMetrics = {
            renderTime: 0,
            memoryUsage: 0,
            domOperations: 0
        };
    }

    // 虚拟滚动优化
    initVirtualScroller(container, itemHeight = 60) {
        this.virtualScroller = {
            container,
            itemHeight,
            visibleItems: Math.ceil(container.clientHeight / itemHeight) + 2,
            scrollTop: 0,
            totalItems: 0,
            startIndex: 0,
            endIndex: 0
        };
    }

    // 虚拟滚动渲染
    renderVirtualList(items, renderItem) {
        if (!this.virtualScroller) return;

        const startTime = performance.now();
        const { container, itemHeight, visibleItems, scrollTop } = this.virtualScroller;
        
        // 计算可见范围
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + visibleItems, items.length);
        
        // 更新容器高度
        container.style.height = `${items.length * itemHeight}px`;
        
        // 清空容器
        container.innerHTML = '';
        
        // 只渲染可见项
        for (let i = startIndex; i < endIndex; i++) {
            const item = items[i];
            const element = renderItem(item, i);
            element.style.position = 'absolute';
            element.style.top = `${i * itemHeight}px`;
            element.style.height = `${itemHeight}px`;
            container.appendChild(element);
        }
        
        this.performanceMetrics.renderTime = performance.now() - startTime;
        this.performanceMetrics.domOperations = endIndex - startIndex;
    }

    // 渲染缓存
    cacheRender(key, renderFunction) {
        if (this.renderCache.has(key)) {
            return this.renderCache.get(key);
        }
        
        const result = renderFunction();
        this.renderCache.set(key, result);
        return result;
    }

    // 防抖优化
    debounce(key, func, delay = 300) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }
        
        const timer = setTimeout(() => {
            func();
            this.debounceTimers.delete(key);
        }, delay);
        
        this.debounceTimers.set(key, timer);
    }

    // 节流优化
    throttle(key, func, limit = 100) {
        if (this.debounceTimers.has(key)) {
            return;
        }
        
        func();
        
        const timer = setTimeout(() => {
            this.debounceTimers.delete(key);
        }, limit);
        
        this.debounceTimers.set(key, timer);
    }

    // 懒加载优化
    initLazyLoading(selector, callback, options = {}) {
        const { rootMargin = '50px', threshold = 0.1 } = options;
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, { rootMargin, threshold });
        
        document.querySelectorAll(selector).forEach(el => {
            this.observer.observe(el);
        });
    }

    // 内存优化
    optimizeMemory() {
        // 清理渲染缓存
        if (this.renderCache.size > 100) {
            const keys = Array.from(this.renderCache.keys());
            keys.slice(0, 50).forEach(key => this.renderCache.delete(key));
        }
        
        // 清理防抖定时器
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        
        // 强制垃圾回收（如果支持）
        if (window.gc) {
            window.gc();
        }
    }

    // 性能监控
    startPerformanceMonitoring() {
        // 监控内存使用
        if ('memory' in performance) {
            setInterval(() => {
                this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
                this.logPerformanceMetrics();
            }, 5000);
        }
        
        // 监控长任务
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.duration > 50) {
                        console.warn('检测到长任务:', entry.name, entry.duration + 'ms');
                    }
                });
            });
            observer.observe({ entryTypes: ['longtask'] });
        }
    }

    // 记录性能指标
    logPerformanceMetrics() {
        console.log('性能指标:', {
            renderTime: this.performanceMetrics.renderTime.toFixed(2) + 'ms',
            memoryUsage: (this.performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2) + 'MB',
            domOperations: this.performanceMetrics.domOperations,
            cacheSize: this.renderCache.size
        });
    }

    // 清理资源
    cleanup() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        this.renderCache.clear();
    }
}

// 创建全局实例
window.performanceOptimizer = new PerformanceOptimizer();

// 优化的笔记列表渲染
function optimizedRenderNotesList() {
    const startTime = performance.now();
    
    // 获取过滤后的笔记
    let filteredNotes = Object.keys(notesData.notes);
    
    // 标签筛选
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
    
    // 使用虚拟滚动渲染
    if (filteredNotes.length > 50) {
        // 大数据量使用虚拟滚动
        if (!window.performanceOptimizer.virtualScroller) {
            window.performanceOptimizer.initVirtualScroller(notesListEl, 60);
        }
        
        window.performanceOptimizer.renderVirtualList(filteredNotes, (noteId, index) => {
            const note = notesData.notes[noteId];
            const li = document.createElement('li');
            li.className = noteId === notesData.currentNoteId ? 'active' : '';
            li.dataset.noteId = noteId;
            
            // 使用 DocumentFragment 优化 DOM 操作
            const fragment = document.createDocumentFragment();
            fragment.appendChild(li);
            
            li.innerHTML = `
                <div class="note-item-content">
                    <div class="note-title">${note.title || '未命名笔记'}</div>
                    <div class="note-meta">
                        <span class="note-date">${new Date(note.lastModified || Date.now()).toLocaleDateString()}</span>
                        <span class="note-version-count">${note.versions ? note.versions.length : 0} 版本</span>
                    </div>
                </div>
            `;
            
            // 事件委托优化
            li.addEventListener('click', handleNoteClick);
            
            return li;
        });
    } else {
        // 小数据量使用传统渲染
        notesListEl.innerHTML = '';
        
        if (filteredNotes.length === 0) {
            const li = document.createElement('li');
            li.className = 'empty-state';
            li.innerHTML = '<span>未找到相关笔记</span>';
            notesListEl.appendChild(li);
            renderTagsList();
            return;
        }
        
        // 使用 DocumentFragment 批量操作
        const fragment = document.createDocumentFragment();
        
        filteredNotes.forEach(noteId => {
            const note = notesData.notes[noteId];
            const li = document.createElement('li');
            li.className = noteId === notesData.currentNoteId ? 'active' : '';
            li.dataset.noteId = noteId;
            
            li.innerHTML = `
                <div class="note-item-content">
                    <div class="note-title">${note.title || '未命名笔记'}</div>
                    <div class="note-meta">
                        <span class="note-date">${new Date(note.lastModified || Date.now()).toLocaleDateString()}</span>
                        <span class="note-version-count">${note.versions ? note.versions.length : 0} 版本</span>
                    </div>
                </div>
            `;
            
            // 事件委托优化
            li.addEventListener('click', handleNoteClick);
            
            fragment.appendChild(li);
        });
        
        notesListEl.appendChild(fragment);
    }
    
    renderTagsList();
    
    const renderTime = performance.now() - startTime;
    console.log(`笔记列表渲染完成，耗时: ${renderTime.toFixed(2)}ms，笔记数量: ${filteredNotes.length}`);
}

// 事件委托处理
function handleNoteClick(event) {
    const noteId = event.currentTarget.dataset.noteId;
    if (notesData.currentNoteId !== noteId) {
        const contentArea = document.querySelector('.content-area');
        if (contentArea && contentArea.classList.contains('editing-mode')) {
            // 异步保存，但不等待完成（避免阻塞UI）
            saveVersion().catch(error => {
                console.error('性能优化模块中切换笔记时自动保存失败:', error);
            });
        }
        switchNote(noteId);
    }
}

// 优化的 Markdown 渲染
function optimizedRenderMarkdown(content) {
    const cacheKey = `markdown_${content.length}_${content.slice(0, 50)}`;
    
    return window.performanceOptimizer.cacheRender(cacheKey, () => {
        const startTime = performance.now();
        
        // 检查并处理 front matter
        content = content.replace(
            /^---[\s\S]*?---/,
            match => `<div class="front-matter">${match.replace(/---/g, '').trim()}</div>`
        );
        
        // Markdown 渲染
        let html = marked.parse(content);
        html = DOMPurify.sanitize(html);
        
        // 延迟 MathJax 渲染
        if (window.MathJax && window.MathJax.typesetPromise) {
            setTimeout(() => {
                MathJax.typesetPromise([notePreviewEl]);
            }, 0);
        }
        
        const renderTime = performance.now() - startTime;
        console.log(`Markdown 渲染完成，耗时: ${renderTime.toFixed(2)}ms`);
        
        return html;
    });
}

// 初始化性能优化
function initPerformanceOptimization() {
    // 启动性能监控
    window.performanceOptimizer.startPerformanceMonitoring();
    
    // 定期内存优化
    setInterval(() => {
        window.performanceOptimizer.optimizeMemory();
    }, 30000);
    
    // 页面卸载时清理
    window.addEventListener('beforeunload', () => {
        window.performanceOptimizer.cleanup();
    });
    
    console.log('性能优化模块初始化完成');
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceOptimizer, optimizedRenderNotesList, optimizedRenderMarkdown };
}
