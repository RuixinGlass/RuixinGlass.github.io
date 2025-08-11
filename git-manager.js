#!/usr/bin/env node

/**
 * 本地Git管理脚本
 * 用于管理笔记文件夹的Git版本控制
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

class GitManager {
    constructor(notesDir = '.') {
        this.notesDir = path.resolve(notesDir);
        this.gitDir = path.join(this.notesDir, '.git');
        this.notesDataFile = path.join(this.notesDir, 'notes-data.json');
        this.autoCommitEnabled = true;
        this.autoCommitInterval = 5 * 60 * 1000; // 5分钟
        this.lastCommitTime = 0;
    }

    /**
     * 初始化Git仓库
     */
    async initGitRepo() {
        try {
            if (!fs.existsSync(this.gitDir)) {
                console.log('🔄 初始化Git仓库...');
                this.runGitCommand(['init']);
                this.runGitCommand(['config', 'user.name', 'Note App']);
                this.runGitCommand(['config', 'user.email', 'notes@example.com']);
                
                // 创建.gitignore文件
                const gitignoreContent = `
# 系统文件
.DS_Store
Thumbs.db

# 临时文件
*.tmp
*.temp

# 日志文件
*.log

# 编辑器文件
.vscode/
.idea/

# 依赖文件
node_modules/

# 备份文件
*.backup
*.bak

# 测试文件
test/
demo/
`;
                fs.writeFileSync(path.join(this.notesDir, '.gitignore'), gitignoreContent.trim());
                console.log('✅ Git仓库初始化完成');
            } else {
                console.log('ℹ️  Git仓库已存在');
            }
        } catch (error) {
            console.error('❌ 初始化Git仓库失败:', error.message);
        }
    }

    /**
     * 检查文件状态
     */
    async checkStatus() {
        try {
            const status = this.runGitCommand(['status', '--porcelain']);
            const files = status.split('\n').filter(line => line.trim());
            
            if (files.length === 0) {
                console.log('📝 工作区干净，没有未提交的更改');
                return [];
            }

            console.log('📋 文件状态:');
            files.forEach(file => {
                const status = file.substring(0, 2);
                const filename = file.substring(3);
                let statusText = '';
                
                switch (status) {
                    case 'M ': statusText = '已修改'; break;
                    case ' M': statusText = '已修改(未暂存)'; break;
                    case 'A ': statusText = '已添加'; break;
                    case '??': statusText = '未跟踪'; break;
                    case 'D ': statusText = '已删除'; break;
                    default: statusText = status; break;
                }
                
                console.log(`  ${statusText}: ${filename}`);
            });
            
            return files;
        } catch (error) {
            console.error('❌ 检查状态失败:', error.message);
            return [];
        }
    }

    /**
     * 添加文件到暂存区
     */
    async addFiles(files = []) {
        try {
            if (files.length === 0) {
                console.log('🔄 添加所有文件到暂存区...');
                this.runGitCommand(['add', '.']);
            } else {
                console.log('🔄 添加指定文件到暂存区...');
                files.forEach(file => {
                    this.runGitCommand(['add', file]);
                    console.log(`  ✅ 已添加: ${file}`);
                });
            }
        } catch (error) {
            console.error('❌ 添加文件失败:', error.message);
        }
    }

    /**
     * 提交更改
     */
    async commit(message = null) {
        try {
            if (!message) {
                const timestamp = new Date().toLocaleString('zh-CN');
                message = `自动提交 - ${timestamp}`;
            }

            console.log('🔄 提交更改...');
            this.runGitCommand(['commit', '-m', message]);
            console.log(`✅ 提交成功: ${message}`);
            this.lastCommitTime = Date.now();
        } catch (error) {
            console.error('❌ 提交失败:', error.message);
        }
    }

    /**
     * 推送到远程仓库
     */
    async push(remote = 'origin', branch = 'main') {
        try {
            console.log('🚀 推送到远程仓库...');
            this.runGitCommand(['push', remote, branch]);
            console.log('✅ 推送成功');
        } catch (error) {
            console.error('❌ 推送失败:', error.message);
        }
    }

    /**
     * 从远程仓库拉取
     */
    async pull(remote = 'origin', branch = 'main') {
        try {
            console.log('⬇️ 从远程仓库拉取...');
            this.runGitCommand(['pull', remote, branch]);
            console.log('✅ 拉取成功');
        } catch (error) {
            console.error('❌ 拉取失败:', error.message);
        }
    }

    /**
     * 查看提交历史
     */
    async showHistory(limit = 10) {
        try {
            console.log(`📜 最近 ${limit} 次提交:`);
            const log = this.runGitCommand(['log', `--oneline`, `-${limit}`]);
            const commits = log.split('\n').filter(line => line.trim());
            
            commits.forEach((commit, index) => {
                const [hash, ...messageParts] = commit.split(' ');
                const message = messageParts.join(' ');
                console.log(`  ${index + 1}. ${hash} - ${message}`);
            });
        } catch (error) {
            console.error('❌ 查看历史失败:', error.message);
        }
    }

    /**
     * 创建分支
     */
    async createBranch(branchName) {
        try {
            console.log(`🔄 创建分支: ${branchName}`);
            this.runGitCommand(['checkout', '-b', branchName]);
            console.log(`✅ 分支创建成功: ${branchName}`);
        } catch (error) {
            console.error('❌ 创建分支失败:', error.message);
        }
    }

    /**
     * 切换分支
     */
    async switchBranch(branchName) {
        try {
            console.log(`🔄 切换到分支: ${branchName}`);
            this.runGitCommand(['checkout', branchName]);
            console.log(`✅ 已切换到分支: ${branchName}`);
        } catch (error) {
            console.error('❌ 切换分支失败:', error.message);
        }
    }

    /**
     * 列出所有分支
     */
    async listBranches() {
        try {
            console.log('🌿 分支列表:');
            const branches = this.runGitCommand(['branch', '-a']);
            const branchList = branches.split('\n').filter(line => line.trim());
            
            branchList.forEach(branch => {
                const isCurrent = branch.startsWith('*');
                const branchName = branch.replace('* ', '').replace('remotes/', '');
                console.log(`  ${isCurrent ? '👉' : '  '} ${branchName}`);
            });
        } catch (error) {
            console.error('❌ 列出分支失败:', error.message);
        }
    }

    /**
     * 设置远程仓库
     */
    async setRemote(url, remoteName = 'origin') {
        try {
            console.log(`🔄 设置远程仓库: ${remoteName} -> ${url}`);
            
            // 检查是否已存在远程仓库
            try {
                this.runGitCommand(['remote', 'get-url', remoteName]);
                console.log(`🔄 更新远程仓库: ${remoteName}`);
                this.runGitCommand(['remote', 'set-url', remoteName, url]);
            } catch {
                console.log(`🔄 添加远程仓库: ${remoteName}`);
                this.runGitCommand(['remote', 'add', remoteName, url]);
            }
            
            console.log('✅ 远程仓库设置成功');
        } catch (error) {
            console.error('❌ 设置远程仓库失败:', error.message);
        }
    }

    /**
     * 自动提交功能
     */
    async autoCommit() {
        if (!this.autoCommitEnabled) return;
        
        const now = Date.now();
        if (now - this.lastCommitTime < this.autoCommitInterval) return;
        
        const files = await this.checkStatus();
        if (files.length > 0) {
            console.log('🔄 执行自动提交...');
            await this.addFiles();
            await this.commit();
        }
    }

    /**
     * 监控文件变化
     */
    startFileWatcher() {
        console.log('👀 开始监控文件变化...');
        
        fs.watch(this.notesDir, { recursive: true }, (eventType, filename) => {
            if (filename && !filename.startsWith('.git')) {
                console.log(`📝 检测到文件变化: ${filename}`);
                setTimeout(() => this.autoCommit(), 2000); // 延迟2秒执行自动提交
            }
        });
    }

    /**
     * 运行Git命令
     */
    runGitCommand(args) {
        try {
            const result = execSync(`git ${args.join(' ')}`, {
                cwd: this.notesDir,
                encoding: 'utf8'
            });
            return result.trim();
        } catch (error) {
            throw new Error(`Git命令执行失败: ${error.message}`);
        }
    }

    /**
     * 显示帮助信息
     */
    showHelp() {
        console.log(`
📚 Git管理脚本使用说明

用法: node git-manager.js [命令] [参数]

命令:
  init                   初始化Git仓库
  status                 检查文件状态
  add [文件...]          添加文件到暂存区
  commit [消息]          提交更改
  push [远程] [分支]     推送到远程仓库
  pull [远程] [分支]     从远程仓库拉取
  history [数量]         查看提交历史
  branch [分支名]        创建新分支
  switch [分支名]        切换分支
  branches               列出所有分支
  remote [URL] [名称]    设置远程仓库
  watch                  开始监控文件变化
  help                   显示此帮助信息

示例:
  node git-manager.js init
  node git-manager.js status
  node git-manager.js add notes-data.json
  node git-manager.js commit "更新笔记内容"
  node git-manager.js push origin main
  node git-manager.js watch
        `);
    }
}

