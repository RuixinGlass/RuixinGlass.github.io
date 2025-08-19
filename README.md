# 简·记

> 一个极简、优雅、学术风格的 Markdown 笔记系统，支持本地版本管理、标签、全文搜索、PWA 离线使用与云端同步。
> 适合追求极致写作体验与数据安全的你。

## ✨ 主要特性

- **极简纯 Markdown 编辑**：无 WYSIWYG 干扰，专注内容本身
- **高性能本地存储**：使用 IndexedDB 存储，支持大数据量，性能优异
- **自动版本控制**：每次切换预览自动保存新版本，支持历史版本浏览与恢复
- **标签与全文搜索**：支持 YAML front matter 标签，侧边栏标签筛选与全文检索
- **导入/导出**：支持单篇/批量 Markdown 导入导出，兼容主流笔记格式
- **云端同步**：可选 GitHub Gist 云同步，数据多端备份
- **PWA 离线可用**：支持"添加到主屏幕"，断网也能随时记录与编辑
- **移动端适配**：响应式设计，手机/平板体验优秀
- **极致美学**：Inter/Helvetica/苹方等专业字体，学术风格配色，极简 UI

## 🚀 快速开始

1. **在线体验**  
   访问：[https://ruixinglass.github.io/RuixinGlass.github.io/](https://ruixinglass.github.io/RuixinGlass.github.io/)

2. **本地运行**  
   直接用浏览器打开 `index.html` 即可，无需任何后端或依赖

3. **添加到主屏幕（PWA）**  
   手机浏览器访问后，选择"添加到主屏幕"，即可获得原生 App 体验，支持离线使用

## 📝 主要用法

- **新建/编辑笔记**：左侧"新建笔记"，支持 Markdown 语法
- **标签管理**：在笔记开头 YAML front matter 里写 `tags: [标签1, 标签2]`
- **全文搜索/标签筛选**：侧边栏输入关键词或点击标签
- **历史版本**：右上角"查看历史"，可浏览/恢复任意历史版本
- **导入/导出**：右上角导出单篇，云同步栏可批量导入/导出
- **云端同步**：配置 GitHub Token 与 Gist ID，支持一键上传/拉取

## 📱 移动端体验

- 响应式布局，适配主流手机/平板
- 支持 PWA 离线使用，断网也能随时记录
- 推荐用 Chrome/Safari 添加到主屏幕，体验接近原生便签

## ☁️ 云同步说明

- 云同步基于 GitHub Gist，需个人 Token
- 支持多端同步，数据安全可控
- 云同步为可选功能，**本地数据始终可用**

## 🛠️ 部署到 GitHub Pages

1. 推送核心应用文件到 GitHub 仓库
2. 在仓库 Settings > Pages 启用 GitHub Pages，选择根目录
3. 访问分配的页面地址即可

## 💡 技术栈

- **纯前端**：HTML + CSS + JavaScript
- **架构模式**：ES6 模块化 + 事件驱动架构
- **Markdown 解析**：marked.js
- **富文本编辑**：CodeMirror 5
- **本地存储**：IndexedDB（高性能）+ localStorage（备用）
- **云同步**：GitHub Gist API
- **PWA**：Service Worker + manifest.json
- **性能优化**：自定义性能优化模块

## 🏗️ 模块化架构

本项目采用现代化的 ES6 模块化架构，实现了高内聚、低耦合的设计：

- **`main.js`**：应用入口，负责初始化和模块协调
- **`dom.js`**：集中管理所有 DOM 元素引用
- **`state.js`**：全局状态管理，包括笔记数据、当前状态等
- **`ui.js`**：纯 UI 渲染，不包含业务逻辑
- **`note.js`**：笔记核心业务逻辑
- **`version.js`**：版本控制业务逻辑
- **`events.js`**：事件中心，处理所有 DOM 和自定义事件
- **`utils.js`**：工具函数集合
- **`storage.js`** & **`storage-manager.js`**：存储层抽象
- **`cloud-sync.js`**：云同步功能模块
- **`import-export.js`**：导入导出功能模块
- **`update-manager.js`**：更新检测模块
- **`data-migration-manager.js`**：数据迁移管理模块

### 事件驱动通信

模块间通过自定义事件进行通信，实现松耦合：
- 业务模块触发事件（如 `loadNote`、`versionSaved`）
- 事件中心（`events.js`）监听并协调处理
- UI 模块响应事件进行渲染

## 🔧 项目结构

```
严谨的版本控制笔记系统/
├── index.html              # 主页面
├── app.js                  # 已废弃的旧版应用逻辑（保留用于参考）
├── style.css               # 样式文件
├── service-worker.js       # Service Worker 缓存管理
├── js/                     # 模块化 JavaScript 文件
│   ├── main.js             # 应用主入口和初始化
│   ├── dom.js              # DOM 元素管理
│   ├── state.js            # 状态管理
│   ├── ui.js               # UI 渲染和操作
│   ├── note.js             # 笔记业务逻辑
│   ├── version.js          # 版本控制逻辑
│   ├── events.js           # 事件监听和处理
│   ├── utils.js            # 工具函数
│   ├── storage.js          # 存储接口
│   ├── storage-manager.js  # 存储管理器
│   ├── cloud-sync.js       # 云同步功能
│   ├── import-export.js    # 导入导出功能
│   ├── update-manager.js   # 更新检测管理
│   └── data-migration-manager.js # 数据迁移管理
├── performance-optimizer.js # 性能优化模块
├── manifest.json           # PWA 配置
├── offline.html            # 离线页面
├── icon-*.png              # 应用图标
└── README.md               # 项目说明
```

## 🏷️ License

MIT License

如需自定义、二次开发或遇到问题，欢迎提 Issue 或联系作者！ 