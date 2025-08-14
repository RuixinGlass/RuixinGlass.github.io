const CACHE_NAME = 'note-app-cache-v7'; // 更新版本号 - 修复IndexedDB连接管理问题
const urlsToCache = [
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'icon-192.png',
  'icon-256.png',
  'icon-512.png',
  'offline.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=JetBrains+Mono:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js',
  'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.min.css',
  'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.min.js',
  'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/mode/markdown/markdown.min.js',
  'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',
  'https://cdn.jsdelivr.net/npm/turndown@7.1.2/dist/turndown.min.js'
];

// 安装时预缓存核心资源
self.addEventListener('install', function(event) {
  console.log('Service Worker 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return Promise.all(urlsToCache.map(url =>
          fetch(url).then(resp => {
            if (!resp.ok) throw new Error(url + ' failed: ' + resp.status);
            return cache.put(url, resp);
          }).catch(err => {
            console.error('Cache failed:', url, err);
          })
        ));
      })
      .then(() => {
        console.log('Service Worker 安装完成');
        // 立即激活新的 Service Worker
        return self.skipWaiting();
      })
  );
});

// 激活时清理旧缓存并通知客户端
self.addEventListener('activate', function(event) {
  console.log('Service Worker 激活中...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          console.log('清理旧缓存:', name);
          return caches.delete(name);
        })
      );
    }).then(() => {
      console.log('Service Worker 激活完成');
      // 通知所有客户端更新已就绪
      return self.clients.claim();
    })
  );
});

// 拦截所有请求，缓存优先，网络兜底，动态缓存新资源
self.addEventListener('fetch', function(event) {
  // 不缓存 GitHub API 相关请求，始终走网络
  if (event.request.url.includes('api.github.com') || 
      event.request.url.includes('gist.githubusercontent.com') ||
      event.request.url.includes('githubusercontent.com')) {
    return; // 让浏览器自己处理，不走缓存
  }
  
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        return response;
      }
      return fetch(event.request).then(function(resp) {
        // 动态缓存新资源
        return caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, resp.clone());
          return resp;
        });
      }).catch(function() {
        // 断网且缓存没有时，可选返回自定义离线页面
        return caches.match('/offline.html');
      });
    })
  );
});

// 监听来自客户端的消息
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // 检查更新
    checkForUpdate();
  }
});

// 检查更新函数
async function checkForUpdate() {
  try {
    // 检查多个关键文件是否有更新
    const filesToCheck = ['/index.html', '/app.js', '/style.css'];
    let hasUpdate = false;
    
    for (const file of filesToCheck) {
      try {
        const response = await fetch(file, { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!response.ok) continue;
        
        const newContent = await response.text();
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(file);
        
        if (cachedResponse) {
          const cachedContent = await cachedResponse.text();
          
          // 比较内容，如果不同则标记有更新
          if (newContent !== cachedContent) {
            console.log(`检测到文件更新: ${file}`);
            hasUpdate = true;
            break; // 发现一个文件有更新就够了
          }
        } else {
          // 缓存中没有这个文件，说明是新文件
          console.log(`发现新文件: ${file}`);
          hasUpdate = true;
          break;
        }
      } catch (error) {
        console.error(`检查文件 ${file} 失败:`, error);
      }
    }
    
    if (hasUpdate) {
      console.log('检测到新版本，通知客户端');
      // 通知所有客户端有新版本
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'UPDATE_AVAILABLE',
          data: {
            message: '检测到新版本，建议先同步云端数据',
            timestamp: new Date().toISOString()
          }
        });
      });
    }
  } catch (error) {
    console.error('检查更新失败:', error);
  }
}

// 定期检查更新（每小时检查一次）
setInterval(checkForUpdate, 60 * 60 * 1000);

// 推送通知处理
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || '有新版本可用，建议先同步云端数据',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'update-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'sync',
          title: '同步云端',
          icon: '/icon-192.png'
        },
        {
          action: 'update',
          title: '立即更新',
          icon: '/icon-192.png'
        },
        {
          action: 'dismiss',
          title: '稍后处理',
          icon: '/icon-192.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification('笔记系统更新', options)
    );
  }
});

// 通知点击处理
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'sync') {
    // 打开应用并显示同步对话框
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        if (clients.length > 0) {
          clients[0].focus();
          clients[0].postMessage({
            type: 'SHOW_SYNC_DIALOG',
            data: { message: '请先同步云端数据' }
          });
        } else {
          self.clients.openWindow('/');
        }
      })
    );
  } else if (event.action === 'update') {
    // 立即更新
    event.waitUntil(
      self.skipWaiting().then(() => {
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'FORCE_UPDATE' });
          });
        });
      })
    );
  }
  // dismiss 动作不需要特殊处理
}); 