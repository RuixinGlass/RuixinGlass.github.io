# 本地Git管理使用说明

## 🎯 **概述**

这个Git管理脚本可以让您直接在本地文件夹中使用Git来管理笔记的版本控制，无需在浏览器中集成Git功能。

## 📋 **功能特性**

- ✅ **自动初始化**：一键初始化Git仓库
- ✅ **状态检查**：查看文件修改状态
- ✅ **自动提交**：监控文件变化并自动提交
- ✅ **远程同步**：推送到GitHub等远程仓库
- ✅ **分支管理**：创建、切换、管理分支
- ✅ **历史查看**：查看提交历史
- ✅ **文件监控**：实时监控文件变化

## 🚀 **快速开始**

### 1. 初始化Git仓库

```bash
# 使用Node.js脚本
node git-manager.js init

# 或使用批处理脚本（Windows）
git-manager.bat init
```

### 2. 检查文件状态

```bash
node git-manager.js status
```

### 3. 添加并提交文件

```bash
# 添加所有文件
node git-manager.js add

# 添加特定文件
node git-manager.js add app.js style.css

# 提交更改
node git-manager.js commit "更新笔记内容"
```

### 4. 推送到GitHub

```bash
# 设置远程仓库
node git-manager.js remote https://github.com/yourusername/your-repo.git

# 推送到远程仓库
node git-manager.js push origin main
```

## 📖 **详细命令说明**

### 基础命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `init` | 初始化Git仓库 | `node git-manager.js init` |
| `status` | 检查文件状态 | `node git-manager.js status` |
| `add` | 添加文件到暂存区 | `node git-manager.js add app.js` |
| `commit` | 提交更改 | `node git-manager.js commit "更新内容"` |

### 远程操作

| 命令 | 说明 | 示例 |
|------|------|------|
| `remote` | 设置远程仓库 | `node git-manager.js remote https://github.com/user/repo.git` |
| `push` | 推送到远程 | `node git-manager.js push origin main` |
| `pull` | 从远程拉取 | `node git-manager.js pull origin main` |

### 分支管理

| 命令 | 说明 | 示例 |
|------|------|------|
| `branch` | 创建新分支 | `node git-manager.js branch feature-branch` |
| `switch` | 切换分支 | `node git-manager.js switch main` |
| `branches` | 列出所有分支 | `node git-manager.js branches` |

### 历史查看

| 命令 | 说明 | 示例 |
|------|------|------|
| `history` | 查看提交历史 | `node git-manager.js history 10` |

### 自动化功能

| 命令 | 说明 | 示例 |
|------|------|------|
| `watch` | 监控文件变化 | `node git-manager.js watch` |

## 🔧 **使用场景**

### 场景1：日常笔记管理

```bash
# 1. 初始化仓库
node git-manager.js init

# 2. 开始监控文件变化（自动提交）
node git-manager.js watch

# 3. 手动提交重要更改
node git-manager.js commit "添加重要笔记"
```

### 场景2：版本管理

```bash
# 1. 创建功能分支
node git-manager.js branch new-feature

# 2. 开发新功能...

# 3. 提交更改
node git-manager.js add .
node git-manager.js commit "实现新功能"

# 4. 切换回主分支
node git-manager.js switch main

# 5. 合并功能分支
git merge new-feature
```

### 场景3：云端备份

```bash
# 1. 设置GitHub仓库
node git-manager.js remote https://github.com/yourusername/notes-repo.git

# 2. 推送所有更改
node git-manager.js push origin main

# 3. 定期拉取更新
node git-manager.js pull origin main
```

## ⚙️ **配置说明**

### 自动提交设置

在 `git-manager.js` 中可以修改以下设置：

```javascript
this.autoCommitEnabled = true;           // 是否启用自动提交
this.autoCommitInterval = 5 * 60 * 1000; // 自动提交间隔（5分钟）
```

### Git配置

脚本会自动设置以下Git配置：

```bash
git config user.name "Note App"
git config user.email "notes@example.com"
```

您可以根据需要修改这些配置。

## 📁 **文件结构**

```
您的笔记文件夹/
├── .git/                    # Git仓库（自动创建）
├── .gitignore              # Git忽略文件（自动创建）
├── app.js                  # 主应用文件
├── style.css               # 样式文件
├── index.html              # 主页面
├── git-manager.js          # Git管理脚本
├── git-manager.bat         # Windows批处理脚本
└── 其他笔记文件...
```

## 🔍 **常见问题**

### Q1: 如何查看Git状态？
```bash
node git-manager.js status
```

### Q2: 如何撤销最后一次提交？
```bash
git reset --soft HEAD~1
```

### Q3: 如何查看提交历史？
```bash
node git-manager.js history 20
```

### Q4: 如何设置GitHub远程仓库？
```bash
node git-manager.js remote https://github.com/yourusername/your-repo.git
```

### Q5: 如何停止文件监控？
在运行 `watch` 命令的终端中按 `Ctrl+C`

## 🎯 **最佳实践**

### 1. 定期提交
- 建议每天至少提交一次
- 重要更改立即提交
- 使用有意义的提交信息

### 2. 分支管理
- 主分支保持稳定
- 新功能使用独立分支
- 及时合并和删除分支

### 3. 远程备份
- 定期推送到GitHub
- 使用私有仓库保护隐私
- 设置自动备份提醒

### 4. 文件组织
- 合理使用 `.gitignore`
- 避免提交临时文件
- 保持文件结构清晰

## 🚀 **高级功能**

### 自动备份脚本

创建一个定时任务脚本：

```bash
# backup-notes.sh
#!/bin/bash
cd /path/to/your/notes
node git-manager.js add .
node git-manager.js commit "自动备份 - $(date)"
node git-manager.js push origin main
```

### 多设备同步

在不同设备上使用相同的Git仓库：

```bash
# 设备A：推送更改
node git-manager.js push origin main

# 设备B：拉取更改
node git-manager.js pull origin main
```

## 📞 **技术支持**

如果遇到问题，请检查：

1. **Node.js是否安装**：`node --version`
2. **Git是否安装**：`git --version`
3. **文件权限**：确保有读写权限
4. **网络连接**：推送/拉取需要网络

## 🎉 **总结**

这个本地Git管理方案让您可以：

- ✅ 在本地文件夹中直接使用Git
- ✅ 自动监控和提交文件变化
- ✅ 轻松推送到GitHub等远程仓库
- ✅ 管理多个分支和版本
- ✅ 查看完整的修改历史

**开始使用吧！** 🚀
