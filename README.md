# LiberNotes(自由便签)

<p align="center">   <img src="build/icon.ico" width="200"> </p>

一个简洁高效的桌面悬浮便签应用，让你随时记录想法，随时查看备忘。

## 功能特性

-  **悬浮便签** - 创建和管理多个浮动在桌面上的便签
-   **双击 Ctrl** - 使用双击 Ctrl 快捷键快速显示/隐藏所有便签
-  **可拖拽** - 自由拖拽便签到屏幕任意位置
-  **置顶显示** - 便签始终显示在其他窗口之上
-  **简洁界面** - 现代化极简设计，带有流畅动画效果
-  **系统托盘** - 从系统托盘图标访问应用

## 技术栈

**Electron + React + TypeScript + Vite + Tailwind CSS + Framer Motion + Zustand**

## QuickStart

无需安装 Node.js 或编译，直接下载使用：

1. 前往 [Releases](https://github.com/imeelinew/libernotes/releases) 页面
2. 下载最新版本的 `LiberNotes Setup 1.0.0.exe`
3. 运行安装程序，按提示完成安装
4. 从开始菜单或桌面快捷方式启动应用

## 使用说明

### 快捷键

- **双击 Ctrl** - 显示/隐藏所有便签

### 系统托盘

- 点击托盘图标显示/隐藏便签
- 右键点击打开菜单（显示/隐藏、退出）

### 便签管理

- 点击并拖拽移动便签位置
- 点击 X 按钮删除便签
- 便签内容自动保存

## 开发

### 环境要求

- Node.js 18+
- npm 或 yarn

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/yourusername/liber-notes.git
cd liber-notes

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建安装包
npm run electron:build
```

### 常用命令

```bash
# 启动开发服务器
npm run dev

# 仅构建 Web 应用
npm run build

# 构建 Electron 主进程
npm run build:electron

# 本地运行生产版本
npm run electron:dev

# 构建安装包
npm run electron:build
```

## 项目结构

```
liber-notes/
├── build/                  # 构建资源（图标）
├── dist/                   # Web 构建输出
├── dist-electron/          # Electron 构建输出
├── electron/               # Electron 主进程
│   ├── main.ts            # 主入口
│   └── preload.ts         # 预加载脚本
├── release/               # 分发输出
├── scripts/               # 构建脚本
├── src/                   # React 前端
│   ├── components/        # React 组件
│   ├── stores/           # 状态管理
│   └── types/            # TypeScript 类型
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 构建打包

### Windows

```bash
npm run electron:build
```

输出文件：
- `release/LiberNotes Setup 1.0.0.exe` - 安装程序
- `release/win-unpacked/` - 便携版

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
