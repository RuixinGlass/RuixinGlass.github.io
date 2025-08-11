#!/usr/bin/env node

/**
 * GitHub SSH自动设置脚本
 * 帮助用户快速设置SSH密钥并配置GitHub
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');
const os = require('os');

class SSHSetup {
    constructor() {
        this.sshDir = path.join(os.homedir(), '.ssh');
        this.privateKeyPath = path.join(this.sshDir, 'id_rsa');
        this.publicKeyPath = path.join(this.sshDir, 'id_rsa.pub');
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * 检查SSH密钥是否存在
     */
    checkExistingKeys() {
        try {
            if (fs.existsSync(this.privateKeyPath) && fs.existsSync(this.publicKeyPath)) {
                console.log('✅ 发现现有SSH密钥');
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * 生成SSH密钥
     */
    async generateSSHKey() {
        try {
            console.log('🔄 生成SSH密钥...');
            
            // 确保.ssh目录存在
            if (!fs.existsSync(this.sshDir)) {
                fs.mkdirSync(this.sshDir, { recursive: true });
            }

            // 生成SSH密钥
            const email = await this.question('请输入您的GitHub邮箱地址: ');
            
            console.log('正在生成SSH密钥，请按提示操作...');
            execSync(`ssh-keygen -t rsa -b 4096 -C "${email}" -f "${this.privateKeyPath}" -N ""`, {
                stdio: 'inherit'
            });
            
            console.log('✅ SSH密钥生成成功');
            return true;
        } catch (error) {
            console.error('❌ 生成SSH密钥失败:', error.message);
            return false;
        }
    }

    /**
     * 启动SSH代理并添加密钥
     */
    startSSHAgent() {
        try {
            console.log('🔄 启动SSH代理...');
            
            // 检测操作系统
            const platform = process.platform;
            
            if (platform === 'win32') {
                // Windows系统
                try {
                    // 尝试启动SSH代理
                    execSync('ssh-agent', { stdio: 'pipe' });
                } catch (e) {
                    // 如果ssh-agent命令不存在，跳过
                    console.log('ℹ️ SSH代理不可用，跳过代理启动');
                }
                
                // 直接添加密钥（Windows通常不需要ssh-agent）
                try {
                    execSync(`ssh-add "${this.privateKeyPath}"`, { stdio: 'pipe' });
                    console.log('✅ SSH密钥添加成功');
                } catch (e) {
                    console.log('ℹ️ SSH密钥已存在或无需添加到代理');
                }
            } else {
                // Linux/Mac系统
                execSync('eval "$(ssh-agent -s)"', { shell: true });
                execSync(`ssh-add "${this.privateKeyPath}"`);
            }
            
            console.log('✅ SSH代理启动成功');
            return true;
        } catch (error) {
            console.error('❌ 启动SSH代理失败:', error.message);
            return false;
        }
    }

    /**
     * 获取公钥内容
     */
    getPublicKey() {
        try {
            const publicKey = fs.readFileSync(this.publicKeyPath, 'utf8');
            return publicKey.trim();
        } catch (error) {
            console.error('❌ 读取公钥失败:', error.message);
            return null;
        }
    }

    /**
     * 测试SSH连接
     */
    testSSHConnection() {
        try {
            console.log('🔄 测试SSH连接...');
            const result = execSync('ssh -T git@github.com', { 
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            if (result.includes('successfully authenticated')) {
                console.log('✅ SSH连接测试成功');
                return true;
            } else {
                console.log('⚠️ SSH连接测试结果:', result);
                return false;
            }
        } catch (error) {
            if (error.stdout && error.stdout.includes('successfully authenticated')) {
                console.log('✅ SSH连接测试成功');
                return true;
            } else {
                console.error('❌ SSH连接测试失败:', error.message);
                return false;
            }
        }
    }

    /**
     * 设置Git配置
     */
    async setupGitConfig() {
        try {
            console.log('🔄 设置Git配置...');
            
            const name = await this.question('请输入您的Git用户名: ');
            const email = await this.question('请输入您的Git邮箱: ');
            
            execSync(`git config --global user.name "${name}"`);
            execSync(`git config --global user.email "${email}"`);
            
            console.log('✅ Git配置设置成功');
            return true;
        } catch (error) {
            console.error('❌ 设置Git配置失败:', error.message);
            return false;
        }
    }

    /**
     * 显示公钥并指导添加到GitHub
     */
    showPublicKeyInstructions() {
        const publicKey = this.getPublicKey();
        if (!publicKey) {
            console.error('❌ 无法获取公钥');
            return;
        }

        console.log('\n📋 请将以下公钥添加到GitHub:');
        console.log('='.repeat(50));
        console.log(publicKey);
        console.log('='.repeat(50));
        
        console.log('\n📝 添加步骤:');
        console.log('1. 复制上面的公钥内容');
        console.log('2. 登录 GitHub.com');
        console.log('3. 点击右上角头像 → Settings');
        console.log('4. 左侧菜单点击 "SSH and GPG keys"');
        console.log('5. 点击 "New SSH key"');
        console.log('6. Title填写: My Computer');
        console.log('7. Key粘贴刚才复制的内容');
        console.log('8. 点击 "Add SSH key"');
        
        console.log('\n💡 添加完成后，按回车键继续...');
    }

    /**
     * 设置GitHub仓库
     */
    async setupGitHubRepo() {
        try {
            console.log('\n🔄 设置GitHub仓库...');
            
            const username = await this.question('请输入您的GitHub用户名: ');
            const repoName = await this.question('请输入仓库名称 (默认: notes-system): ') || 'notes-system';
            
            const sshUrl = `git@github.com:${username}/${repoName}.git`;
            
            console.log(`\n📋 请先在GitHub上创建仓库: ${repoName}`);
            console.log('1. 登录 GitHub.com');
            console.log('2. 点击右上角 "+" → "New repository"');
            console.log(`3. Repository name: ${repoName}`);
            console.log('4. Description: 严谨的版本控制笔记系统');
            console.log('5. 选择 Private (私有)');
            console.log('6. 不要勾选 "Add a README file"');
            console.log('7. 点击 "Create repository"');
            
            await this.question('\n创建完成后，按回车键继续...');
            
            // 使用我们的Git管理脚本设置远程仓库
            try {
                execSync(`node git-manager.js remote ${sshUrl}`, { stdio: 'inherit' });
                console.log('✅ GitHub仓库设置成功');
                return sshUrl;
            } catch (error) {
                console.log('⚠️ 自动设置失败，请手动设置:');
                console.log(`git remote add origin ${sshUrl}`);
                return sshUrl;
            }
        } catch (error) {
            console.error('❌ 设置GitHub仓库失败:', error.message);
            return null;
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
     * 运行完整的设置流程
     */
    async run() {
        console.log('🚀 GitHub SSH自动设置工具');
        console.log('='.repeat(40));
        
        try {
            // 1. 检查现有密钥
            if (this.checkExistingKeys()) {
                const useExisting = await this.question('发现现有SSH密钥，是否使用？(y/n): ');
                if (useExisting.toLowerCase() !== 'y') {
                    console.log('请手动删除现有密钥后重新运行');
                    return;
                }
            } else {
                // 2. 生成SSH密钥
                if (!await this.generateSSHKey()) {
                    return;
                }
            }
            
            // 3. 启动SSH代理
            if (!this.startSSHAgent()) {
                return;
            }
            
            // 4. 设置Git配置
            if (!await this.setupGitConfig()) {
                return;
            }
            
            // 5. 显示公钥并指导添加到GitHub
            this.showPublicKeyInstructions();
            await this.question('');
            
            // 6. 测试SSH连接
            if (!this.testSSHConnection()) {
                console.log('⚠️ SSH连接测试失败，请检查GitHub设置');
                return;
            }
            
            // 7. 设置GitHub仓库
            const sshUrl = await this.setupGitHubRepo();
            
            console.log('\n🎉 SSH设置完成！');
            console.log('='.repeat(40));
            console.log('现在您可以使用以下命令:');
            console.log(`node git-manager.js push origin main`);
            console.log(`node git-manager.js pull origin main`);
            
            if (sshUrl) {
                console.log(`\n📋 您的SSH URL: ${sshUrl}`);
            }
            
        } catch (error) {
            console.error('❌ 设置过程中出现错误:', error.message);
        } finally {
            this.rl.close();
        }
    }
}

// 运行设置
if (require.main === module) {
    const setup = new SSHSetup();
    setup.run();
}

module.exports = SSHSetup;
