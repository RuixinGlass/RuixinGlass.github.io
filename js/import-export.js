/**
 * 导入导出模块
 * 负责笔记的导入导出功能
 */

import { getNotesData, setNotesData } from './state.js';
import { getStorage } from './storage-manager.js';
import { generateId, showToast } from './utils.js';

/**
 * 从文件列表导入笔记
 */
export async function importFromFiles(files) {
    const storage = getStorage();
    const notesData = getNotesData();
    
    for (const file of files) {
        let content = file.content || (file.text ? await file.text() : '');
        let title = '未命名笔记';
        
        // 解析front matter，提取title
        const fm = content.match(/^---([\s\S]*?)---/);
        if (fm) {
            const titleMatch = fm[1].match(/title:\s*(.*)/);
            if (titleMatch) {
                title = titleMatch[1].replace(/^['"]|['"]$/g, '').trim() || title;
            }
        }
        
        const noteId = generateId('note');
        notesData.notes[noteId] = {
            title,
            content,
            versions: [],
            lastModified: Date.now()
        };
    }
    
    setNotesData(notesData);
    
    if (storage) {
        try {
            await storage.saveData(notesData);
        } catch (error) {
            console.error('导入文件后保存失败:', error);
            showToast('文件导入成功，但保存至本地时出错', 'error');
        }
    }
}

/**
 * 导出单篇笔记
 */
export async function exportSingleNote(noteId) {
    const notesData = getNotesData();
    const note = notesData.notes[noteId];
    
    if (!note) {
        throw new Error('笔记不存在');
    }
    
    let fileName = (note.title || '未命名笔记').replace(/[\\/:*?"<>|]/g, '_') + '.md';
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
}

/**
 * 初始化导入导出功能
 */
export function initializeImportExport(elements) {
    const {
        exportNoteBtn,
        importAllBtn,
        importModal,
        importMdBtn,
        importModalCloseBtn
    } = elements;
    
    if (exportNoteBtn) {
        exportNoteBtn.addEventListener('click', async () => {
            const notesData = getNotesData();
            const noteId = notesData.currentNoteId;
            
            if (!noteId || !notesData.notes[noteId]) {
                showToast('没有可导出的笔记', 3000);
                return;
            }
            
            try {
                await exportSingleNote(noteId);
                showToast('笔记导出成功！', 3000);
            } catch (error) {
                console.error('导出笔记失败:', error);
                showToast('导出失败: ' + error.message, 5000);
            }
        });
    }

    if (importAllBtn) {
        importAllBtn.addEventListener('click', () => {
            if (importModal) {
                importModal.classList.remove('hidden');
            }
        });
    }

    if (importModalCloseBtn) {
        importModalCloseBtn.onclick = () => {
            if (importModal) {
                importModal.classList.add('hidden');
            }
        };
    }
    
    if (importModal) {
        importModal.addEventListener('click', e => {
            if (e.target === importModal) {
                importModal.classList.add('hidden');
            }
        });
    }
    
    window.addEventListener('keydown', e => {
        if (e.key === 'Escape' && importModal) {
            importModal.classList.add('hidden');
        }
    });
    
    if (importMdBtn) {
        importMdBtn.onclick = () => {
            if (importModal) {
                importModal.classList.add('hidden');
            }
            
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.md,.html';
            input.onchange = async () => {
                if (input.files.length) {
                    await importFromFiles([input.files[0]]);
                    showToast('导入完成', 3000);
                }
            };
            input.click();
        };
    }
}
