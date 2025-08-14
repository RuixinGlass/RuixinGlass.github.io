// =====================
// 高性能 IndexedDB 存储模块 (已修复连接管理问题)
// =====================

class IndexedDBStorage {
    constructor() {
        this.dbName = 'NotesAppDB';
        this.dbVersion = 1;
        this.storeName = 'notes';
        this.db = null;
        this.initPromise = null; // 用于确保 init() 只执行一次
    }

    // 初始化数据库（保证单例连接）
    init() {
        // 如果初始化承诺已存在，直接返回它，防止重复打开数据库
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise((resolve, reject) => {
            // 如果连接已存在且有效，直接解析
            if (this.db) {
                return resolve(this.db);
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('IndexedDB 打开失败:', request.error);
                this.initPromise = null; // 失败后允许重试
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB 初始化成功');

                // 监听意外关闭事件
                this.db.onclose = () => {
                    console.warn('IndexedDB 连接意外关闭');
                    this.db = null;
                    this.initPromise = null;
                };
                
                // 监听版本变化（例如在其他标签页升级了数据库）
                this.db.onversionchange = () => {
                    console.warn('IndexedDB 版本发生变化，即将关闭连接');
                    if (this.db) {
                        this.db.close();
                    }
                };

                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('title', 'title', { unique: false });
                    store.createIndex('lastModified', 'lastModified', { unique: false });
                    store.createIndex('tags', 'tags', { unique: false });
                    console.log('IndexedDB 对象存储创建成功');
                }
            };
        });

