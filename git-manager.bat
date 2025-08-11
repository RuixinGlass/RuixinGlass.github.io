@echo off
chcp 65001 >nul
title 笔记Git管理器

echo.
echo ========================================
echo           笔记Git管理器
echo ========================================
echo.

if "%1"=="" (
    echo 用法: git-manager.bat [命令] [参数]
    echo.
    echo 命令:
    echo   init                   初始化Git仓库
    echo   status                 检查文件状态
    echo   add [文件...]          添加文件到暂存区
    echo   commit [消息]          提交更改
    echo   push [远程] [分支]     推送到远程仓库
    echo   pull [远程] [分支]     从远程仓库拉取
    echo   history [数量]         查看提交历史
    echo   branch [分支名]        创建新分支
    echo   switch [分支名]        切换分支
    echo   branches               列出所有分支
    echo   remote [URL] [名称]    设置远程仓库
    echo   watch                  开始监控文件变化
    echo   help                   显示此帮助信息
    echo.
    echo 示例:
    echo   git-manager.bat init
    echo   git-manager.bat status
    echo   git-manager.bat add notes-data.json
    echo   git-manager.bat commit "更新笔记内容"
    echo   git-manager.bat push origin main
    echo   git-manager.bat watch
    echo.
    pause
    exit /b
)

node git-manager.js %*

if errorlevel 1 (
    echo.
    echo ❌ 执行失败，请检查错误信息
    pause
)
