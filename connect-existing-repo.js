#!/usr/bin/env node

/**
 * 连接现有GitHub仓库脚本
 * 帮助用户将本地文件夹与现有的GitHub仓库连接
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

class RepoConnector {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * 检查Git仓库状态
     */
    checkGitStatus() {
        try {
            const gitDir = path.join(process.cwd(), '.git');
            if (fs.existsSync(gitDir)) {
                console.log('✅ 发现本地Git仓库');
                return true;
            } else {
                console.log('ℹ️ 本地没有Git仓库，需要初始化');
                return false;
            }
        } catch (error) {
            return false;
        }
    }

    /**
     * 初始化Git仓库
     */
    async initGitRepo() {
        try {
            console.log('🔄 初始化Git仓库...');
            execSync('git init', { stdio: 'inherit' });
            console.log('✅ Git仓库初始化成功');
            return true;
        } catch (error) {
            console.error('❌ 初始化Git仓库失败:', error.message);
            return false;
        }
    }

    /**
     * 设置远程仓库
     */
    async setRemoteRepo() {
        try {
            console.log('🔄 设置远程仓库...');
            
            const username = await this.question('请输入您的GitHub用户名: ');
            const repoName = await this.question('请输入仓库名称 (默认: RuixinGlass.github.io): ') || 'RuixinGlass.github.io';
            
            // 提供SSH和HTTPS两种选择
            const useSSH = await this.question('是否使用SSH连接？(推荐) (y/n): ');
            
            let remoteUrl;
            if (useSSH.toLowerCase() === 'y') {
                remoteUrl = `git@github.com:${username}/${repoName}.git`;
            } else {
                remoteUrl = `https://github.com/${username}/${repoName}.git`;
            }
            
            console.log(`📋 远程仓库URL: ${remoteUrl}`);
            
            // 添加远程仓库
            execSync(`git remote add origin ${remoteUrl}`, { stdio: 'inherit' });
            console.log('✅ 远程仓库设置成功');
            
            return remoteUrl;
        } catch (error) {
            console.error('❌ 设置远程仓库失败:', error.message);
            return null;
        }
    }

    /**
     * 拉取远程仓库内容
     */
    async pullRemoteContent() {
        try {
            console.log('🔄 拉取远程仓库内容...');
            
            const hasRemote = await this.question('是否拉取远程仓库的现有内容？(y/n): ');
            if (hasRemote.toLowerCase() === 'y') {
                console.log('⚠️ 注意：这可能会覆盖本地文件，建议先备份');
                const confirm = await this.question('确认继续？(y/n): ');
                if (confirm.toLowerCase() !== 'y') {
                    console.log('跳过拉取操作');
                    return true;
                }
                
                execSync('git pull origin main --allow-unrelated-histories', { stdio: 'inherit' });
                console.log('✅ 远程内容拉取成功');
            }
            
            return true;
        } catch (error) {
            console.error('❌ 拉取远程内容失败:', error.message);
            return false;
        }
    }

    /**
     * 添加并提交本地文件
     */
    async addAndCommitFiles() {
        try {
            console.log('🔄 添加本地文件到Git...');
            
            // 添加所有文件
            execSync('git add .', { stdio: 'inherit' });
            console.log('✅ 文件添加成功');
            
            // 提交文件
            const commitMessage = await this.question('请输入提交信息 (默认: 更新笔记系统): ') || '更新笔记系统';
            execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
            console.log('✅ 文件提交成功');
            
            return true;
        } catch (error) {
            console.error('❌ 添加提交文件失败:', error.message);
            return false;
        }
    }

    /**
     * 推送到远程仓库
     */
    async pushToRemote() {
        try {
            console.log('🔄 推送到远程仓库...');
            
            const pushNow = await this.question('是否立即推送到远程仓库？(y/n): ');
            if (pushNow.toLowerCase() === 'y') {
                execSync('git push -u origin main', { stdio: 'inherit' });
                console.log('✅ 推送成功');
            } else {
                console.log('💡 您可以稍后使用以下命令推送:');
                console.log('   git push -u origin main');
            }
            
            return true;
        } catch (error) {
            console.error('❌ 推送失败:', error.message);
            return false;
        }
    }

    /**
     * 设置Git管理脚本
     */
    async setupGitManager() {
        try {
            console.log('🔄 设置Git管理脚本...');
            
            // 检查是否有git-manager.js
            if (fs.existsSync('git-manager.js')) {
                console.log('✅ 发现Git管理脚本');
                
                const useManager = await this.question('是否使用Git管理脚本？(y/n): ');
                if (useManager.toLowerCase() === 'y') {
                    console.log('💡 现在您可以使用以下命令:');
                    console.log('   node git-manager.js status');
                    console.log('   node git-manager.js add');
                    console.log('   node git-manager.js commit "提交信息"');
                    console.log('   node git-manager.js push origin main');
                    console.log('   node git-manager.js watch');
                }
            }
            
            return true;
        } catch (error) {
            console.error('❌ 设置Git管理脚本失败:', error.message);
            return false;
        }
    }

    /**
     * 提问函数
     */
    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    /**
     * 运行完整的连接流程
     */
    async run() {
        console.log('🚀 连接现有GitHub仓库工具');
        console.log('='.repeat(40));
        
        try {
            // 1. 检查Git状态
            const hasGit = this.checkGitStatus();
            
            // 2. 初始化Git仓库（如果需要）
            if (!hasGit) {
                if (!await this.initGitRepo()) {
                    return;
                }
            }
            
            // 3. 设置远程仓库
            const remoteUrl = await this.setRemoteRepo();
            if (!remoteUrl) {
                return;
            }
            
            // 4. 拉取远程内容（可选）
            await this.pullRemoteContent();
            
            // 5. 添加并提交本地文件
            if (!await this.addAndCommitFiles()) {
                return;
            }
            
            // 6. 推送到远程仓库
            await this.pushToRemote();
            
            // 7. 设置Git管理脚本
            await this.setupGitManager();
            
            console.log('\n🎉 仓库连接完成！');
            console.log('='.repeat(40));
            console.log('📋 您的仓库信息:');
            console.log(`   远程URL: ${remoteUrl}`);
            console.log('   分支: main');
            console.log('\n💡 常用命令:');
            console.log('   git status                    # 查看状态');
            console.log('   git add .                     # 添加文件');
            console.log('   git commit -m "消息"          # 提交更改');
            console.log('   git push origin main          # 推送到远程');
            console.log('   git pull origin main          # 拉取远程更新');
            
            if (fs.existsSync('git-manager.js')) {
                console.log('\n🚀 使用Git管理脚本:');
                console.log('   node git-manager.js watch  # 自动监控和提交');
            }
            
        } catch (error) {
            console.error('❌ 连接过程中出现错误:', error.message);
        } finally {
            this.rl.close();
        }
    }
}

// 运行连接器
if (require.main === module) {
    const connector = new RepoConnector();
    connector.run();
}

module.exports = RepoConnector;
