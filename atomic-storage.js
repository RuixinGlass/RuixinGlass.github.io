// =====================
// 原子化存储模块 - 凤凰计划第一阶段核心
// =====================

class AtomicStorage {
    constructor() {
        this.dbName = 'AtomicNotesDB';
        this.dbVersion = 1;
        this.db = null;
        this.initPromise = null;
        
        // 新的对象存储结构
        this.stores = {
            notes: 'notes',           // 笔记主数据
            versions: 'versions',     // 版本历史
            metadata: 'metadata'      // 元数据
        };
    }

    // 初始化数据库
    async init() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise((resolve, reject) => {
            if (this.db) {
                return resolve(this.db);
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('原子化存储数据库打开失败:', request.error);
                this.initPromise = null;
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('原子化存储数据库初始化成功');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 创建笔记存储
                if (!db.objectStoreNames.contains(this.stores.notes)) {
                    const notesStore = db.createObjectStore(this.stores.notes, { keyPath: 'id' });
                    notesStore.createIndex('title', 'title', { unique: false });
                    notesStore.createIndex('lastModified', 'metadata.lastModified', { unique: false });
                    console.log('笔记存储创建成功');
                }

                // 创建版本存储
                if (!db.objectStoreNames.contains(this.stores.versions)) {
                    const versionsStore = db.createObjectStore(this.stores.versions, { keyPath: 'id' });
                    versionsStore.createIndex('noteId', 'noteId', { unique: false });
                    versionsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    console.log('版本存储创建成功');
                }
            };
        });

        return this.initPromise;
    }

    // 获取单篇笔记
    async getNote(noteId) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.stores.notes], 'readonly');
            const store = transaction.objectStore(this.stores.notes);
            const request = store.get(noteId);
            
            request.onsuccess = () => {
                if (request.result) {
                    console.log(`获取笔记成功: ${noteId}`);
                    resolve(request.result);
                } else {
                    reject(new Error(`笔记不存在: ${noteId}`));
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    // 保存单篇笔记
    async saveNote(noteObject) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const note = {
                id: noteObject.id,
                title: noteObject.title || '未命名笔记',
                content: noteObject.content || '',
                metadata: {
                    lastModified: new Date().toISOString(),
                    version: (noteObject.metadata?.version || 0) + 1,
                    tags: noteObject.metadata?.tags || []
                }
            };

            const transaction = db.transaction([this.stores.notes], 'readwrite');
            const store = transaction.objectStore(this.stores.notes);
            const request = store.put(note);
            
            request.onsuccess = () => {
                console.log(`保存笔记成功: ${note.id}`);
                resolve(note);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // 获取所有笔记元数据
    async getAllNoteMetadata() {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.stores.notes], 'readonly');
            const store = transaction.objectStore(this.stores.notes);
            const request = store.getAll();
            
            request.onsuccess = () => {
                const notes = request.result;
                const metadata = notes.map(note => ({
                    id: note.id,
                    title: note.title,
                    metadata: note.metadata
                }));
                console.log(`获取元数据成功: ${metadata.length} 个笔记`);
                resolve(metadata);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // 添加版本
    async addVersion(noteId, versionData) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const version = {
                id: `v_${noteId}_${Date.now()}`,
                noteId: noteId,
                content: versionData.content,
                timestamp: new Date().toISOString()
            };

            const transaction = db.transaction([this.stores.versions], 'readwrite');
            const store = transaction.objectStore(this.stores.versions);
            const request = store.put(version);
            
            request.onsuccess = () => {
                console.log(`添加版本成功: ${version.id}`);
                resolve(version);
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    // 删除笔记及其所有版本
    async deleteNote(noteId) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.stores.notes, this.stores.versions], 'readwrite');
            const notesStore = transaction.objectStore(this.stores.notes);
            const versionsStore = transaction.objectStore(this.stores.versions);
            
            // 删除笔记
            const noteRequest = notesStore.delete(noteId);
            
            // 删除该笔记的所有版本
            const versionsRequest = versionsStore.openCursor();
            const versionsToDelete = [];
            
            versionsRequest.onsuccess = () => {
                const cursor = versionsRequest.result;
                if (cursor) {
                    if (cursor.value.noteId === noteId) {
                        versionsToDelete.push(cursor.value.id);
                    }
                    cursor.continue();
                } else {
                    // 删除所有相关版本
                    versionsToDelete.forEach(versionId => {
                        versionsStore.delete(versionId);
                    });
                }
            };
            
            noteRequest.onsuccess = () => {
                console.log(`删除笔记成功: ${noteId}`);
                resolve();
            };
            noteRequest.onerror = () => reject(noteRequest.error);
        });
    }
}

// 全局实例
window.atomicStorage = new AtomicStorage();

console.log('原子化存储模块加载完成 - 凤凰计划第一阶段');
