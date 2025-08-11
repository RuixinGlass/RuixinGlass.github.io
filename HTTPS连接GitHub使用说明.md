# HTTPS连接GitHub使用说明

## 🎯 **为什么选择HTTPS？**

- ✅ **设置简单**：不需要SSH密钥
- ✅ **兼容性好**：所有系统都支持
- ✅ **多账号支持**：每个仓库可以有不同的账号
- ✅ **安全性**：使用Personal Access Token
- ✅ **易于管理**：Token可以随时撤销和更新

## 🚀 **快速开始**

### **第一步：创建Personal Access Token**

1. **登录GitHub**
   - 访问 [GitHub.com](https://github.com)
   - 使用您的账号登录

2. **进入设置页面**
   - 点击右上角头像
   - 选择 **"Settings"**

3. **找到开发者设置**
   - 左侧菜单滚动到底部
   - 点击 **"Developer settings"**

4. **创建Personal Access Token**
   - 点击 **"Personal access tokens"**
   - 选择 **"Tokens (classic)"**
   - 点击 **"Generate new token"**
   - 选择 **"Generate new token (classic)"**

5. **配置Token**
   - **Note**: `Notes System Token` (或任何描述性名称)
   - **Expiration**: `90 days` (建议选择90天或更长)
   - **Scopes**: 勾选 `repo` (完整的仓库访问权限)
   - 点击 **"Generate token"**

6. **复制Token**
   - **重要**：Token只显示一次！
   - 立即复制并保存到安全的地方

### **第二步：运行HTTPS连接脚本**

```bash
node connect-https-repo.js
```

脚本会引导您完成：
- Git仓库初始化
- 用户配置设置
- 远程仓库连接
- 文件提交和推送

## 📋 **详细步骤说明**

### **1. 创建GitHub仓库**

在运行脚本之前，需要先在GitHub上创建仓库：

1. 登录GitHub
2. 点击右上角 **"+"** → **"New repository"**
3. 填写仓库信息：
   - **Repository name**: `notes-system` (或您想要的名称)
   - **Description**: `严谨的版本控制笔记系统`
   - **Visibility**: 
     - 选择 **Public** (公开) - 可以使用GitHub Pages，但代码公开
     - 选择 **Private** (私有) - 代码私有，但无法使用GitHub Pages
   - **不要勾选** "Add a README file"
4. 点击 **"Create repository"**

### **2. 运行连接脚本**

```bash
# 在您的笔记系统文件夹中运行
node connect-https-repo.js
```

### **3. 按提示操作**

脚本会依次询问：
- GitHub用户名
- GitHub邮箱
- 仓库名称
- 提交信息

### **4. 输入认证信息**

当脚本提示推送时，会要求输入：
- **用户名**: 您的GitHub用户名
- **密码**: 您的Personal Access Token (不是GitHub密码)

## 🔧 **常见问题解决**

### **Q1: 推送时提示认证失败**

**原因**: Personal Access Token错误或过期

**解决**:
1. 检查Token是否正确复制
2. 确认Token没有过期
3. 重新生成Token

### **Q2: 提示仓库不存在**

**原因**: 仓库名称错误或未创建

**解决**:
1. 确认GitHub上已创建仓库
2. 检查仓库名称拼写
3. 确认仓库URL正确

### **Q3: 网络连接问题**

**原因**: 网络不稳定或防火墙阻止

**解决**:
1. 检查网络连接
2. 尝试使用VPN
3. 检查防火墙设置

### **Q4: Token过期**

**原因**: Personal Access Token有90天有效期

**解决**:
1. 重新生成Token
2. 更新Git凭据
3. 重新推送

## 💡 **使用技巧**

### **1. 保存Token**

将Token保存在安全的地方：
- 密码管理器
- 加密文件
- 云笔记（加密）

### **2. 定期更新Token**

- 设置提醒，在Token过期前更新
- 可以提前生成新Token
- 旧Token可以继续使用到过期

### **3. 使用Git管理脚本**

连接成功后，可以使用我们的Git管理脚本：

```bash
# 查看状态
node git-manager.js status

# 自动提交
node git-manager.js commit "更新笔记"

# 推送到远程
node git-manager.js push origin main

# 自动监控和提交
node git-manager.js watch
```

## 🔒 **安全注意事项**

### **1. Token安全**
- 不要将Token提交到代码仓库
- 不要分享Token给他人
- 定期更换Token

### **2. 仓库安全**
- 使用私有仓库保护敏感数据
- 定期检查仓库访问权限
- 及时删除不需要的协作者

### **3. 本地安全**
- 定期备份本地数据
- 使用强密码保护本地文件
- 考虑加密本地存储

## 📚 **相关命令参考**

### **Git基础命令**
```bash
# 查看状态
git status

# 添加文件
git add .

# 提交更改
git commit -m "提交信息"

# 推送到远程
git push origin main

# 拉取远程更新
git pull origin main

# 查看远程仓库
git remote -v
```

### **Token管理**
```bash
# 查看Git配置
git config --list

# 清除保存的凭据（Windows）
git config --global --unset credential.helper

# 重新设置凭据
git config --global credential.helper store
```

## 🎉 **完成设置**

设置完成后，您就可以：
- ✅ 使用Git管理本地版本
- ✅ 推送到GitHub远程仓库
- ✅ 从GitHub拉取更新
- ✅ 使用自动化的Git管理脚本

**现在开始享受HTTPS带来的便利吧！** 🚀
