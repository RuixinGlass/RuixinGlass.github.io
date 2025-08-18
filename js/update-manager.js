/**
 * 更新检测模块
 * 负责应用更新检测和通知
 */

let updateAvailable = false;
let updateDialogShown = false;

/**
 * 初始化更新检测
 */
export function initUpdateDetection() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                console.log('收到更新通知:', event.data);
                updateAvailable = true;
                showUpdateDialog(event.data.data.message);
            } else if (event.data && event.data.type === 'SHOW_SYNC_DIALOG') {
                showSyncDialog(event.data.data.message);
            } else if (event.data && event.data.type === 'FORCE_UPDATE') {
                forceUpdate();
            }
        });
        
        navigator.serviceWorker.register('/service-worker.js')
            .then(function(registration) {
                console.log('Service Worker 注册成功:', registration);
                
                registration.update();
                
                registration.addEventListener('updatefound', function() {
                    console.log('检测到 Service Worker 更新');
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('新版本已安装，等待激活');
                            updateAvailable = true;
                            showUpdateDialog('检测到新版本，建议先同步云端数据');
                        }
                    });
                });
                
                setInterval(() => {
                    console.log('定期检查更新...');
                    registration.update();
                }, 5 * 60 * 1000);
                
                document.addEventListener('visibilitychange', () => {
                    if (!document.hidden) {
                        console.log('页面变为可见，检查更新...');
                        registration.update();
                    }
                });
            })
            .catch(function(error) {
                console.error('Service Worker 注册失败:', error);
            });
    }
}

/**
 * 显示更新对话框
 */
function showUpdateDialog(message) {
    if (updateDialogShown) return;
    updateDialogShown = true;
    
    const dialog = document.createElement('div');
    dialog.className = 'update-dialog';
    dialog.innerHTML = `
        <div class="update-dialog-content">
            <div class="update-dialog-header">
                <h3><i class="fas fa-sync-alt"></i> 系统更新提醒</h3>
                <button class="update-dialog-close" onclick="closeUpdateDialog()">×</button>
            </div>
            <div class="update-dialog-body">
                <p>${message}</p>
                <p><strong>建议操作：</strong></p>
                <ul>
                    <li>1. 先同步云端数据，确保数据安全</li>
                    <li>2. 然后点击"立即更新"应用新版本</li>
                </ul>
            </div>
            <div class="update-dialog-actions">
                <button class="btn btn-primary" onclick="syncAndUpdate()">
                    <i class="fas fa-cloud-upload-alt"></i> 同步并更新
                </button>
                <button class="btn btn-secondary" onclick="forceUpdate()">
                    <i class="fas fa-download"></i> 立即更新
                </button>
                <button class="btn btn-outline" onclick="closeUpdateDialog()">
                    <i class="fas fa-clock"></i> 稍后处理
                </button>
            </div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .update-dialog {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        }
        .update-dialog-content {
            background: white;
            border-radius: 10px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .update-dialog-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #eee;
        }
        .update-dialog-header h3 {
            margin: 0;
            color: #333;
        }
        .update-dialog-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        .update-dialog-body {
            padding: 20px;
        }
        .update-dialog-body ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .update-dialog-actions {
            padding: 20px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .update-dialog-actions .btn {
            flex: 1;
            min-width: 120px;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(dialog);
}

/**
 * 显示同步对话框
 */
function showSyncDialog(message) {
    // 可以在这里添加更详细的同步界面
    console.log('同步对话框:', message);
}

/**
 * 关闭更新对话框
 */
export function closeUpdateDialog() {
    const dialog = document.querySelector('.update-dialog');
    if (dialog) {
        dialog.remove();
        updateDialogShown = false;
    }
}

/**
 * 同步并更新
 */
export function syncAndUpdate() {
    // 先同步云端数据，然后更新
    console.log('正在同步云端数据...');
    
    setTimeout(() => {
        console.log('同步完成，正在更新...');
        forceUpdate();
    }, 2000);
}

/**
 * 强制更新
 */
export function forceUpdate() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(function(registration) {
            registration.active.postMessage({ type: 'SKIP_WAITING' });
        });
    }
    
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

/**
 * 定期检查更新
 */
export function startPeriodicUpdateCheck() {
    setInterval(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(function(registration) {
                registration.update();
            });
        }
    }, 30 * 60 * 1000); // 每30分钟检查一次
}
