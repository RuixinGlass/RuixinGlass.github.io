# GitHub SSH设置指南

## 🎯 **为什么要使用SSH？**

- ✅ **更安全**：密钥认证，无需输入密码
- ✅ **更快速**：SSH协议比HTTPS更快
- ✅ **更方便**：一次设置，永久使用
- ✅ **更稳定**：连接更稳定，不容易断开

## 🔑 **SSH密钥设置步骤**

### 步骤1：检查现有SSH密钥

```bash
# 检查是否已有SSH密钥
ls -la ~/.ssh
```

如果看到 `id_rsa` 和 `id_rsa.pub` 文件，说明已有SSH密钥。

### 步骤2：生成SSH密钥（如果没有）

```bash
# 生成新的SSH密钥
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 按提示操作：
# 1. 按回车接受默认文件位置
# 2. 可以设置密码（推荐）或直接回车跳过
# 3. 再次确认密码
```

### 步骤3：启动SSH代理

```bash
# 启动SSH代理
eval "$(ssh-agent -s)"

# 添加SSH密钥到代理
ssh-add ~/.ssh/id_rsa
```

### 步骤4：复制公钥

```bash
# 显示公钥内容
cat ~/.ssh/id_rsa.pub
```

**复制整个输出内容**（以 `ssh-rsa` 开头，以您的邮箱结尾）

### 步骤5：添加到GitHub

1. 登录 [GitHub](https://github.com)
2. 点击右上角头像 → **"Settings"**
3. 左侧菜单点击 **"SSH and GPG keys"**
4. 点击 **"New SSH key"**
5. 填写信息：
   - **Title**: `My Computer` (或任何描述性名称)
   - **Key**: 粘贴刚才复制的公钥内容
6. 点击 **"Add SSH key"**

### 步骤6：测试SSH连接

```bash
# 测试SSH连接
ssh -T git@github.com
```

如果看到 `Hi username! You've successfully authenticated...` 说明设置成功！

## 🚀 **使用SSH克隆/设置仓库**

### 方法1：克隆现有仓库

```bash
# 使用SSH URL克隆
git clone git@github.com:yourusername/notes-system.git
```

### 方法2：为现有仓库设置SSH

```bash
# 查看当前远程仓库
git remote -v

# 如果显示HTTPS URL，更改为SSH
git remote set-url origin git@github.com:yourusername/notes-system.git

# 验证更改
git remote -v
```

## 📝 **完整的设置流程**

### 1. 生成SSH密钥
```bash
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
```

### 2. 添加到SSH代理
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_rsa
```

### 3. 复制公钥
```bash
cat ~/.ssh/id_rsa.pub
# 复制输出内容
```

### 4. 添加到GitHub
- 登录GitHub → Settings → SSH and GPG keys
- 点击 "New SSH key"
- 粘贴公钥内容

### 5. 测试连接
```bash
ssh -T git@github.com
```

### 6. 设置仓库
```bash
# 在您的笔记文件夹中
node git-manager.js remote git@github.com:yourusername/notes-system.git
```

## 🔧 **常见问题解决**

### Q1: SSH密钥权限问题
```bash
# 修复SSH密钥权限
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub
```

### Q2: SSH代理未启动
```bash
# 手动启动SSH代理
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_rsa
```

### Q3: 连接被拒绝
```bash
# 测试连接并显示详细信息
ssh -vT git@github.com
```

### Q4: 多个SSH密钥
```bash
# 创建SSH配置文件
nano ~/.ssh/config

# 添加以下内容：
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_rsa
```

## 🎯 **验证设置**

设置完成后，您应该能够：

1. ✅ 使用 `ssh -T git@github.com` 成功连接
2. ✅ 使用SSH URL推送/拉取代码
3. ✅ 无需每次输入密码

## 🚀 **开始使用**

设置完成后，您就可以使用我们的Git管理脚本了：

```bash
# 初始化Git仓库
node git-manager.js init

# 设置SSH远程仓库
node git-manager.js remote git@github.com:yourusername/notes-system.git

# 推送代码
node git-manager.js push origin main
```

**SSH设置完成后，您的Git操作将更快更安全！** 🎉
