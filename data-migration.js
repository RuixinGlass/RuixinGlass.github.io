// =====================
// 数据迁移工具 - 凤凰计划第一阶段
// =====================

class DataMigration {
    constructor() {
        this.atomicStorage = window.atomicStorage;
        this.legacyStorage = window.indexedDBStorage;
    }

    // ========== 迁移主流程 ==========
    async migrateToAtomicStructure() {
        console.log('🚀 开始数据迁移到原子化结构...');
        
        try {
            // 1. 备份现有数据
            const backup = await this.createBackup();
            console.log('✅ 备份创建成功');
            
            // 2. 读取旧数据
            const oldData = await this.loadLegacyData();
            console.log(`📊 读取旧数据: ${Object.keys(oldData.notes).length} 个笔记`);
            
            // 3. 转换为新结构
            const newNotes = this.convertToAtomicStructure(oldData);
            console.log(`🔄 数据转换完成: ${newNotes.length} 个笔记`);
            
            // 4. 写入新存储
            await this.writeToNewStorage(newNotes);
            console.log('💾 新存储写入完成');
            
            // 5. 验证迁移结果
            const isValid = await this.validateMigration(oldData, newNotes);
            
            if (isValid) {
                console.log('✅ 迁移验证成功');
                await this.cleanupLegacyData();
                console.log('🧹 旧数据清理完成');
                return true;
            } else {
                console.error('❌ 迁移验证失败');
                await this.rollbackMigration(backup);
                return false;
            }
            
        } catch (error) {
            console.error('❌ 迁移过程出错:', error);
            return false;
        }
    }

    // ========== 备份和回滚 ==========
    
    async createBackup() {
        // 如果没有旧存储系统，创建一个模拟备份
        if (!this.legacyStorage) {
            console.log('⚠️ 旧存储系统不可用，创建模拟备份');
            return {
                id: `mock_backup_${Date.now()}`,
                timestamp: new Date().toISOString(),
                data: { notes: {} }
            };
        }
        
        const backupId = `backup_migration_${Date.now()}`;
        const oldData = await this.legacyStorage.loadData();
        
        // 使用旧存储系统创建备份
        await this.legacyStorage.backupData(oldData);
        
        return {
            id: backupId,
            timestamp: new Date().toISOString(),
            data: oldData
        };
    }

    async rollbackMigration(backup) {
        console.log('🔄 开始回滚迁移...');
        
        try {
            // 清理新存储
            await this.cleanupNewStorage();
            
            // 恢复旧数据
            if (this.legacyStorage && backup.data) {
                await this.legacyStorage.saveData(backup.data);
                console.log('✅ 回滚完成');
            }
        } catch (error) {
            console.error('❌ 回滚失败:', error);
        }
    }

    // ========== 数据读取和转换 ==========
    
    async loadLegacyData() {
        if (!this.legacyStorage) {
            console.log('⚠️ 旧存储系统不可用，返回空数据');
            return { notes: {} };
        }
        
        return await this.legacyStorage.loadData();
    }

    convertToAtomicStructure(oldData) {
        const newNotes = [];
        
        for (const [noteId, note] of Object.entries(oldData.notes)) {
            // 转换笔记结构
            const atomicNote = {
                id: noteId,
                title: note.title || '未命名笔记',
                content: note.content || '',
                metadata: {
                    lastModified: note.lastModified || new Date().toISOString(),
                    version: 1,
                    tags: note.tags || [],
                    created: note.created || new Date().toISOString()
                }
            };
            
            newNotes.push(atomicNote);
            
            // 转换版本历史
            if (note.versions && Array.isArray(note.versions)) {
                note.versions.forEach((version, index) => {
                    const atomicVersion = {
                        id: `v_${noteId}_${index}`,
                        noteId: noteId,
                        content: version.content || '',
                        timestamp: version.timestamp || new Date().toISOString()
                    };
                    
                    // 将版本添加到新存储（异步）
                    this.atomicStorage.addVersion(noteId, atomicVersion).catch(error => {
                        console.error(`版本迁移失败: ${atomicVersion.id}`, error);
                    });
                });
            }
        }
        
        return newNotes;
    }

    // ========== 新存储操作 ==========
    