        return this.initPromise;
    }

    // 封装一个执行事务的私有方法
    async _executeTransaction(mode, action) {
        // 确保数据库已连接
        const db = await this.init();
        
        // 检查连接是否仍然有效
        if (!db || db.objectStoreNames.length === 0) {
            // 如果连接失效，强制重新初始化
            console.warn('检测到无效的数据库连接，正在尝试重新初始化...');
            this.db = null;
            this.initPromise = null;
            const newDb = await this.init();
            if (!newDb) {
                 throw new Error('无法重新建立数据库连接');
            }
        }
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.storeName], mode);
                const store = transaction.objectStore(this.storeName);
                action(store, resolve, reject);
            } catch (error) {
                 // 如果创建事务失败，很可能是因为连接已关闭
                console.error("创建事务失败:", error);
                // 尝试重新初始化并重试一次
                this.db = null;
                this.initPromise = null;
                this.init().then(() => {
                    const transaction = this.db.transaction([this.storeName], mode);
                    const store = transaction.objectStore(this.storeName);
                    action(store, resolve, reject);
                }).catch(reject);
            }
        });
    }

    // 保存数据
    async saveData(data) {
        return this._executeTransaction('readwrite', (store, resolve, reject) => {
            const mainData = { id: 'main', data, timestamp: new Date().toISOString(), version: '2.0' };
            const request = store.put(mainData);
            request.onsuccess = () => {
                console.log('IndexedDB 数据保存成功');
                resolve(true);
            };
            request.onerror = () => {
                console.error('IndexedDB 数据保存失败:', request.error);
                reject(request.error);
            };
        });
    }

    // 加载数据
    async loadData() {
        return this._executeTransaction('readonly', (store, resolve, reject) => {
            const request = store.get('main');
            request.onsuccess = () => {
                if (request.result) {
                    console.log('IndexedDB 数据加载成功');
                    resolve(request.result.data);
                } else {
                    console.log('IndexedDB 中无数据，返回空对象');
                    resolve({ currentNoteId: null, notes: {} });
                }
            };
            request.onerror = () => {
                console.error('IndexedDB 数据加载失败:', request.error);
                reject(request.error);
            };
        });
    }

    // 备份数据
    async backupData(data) {
        return this._executeTransaction('readwrite', (store, resolve, reject) => {
            const backupData = { id: 'backup_' + Date.now(), data, timestamp: new Date().toISOString(), version: '2.0' };
            const request = store.put(backupData);
            request.onsuccess = () => {
                console.log('IndexedDB 备份数据保存成功');
                resolve(true);
            };
            request.onerror = () => {
                console.error('IndexedDB 备份数据保存失败:', request.error);
                reject(request.error);
            };
        });
    }

    // 恢复备份数据
    async restoreBackup(backupId) {
        return this._executeTransaction('readonly', (store, resolve, reject) => {
            const request = store.get(backupId);
            request.onsuccess = () => {
                if (request.result) {
                    console.log('IndexedDB 备份数据恢复成功');
                    resolve(request.result.data);
                } else {
                    reject(new Error('备份数据不存在'));
                }
            };
            request.onerror = () => {
                console.error('IndexedDB 备份数据恢复失败:', request.error);
                reject(request.error);
            };
        });
    }

    // 获取所有备份
    async getAllBackups() {
        return this._executeTransaction('readonly', (store, resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const backups = request.result.filter(item => item.id.startsWith('backup_'));
                console.log(`找到 ${backups.length} 个备份`);
                resolve(backups);
            };
            request.onerror = () => {
                console.error('IndexedDB 获取备份失败:', request.error);
                reject(request.error);
            };
        });
    }

    // 清理旧备份（保留最近10个）
    async cleanupOldBackups() {
        const backups = await this.getAllBackups();
        if (backups.length > 10) {
            backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const toDelete = backups.slice(10);
            for (const backup of toDelete) {
                await this._executeTransaction('readwrite', (store, resolve) => {
                    store.delete(backup.id);
                    resolve();
                });
            }
            console.log(`清理了 ${toDelete.length} 个旧备份`);
        }
    }

    // 获取存储统计信息
    async getStorageInfo() {
        return this._executeTransaction('readonly', (store, resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const allData = request.result;
                const mainData = allData.find(item => item.id === 'main');
                const backups = allData.filter(item => item.id.startsWith('backup_'));
                const info = {
                    totalItems: allData.length,
                    backupCount: backups.length,
                    mainDataSize: mainData ? JSON.stringify(mainData.data).length : 0,
                    lastBackup: backups.length > 0 ? new Date(Math.max(...backups.map(b => new Date(b.timestamp)))) : null
                };
                resolve(info);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // 导出数据
    async exportData() {
        const data = await this.loadData();
        const backups = await this.getAllBackups();
        return { mainData: data, backups: backups, exportTime: new Date().toISOString(), version: '2.0' };
    }

    // 导入数据
    async importData(importData) {
        if (importData.mainData) {
            await this.saveData(importData.mainData);
        }
        if (importData.backups && Array.isArray(importData.backups)) {
            for (const backup of importData.backups) {
                await this.backupData(backup.data);
            }
        }
        console.log('IndexedDB 数据导入成功');
    }

    // 删除数据库（重置）
    async deleteDatabase() {
        return new Promise((resolve, reject) => {
            // 先关闭现有连接
            if(this.db) {
                this.db.close();
                this.db = null;
                this.initPromise = null;
            }
            const request = indexedDB.deleteDatabase(this.dbName);
            request.onsuccess = () => {
                console.log('IndexedDB 数据库删除成功');
                resolve(true);
            };
            request.onerror = () => {
                console.error('IndexedDB 数据库删除失败:', request.error);
                reject(request.error);
            };
            request.onblocked = () => {
                 console.error('IndexedDB 数据库删除被阻止');
                 reject(new Error('数据库删除被阻止，请关闭其他标签页后重试'));
            };
        });
    }
}

// 创建全局实例
window.indexedDBStorage = new IndexedDBStorage();

// 兼容性检查
function checkIndexedDBSupport() {
    if (!window.indexedDB) {
        console.warn('浏览器不支持 IndexedDB，将回退到 localStorage');
        return false;
    }
    return true;
}

// 渐进式迁移：从 localStorage 迁移到 IndexedDB
async function migrateFromLocalStorage() {
    if (!checkIndexedDBSupport()) {
        return false;
    }
    
    try {
        const savedData = localStorage.getItem('notesData');
        if (savedData) {
            const data = JSON.parse(savedData);
            await window.indexedDBStorage.saveData(data);
            console.log('数据从 localStorage 迁移到 IndexedDB 成功');
            
            // 在这里添加清理操作
            localStorage.removeItem('notesData');
            console.log('已从 localStorage 移除旧数据，防止数据污染');
            
            return true;
        }
    } catch (error) {
        console.error('数据迁移失败:', error);
    }
    
    return false;
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { IndexedDBStorage, migrateFromLocalStorage, checkIndexedDBSupport };
}
