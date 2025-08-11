// =====================
// 高性能 IndexedDB 存储模块
// =====================

class IndexedDBStorage {
    constructor() {
        this.dbName = 'NotesAppDB';
        this.dbVersion = 1;
        this.storeName = 'notes';
        this.db = null;
        this.isInitialized = false;
    }

    // 初始化数据库
    async init() {
        if (this.isInitialized) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('IndexedDB 打开失败:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                console.log('IndexedDB 初始化成功');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 创建对象存储
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    
                    // 创建索引以提高查询性能
                    store.createIndex('title', 'title', { unique: false });
                    store.createIndex('lastModified', 'lastModified', { unique: false });
                    store.createIndex('tags', 'tags', { unique: false });
                    
                    console.log('IndexedDB 对象存储创建成功');
                }
            };
        });
    }

    // 保存数据
    async saveData(data) {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            // 保存主数据
            const mainData = {
                id: 'main',
                data: data,
                timestamp: new Date().toISOString(),
                version: '2.0'
            };
            
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
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
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
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const backupData = {
                id: 'backup_' + Date.now(),
                data: data,
                timestamp: new Date().toISOString(),
                version: '2.0'
            };
            
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
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
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
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
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
            // 按时间排序，删除最旧的备份
            backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const toDelete = backups.slice(10);
            
            await this.init();
            
            for (const backup of toDelete) {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                store.delete(backup.id);
            }
            
            console.log(`清理了 ${toDelete.length} 个旧备份`);
        }
    }

    // 获取存储统计信息
    async getStorageInfo() {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                const allData = request.result;
                const mainData = allData.find(item => item.id === 'main');
                const backups = allData.filter(item => item.id.startsWith('backup_'));
                
                const info = {
                    totalItems: allData.length,
                    backupCount: backups.length,
                    mainDataSize: mainData ? JSON.stringify(mainData.data).length : 0,
                    lastBackup: backups.length > 0 ? 
                        new Date(Math.max(...backups.map(b => new Date(b.timestamp)))) : null
                };
                
                resolve(info);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // 导出数据
    async exportData() {
        const data = await this.loadData();
        const backups = await this.getAllBackups();
        
        return {
            mainData: data,
            backups: backups,
            exportTime: new Date().toISOString(),
            version: '2.0'
        };
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
            const request = indexedDB.deleteDatabase(this.dbName);
            
            request.onsuccess = () => {
                this.db = null;
                this.isInitialized = false;
                console.log('IndexedDB 数据库删除成功');
                resolve(true);
            };
            
            request.onerror = () => {
                console.error('IndexedDB 数据库删除失败:', request.error);
                reject(request.error);
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