    async writeToNewStorage(newNotes) {
        console.log(`📝 开始写入 ${newNotes.length} 个笔记到新存储...`);
        
        for (let i = 0; i < newNotes.length; i++) {
            const note = newNotes[i];
            try {
                await this.atomicStorage.saveNote(note);
                
                // 显示进度
                if ((i + 1) % 10 === 0 || i === newNotes.length - 1) {
                    console.log(`📊 迁移进度: ${i + 1}/${newNotes.length}`);
                }
            } catch (error) {
                console.error(`❌ 笔记迁移失败: ${note.id}`, error);
                throw error;
            }
        }
    }

    async cleanupNewStorage() {
        console.log('🧹 清理新存储...');
        
        try {
            const db = await this.atomicStorage.init();
            
            // 清理笔记存储
            const notesTransaction = db.transaction([this.atomicStorage.stores.notes], 'readwrite');
            const notesStore = notesTransaction.objectStore(this.atomicStorage.stores.notes);
            await new Promise((resolve, reject) => {
                const request = notesStore.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            
            // 清理版本存储
            const versionsTransaction = db.transaction([this.atomicStorage.stores.versions], 'readwrite');
            const versionsStore = versionsTransaction.objectStore(this.atomicStorage.stores.versions);
            await new Promise((resolve, reject) => {
                const request = versionsStore.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            
            console.log('✅ 新存储清理完成');
        } catch (error) {
            console.error('❌ 新存储清理失败:', error);
        }
    }

    // ========== 验证和清理 ==========
    
    async validateMigration(oldData, newNotes) {
        console.log('🔍 开始验证迁移结果...');
        
        try {
            // 1. 检查笔记数量
            const newMetadata = await this.atomicStorage.getAllNoteMetadata();
            if (newMetadata.length !== Object.keys(oldData.notes).length) {
                console.error(`❌ 笔记数量不匹配: 旧数据 ${Object.keys(oldData.notes).length}, 新数据 ${newMetadata.length}`);
                return false;
            }
            
            // 2. 检查笔记内容
            for (const newNote of newNotes) {
                const oldNote = oldData.notes[newNote.id];
                if (!oldNote) {
                    console.error(`❌ 笔记丢失: ${newNote.id}`);
                    return false;
                }
                
                if (newNote.content !== oldNote.content) {
                    console.error(`❌ 笔记内容不匹配: ${newNote.id}`);
                    return false;
                }
            }
            
            console.log('✅ 迁移验证通过');
            return true;
            
        } catch (error) {
            console.error('❌ 验证过程出错:', error);
            return false;
        }
    }

    async cleanupLegacyData() {
        console.log('🧹 清理旧数据...');
        
        // 这里可以选择是否删除旧数据
        // 为了安全起见，我们暂时保留旧数据
        console.log('⚠️ 旧数据保留，如需清理请手动操作');
    }

    // ========== 迁移状态检查 ==========
    
    async checkMigrationStatus() {
        try {
            // 先检查新数据
            const newMetadata = await this.atomicStorage.getAllNoteMetadata();
            
            // 安全地检查旧数据
            let oldData = { notes: {} };
            try {
                oldData = await this.loadLegacyData();
            } catch (legacyError) {
                console.log('旧存储系统不可用:', legacyError.message);
                // 旧存储系统不可用是正常的，不抛出错误
            }
            
            return {
                hasNewData: newMetadata.length > 0,
                hasOldData: Object.keys(oldData.notes).length > 0,
                newNotesCount: newMetadata.length,
                oldNotesCount: Object.keys(oldData.notes).length,
                needsMigration: Object.keys(oldData.notes).length > 0 && newMetadata.length === 0,
                error: oldData.notes.length === 0 ? '旧存储系统不可用' : null
            };
        } catch (error) {
            console.error('检查迁移状态失败:', error);
            return {
                hasNewData: false,
                hasOldData: false,
                newNotesCount: 0,
                oldNotesCount: 0,
                needsMigration: false,
                error: error.message
            };
        }
    }
}

// ========== 全局实例和工具函数 ==========

window.dataMigration = new DataMigration();

// 便捷的迁移函数
window.migrateToAtomicStructure = async function() {
    return await window.dataMigration.migrateToAtomicStructure();
};

// 检查迁移状态
window.checkMigrationStatus = async function() {
    return await window.dataMigration.checkMigrationStatus();
};

console.log('数据迁移工具加载完成 - 凤凰计划第一阶段');
