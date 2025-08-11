#!/usr/bin/env node

/**
 * HTTPS连接GitHub仓库脚本
 * 使用Personal Access Token连接GitHub仓库
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

class HTTPSRepoConnector {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * 检查Git状态
     */
    checkGitStatus() {
        try {
            const gitDir = path.join(process.cwd(), '.git');
            return fs.existsSync(gitDir);
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
     * 设置Git用户配置
     */
    async setupGitConfig() {
        try {
            console.log('🔄 设置Git用户配置...');
            
            const username = await this.question('请输入您的GitHub用户名: ');
            const email = await this.question('请输入您的GitHub邮箱: ');
            
            execSync(`git config user.name "${username}"`);
            execSync(`git config user.email "${email}"`);
            
            console.log('✅ Git用户配置设置成功');
            return true;
        } catch (error) {
            console.error('❌ 设置Git配置失败:', error.message);
            return false;
        }
    }

    /**
     * 检查现有远程仓库
     */
    checkExistingRemote() {
        try {
            const remotes = execSync('git remote -v', { encoding: 'utf8' });
            if (remotes.includes('origin')) {
                const originUrl = remotes.split('\n').find(line => line.includes('origin')).split('\t')[1];
                return originUrl;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * 设置HTTPS远程仓库
     */
    async setHTTPSRemote() {
        try {
            console.log('🔄 设置HTTPS远程仓库...');
            
            // 检查是否已有远程仓库
            const existingRemote = this.checkExistingRemote();
            if (existingRemote) {
                console.log(`📋 发现现有远程仓库: ${existingRemote}`);
                const useExisting = await this.question('是否使用现有远程仓库？(y/n，默认: y): ') || 'y';
                if (useExisting.toLowerCase() === 'y') {
                    console.log('✅ 使用现有远程仓库');
                    return existingRemote;
                } else {
                    // 删除现有远程仓库
                    console.log('🔄 删除现有远程仓库...');
                    execSync('git remote remove origin');
                    console.log('✅ 现有远程仓库已删除');
                }
            }
            
            const useExisting = await this.question('是否使用现有仓库？(y/n，默认: y): ') || 'y';
            
            if (useExisting.toLowerCase() === 'y') {
                // 使用现有仓库
                const username = await this.question('请输入您的GitHub用户名: ');
                const repoName = await this.question('请输入现有仓库名称 (默认: RuixinGlass.github.io): ') || 'RuixinGlass.github.io';
                
                const httpsUrl = `https://github.com/${username}/${repoName}.git`;
                
                console.log(`\n📋 连接到现有仓库: ${repoName}`);
                console.log(`   仓库URL: ${httpsUrl}`);
                console.log('   注意: 如果仓库已有内容，可能需要先拉取');
                
                await this.question('\n确认后，按回车键继续...');
                
                // 设置远程仓库
                execSync(`git remote add origin ${httpsUrl}`);
                console.log('✅ HTTPS远程仓库设置成功');
                
                return httpsUrl;
            } else {
                // 创建新仓库
                const username = await this.question('请输入您的GitHub用户名: ');
                const repoName = await this.question('请输入新仓库名称 (默认: notes-system): ') || 'notes-system';
                
                const httpsUrl = `https://github.com/${username}/${repoName}.git`;
                
                console.log(`\n📋 请先在GitHub上创建仓库: ${repoName}`);
                console.log('1. 登录 GitHub.com');
                console.log('2. 点击右上角 "+" → "New repository"');
                console.log(`3. Repository name: ${repoName}`);
                console.log('4. Description: 严谨的版本控制笔记系统');
                
                const visibility = await this.question('选择仓库可见性 (public/private，默认: public): ') || 'public';
                if (visibility.toLowerCase() === 'public') {
                    console.log('5. 选择 Public (公开) - 可以使用GitHub Pages');
                } else {
                    console.log('5. 选择 Private (私有) - 无法使用GitHub Pages');
                }
                
                console.log('6. 不要勾选 "Add a README file"');
                console.log('7. 点击 "Create repository"');
                
                await this.question('\n创建完成后，按回车键继续...');
                
                // 设置远程仓库
                execSync(`git remote add origin ${httpsUrl}`);
                console.log('✅ HTTPS远程仓库设置成功');
                
                return httpsUrl;
            }
        } catch (error) {
            console.error('❌ 设置HTTPS远程仓库失败:', error.message);
            return null;
        }
    }

    /**
     * 拉取现有内容（如果需要）
     */
    async pullExistingContent() {
        try {
            console.log('🔄 检查是否需要拉取现有内容...');
            
            // 检查远程分支
            const branches = execSync('git branch -r', { encoding: 'utf8' });
            if (branches.includes('origin/main') || branches.includes('origin/master')) {
                const shouldPull = await this.question('发现远程分支，是否先拉取现有内容？(y/n，默认: y): ') || 'y';
                if (shouldPull.toLowerCase() === 'y') {
                    console.log('🔄 拉取现有内容...');
                    execSync('git pull origin main --allow-unrelated-histories', { stdio: 'inherit' });
                    console.log('✅ 拉取成功');
                }
            }
            return true;
        } catch (error) {
            console.log('ℹ️ 拉取失败或无需拉取:', error.message);
            return true;
        }
    }

    /**
     * 添加并提交文件
     */
    async addAndCommitFiles() {
        try {
            console.log('🔄 添加并提交文件...');
            
            // 添加所有文件
            execSync('git add .', { stdio: 'inherit' });
            
            // 检查是否有文件需要提交
            const status = execSync('git status --porcelain', { encoding: 'utf8' });
            if (!status.trim()) {
                console.log('ℹ️ 没有文件需要提交');
                return true;
            }
            
            const commitMessage = await this.question('请输入提交信息 (默认: 更新笔记系统): ') || '更新笔记系统';
            execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
            
            console.log('✅ 文件提交成功');
            return true;
        } catch (error) {
            console.error('❌ 提交文件失败:', error.message);
            return false;
        }
    }

    /**
     * 推送到远程仓库
     */
    async pushToRemote() {
        try {
            console.log('🔄 推送到远程仓库...');
            console.log('💡 系统会提示输入GitHub用户名和Personal Access Token');
            console.log('   用户名: 您的GitHub用户名');
            console.log('   密码: 您的Personal Access Token (不是GitHub密码)');
            
            await this.question('\n准备好后，按回车键继续...');
            
            execSync('git push -u origin main', { stdio: 'inherit' });
            
            console.log('✅ 推送成功！');
            return true;
        } catch (error) {
            console.error('❌ 推送失败:', error.message);
            console.log('\n💡 如果推送失败，请检查:');
            console.log('1. Personal Access Token是否正确');
            console.log('2. 仓库URL是否正确');
            console.log('3. 网络连接是否正常');
            return false;
        }
    }

    /**
     * 设置Git管理脚本
     */
    async setupGitManager() {
        try {
            if (fs.existsSync('git-manager.js')) {
                console.log('\n🔄 设置Git管理脚本...');
                
                // 修改git-manager.js以支持HTTPS
                const gitManagerContent = fs.readFileSync('git-manager.js', 'utf8');
                const updatedContent = gitManagerContent.replace(
                    /git remote add origin (.*)/g,
                    'git remote add origin https://github.com/$1'
                );
                fs.writeFileSync('git-manager.js', updatedContent);
                
                console.log('✅ Git管理脚本已更新为HTTPS模式');
            }
        } catch (error) {
            console.log('⚠️ 更新Git管理脚本失败:', error.message);
        }
    }

    /**
     * 显示Personal Access Token设置指南
     */
    showTokenGuide() {
        console.log('\n📋 Personal Access Token设置指南:');
        console.log('='.repeat(50));
        console.log('1. 登录 GitHub.com');
        console.log('2. 点击右上角头像 → Settings');
        console.log('3. 左侧菜单点击 "Developer settings"');
        console.log('4. 点击 "Personal access tokens" → "Tokens (classic)"');
        console.log('5. 点击 "Generate new token" → "Generate new token (classic)"');
        console.log('6. 设置Token:');
        console.log('   - Note: Notes System Token');
        console.log('   - Expiration: 90 days');
        console.log('   - Scopes: 勾选 "repo"');
        console.log('7. 点击 "Generate token"');
        console.log('8. 复制生成的Token (重要：只显示一次！)');
        console.log('='.repeat(50));
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
     * 运行完整的HTTPS连接流程
     */
    async run() {
        console.log('🚀 HTTPS连接GitHub仓库工具');
        console.log('='.repeat(40));
        
        try {
            // 显示Token设置指南
            this.showTokenGuide();
            await this.question('\n请先创建Personal Access Token，完成后按回车键继续...');
            
            // 1. 检查Git状态
            const hasGit = this.checkGitStatus();
            
            // 2. 初始化Git仓库（如果需要）
            if (!hasGit) {
                if (!await this.initGitRepo()) {
                    return;
                }
            }
            
            // 3. 设置Git用户配置
            if (!await this.setupGitConfig()) {
                return;
            }
            
            // 4. 设置HTTPS远程仓库
            const httpsUrl = await this.setHTTPSRemote();
            if (!httpsUrl) {
                return;
            }
            
            // 5. 拉取现有内容（如果需要）
            await this.pullExistingContent();
            
            // 6. 添加并提交本地文件
            if (!await this.addAndCommitFiles()) {
                return;
            }
            
            // 7. 推送到远程仓库
            await this.pushToRemote();
            
            // 8. 设置Git管理脚本
            await this.setupGitManager();
            
            console.log('\n🎉 HTTPS仓库连接完成！');
            console.log('='.repeat(40));
            console.log('📋 您的仓库信息:');
            console.log(`   远程URL: ${httpsUrl}`);
            console.log('   认证方式: HTTPS + Personal Access Token');
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
            
            console.log('\n⚠️ 重要提醒:');
            console.log('   - 请妥善保管您的Personal Access Token');
            console.log('   - Token有90天有效期，请及时更新');
            console.log('   - 如果Token泄露，请立即在GitHub中删除');
            
        } catch (error) {
            console.error('❌ 连接过程中出现错误:', error.message);
        } finally {
            this.rl.close();
        }
    }
}

// 运行连接
if (require.main === module) {
    const connector = new HTTPSRepoConnector();
    connector.run();
}

module.exports = HTTPSRepoConnector;
