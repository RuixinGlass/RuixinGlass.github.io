# PWA 本地化完善计划

本计划旨在将“严谨的版本控制笔记系统”打造成体验优秀、可完全离线使用的本地应用（PWA），并为后续桌面/移动端打包做好基础。

---

## 1. manifest.json 细节完善
- [ ] **应用名称与简名**：`name`、`short_name` 语义清晰，适配不同平台显示
- [ ] **启动路径**：`start_url` 设置为 `./`，确保各路径下都能正确启动
- [ ] **显示模式**：`display` 设为 `standalone` 或 `fullscreen`，去除浏览器UI
- [ ] **主题色与背景色**：`theme_color`、`background_color` 与主色调一致
- [ ] **多尺寸图标**：192x192、256x256、512x512，透明背景，SVG源文件可导出
- [ ] **scope**：设为 `./`，限制PWA访问范围
- [ ] **屏幕方向**：`orientation` 设为 `portrait` 或 `any`
- [ ] **语言、描述、作者**：`lang`、`description`、`author` 字段补全

## 2. 离线缓存与 service worker
- [ ] **核心资源缓存**：index.html、app.js、style.css、manifest.json、图标、字体、MathJax等
- [ ] **缓存策略**：静态资源“Cache First”，动态API“Network First”或“Stale While Revalidate”
- [ ] **缓存版本管理**：发布新版本时自动清理旧缓存
- [ ] **离线降级页面**：断网时显示友好提示
- [ ] **外部CDN资源本地化**：如MathJax、字体等，提升离线体验

## 3. 图标与启动画面
- [ ] **多尺寸App图标**：192x192、256x256、512x512，SVG源文件
- [ ] **favicon**：16x16、32x32、48x48
- [ ] **苹果设备启动图**：可选，提升iOS体验

## 4. 其它细节
- [ ] **HTTPS部署**：确保PWA完整功能
- [ ] **manifest、service-worker、图标等文件路径规范**
- [ ] **PWA合规性测试**：用Chrome DevTools“应用”面板检查

---

> **推进方式**：每完成一项，文档中勾选并记录细节，确保每个环节都达到最佳体验。 