// 主程序
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const gitManager = new GitManager();

    if (!command || command === 'help') {
        gitManager.showHelp();
        return;
    }

    try {
        switch (command) {
            case 'init':
                await gitManager.initGitRepo();
                break;
                
            case 'status':
                await gitManager.checkStatus();
                break;
                
            case 'add':
                const files = args.slice(1);
                await gitManager.addFiles(files);
                break;
                
            case 'commit':
                const message = args.slice(1).join(' ');
                await gitManager.commit(message);
                break;
                
            case 'push':
                const pushRemote = args[1] || 'origin';
                const pushBranch = args[2] || 'main';
                await gitManager.push(pushRemote, pushBranch);
                break;
                
            case 'pull':
                const pullRemote = args[1] || 'origin';
                const pullBranch = args[2] || 'main';
                await gitManager.pull(pullRemote, pullBranch);
                break;
                
            case 'history':
                const limit = parseInt(args[1]) || 10;
                await gitManager.showHistory(limit);
                break;
                
            case 'branch':
                const branchName = args[1];
                if (!branchName) {
                    console.error('❌ 请指定分支名称');
                    return;
                }
                await gitManager.createBranch(branchName);
                break;
                
            case 'switch':
                const switchBranch = args[1];
                if (!switchBranch) {
                    console.error('❌ 请指定分支名称');
                    return;
                }
                await gitManager.switchBranch(switchBranch);
                break;
                
            case 'branches':
                await gitManager.listBranches();
                break;
                
            case 'remote':
                const url = args[1];
                const remoteName = args[2] || 'origin';
                if (!url) {
                    console.error('❌ 请指定远程仓库URL');
                    return;
                }
                await gitManager.setRemote(url, remoteName);
                break;
                
            case 'watch':
                await gitManager.initGitRepo();
                gitManager.startFileWatcher();
                console.log('🔄 文件监控已启动，按 Ctrl+C 停止');
                break;
                
            default:
                console.error(`❌ 未知命令: ${command}`);
                gitManager.showHelp();
                break;
        }
    } catch (error) {
        console.error('❌ 执行失败:', error.message);
    }
}

// 运行主程序
if (require.main === module) {
    main();
}

module.exports = GitManager;
