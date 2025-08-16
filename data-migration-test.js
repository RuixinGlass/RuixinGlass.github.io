// =====================
// 数据迁移测试工具 - 凤凰计划第一阶段
// =====================

class DataMigrationTest {
    constructor() {
        this.atomicStorage = window.atomicStorage;
    }

    // ========== 测试备份创建 ==========
    async createTestBackup() {
        console.log('🔄 创建测试备份...');
        
        const backupId = `test_backup_${Date.now()}`;
        
        // 创建模拟数据
        const mockData = {
            notes: {
                'test_note_1': {
                    id: 'test_note_1',
                    title: '测试笔记1',
                    content: '这是测试笔记1的内容',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                'test_note_2': {
                    id: 'test_note_2',
                    title: '测试笔记2',
                    content: '这是测试笔记2的内容',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            }
        };
        
        return {
            id: backupId,
            timestamp: new Date().toISOString(),
            data: mockData
        };
    }

    // ========== 数据转换测试 ==========
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
        }
        
        return newNotes;
    }

    // ========== 测试迁移状态检查 ==========
    async checkTestMigrationStatus() {
        try {
            // 检查新数据
            const newMetadata = await this.atomicStorage.getAllNoteMetadata();
            
            // 创建模拟旧数据
            const mockOldData = { notes: {} };
            
            return {
                hasNewData: newMetadata.length > 0,
                hasOldData: false, // 测试环境中没有真实的旧数据
                newNotesCount: newMetadata.length,
                oldNotesCount: 0,
                needsMigration: false, // 测试环境中不需要迁移
                error: null
            };
        } catch (error) {
            console.error('测试迁移状态检查失败:', error);
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

    // ========== 测试数据验证 ==========
    async validateTestData(testData) {
        try {
            const convertedData = this.convertToAtomicStructure(testData);
            
            // 验证转换结果
            const validation = {
                success: convertedData.length === Object.keys(testData.notes).length,
                originalCount: Object.keys(testData.notes).length,
                convertedCount: convertedData.length,
                convertedData: convertedData
            };
            
            return validation;
        } catch (error) {
            console.error('测试数据验证失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ========== 测试完整工作流 ==========
    async testFullWorkflow() {
        console.log('🚀 开始测试完整工作流...');
        
        try {
            // 1. 创建测试备份
            const backup = await this.createTestBackup();
            console.log('✅ 测试备份创建成功');
            
            // 2. 转换数据结构
            const convertedData = this.convertToAtomicStructure(backup.data);
            console.log('✅ 数据结构转换成功');
            
            // 3. 验证转换结果
            const validation = await this.validateTestData(backup.data);
            console.log('✅ 数据验证完成');
            
            // 4. 检查迁移状态
            const status = await this.checkTestMigrationStatus();
            console.log('✅ 迁移状态检查完成');
            
            return {
                success: true,
                backup: backup,
                convertedData: convertedData,
                validation: validation,
                status: status
            };
            
        } catch (error) {
            console.error('❌ 测试工作流失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// ========== 全局实例和工具函数 ==========

window.dataMigrationTest = new DataMigrationTest();

// 便捷的测试函数
window.createTestBackup = async function() {
    return await window.dataMigrationTest.createTestBackup();
};

window.convertTestData = function(oldData) {
    return window.dataMigrationTest.convertToAtomicStructure(oldData);
};

window.checkTestMigrationStatus = async function() {
    return await window.dataMigrationTest.checkTestMigrationStatus();
};

window.validateTestData = async function(testData) {
    return await window.dataMigrationTest.validateTestData(testData);
};

window.testFullWorkflow = async function() {
    return await window.dataMigrationTest.testFullWorkflow();
};

console.log('数据迁移测试工具加载完成 - 凤凰计划第一阶段');
