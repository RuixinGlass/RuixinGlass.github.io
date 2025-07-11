const CACHE_NAME = 'note-app-cache-v2';
const urlsToCache = [
  '/',
  './',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-256.png',
  '/icon-512.png',
  '/offline.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
  'https://fonts.gstatic.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js',
  'https://cdn.jsdelivr.net/npm/@codemirror/view@6.25.0/style.min.css',
  'https://cdn.jsdelivr.net/npm/@codemirror/theme-one-dark@6.2.0/theme.min.css',
  'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.min.css',
  'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.min.js',
  'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/mode/markdown/markdown.min.js',
  'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',
  'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Main-Regular.woff2',
  'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Math-Italic.woff2',
  'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Size1-Regular.woff2',
  'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Script-Regular.woff2',
  'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Fraktur-Regular.woff2',
  'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Caligraphic-Bold.woff2',
  'https://cdn.jsdelivr.net/npm/turndown@7.1.2/dist/turndown.min.js'
];

// 安装时预缓存核心资源
self.addEventListener('install', function(event) {
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
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
});

// 拦截所有请求，缓存优先，网络兜底，动态缓存新资源
self.addEventListener('fetch', function(event) {
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