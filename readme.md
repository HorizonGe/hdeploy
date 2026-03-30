# hdeploy-cli

[![npm version](https://img.shields.io/npm/v/hdeploy-cli.svg)](https://www.npmjs.com/package/hdeploy-cli)
[![license](https://img.shields.io/npm/l/hdeploy-cli.svg)](https://github.com/HorizonGe/hdeploy/blob/main/LICENSE)

## 项目简介

hdeploy-cli 是一个轻量级、功能强大的 **前端项目自动化部署工具**，通过 **交互式配置** 和 **SSH 上传** 的方式，实现前端项目的一键部署。工具支持多环境配置、集群部署、自动备份、钉钉通知等功能，让部署工作变得简单高效。

### 🚀 核心特性

- **🔧 交互式配置**：通过命令行向导快速生成部署配置文件
- **📦 自动化打包**：支持自定义打包命令，自动构建项目
- **💾 ZIP 压缩传输**：自动压缩打包文件，提高传输效率
- **🔌 SSH 远程连接**：基于 SSH2 协议，安全可靠的服务器连接
- **🗂️ 自动备份**：支持部署前自动备份，保留历史版本
- **👥 集群部署**：支持同时部署到多台服务器
- **🔔 钉钉通知**：部署开始和完成自动发送钉钉消息提醒
- **🌐 自动预览**：部署完成后自动打开预览地址
- **🛡️ 安全可靠**：支持密码输入确认，防止误操作

## 🛠️ 功能模块

### 初始化配置

通过 `hdeploy init` 命令，以交互式方式快速生成部署配置文件，支持：

- 项目名称设置
- 多环境选择（dev/test/prod）
- 服务器连接配置（host/port/username/password）
- 打包命令配置
- 本地打包目录和远程部署路径配置
- 备份策略配置
- 钉钉通知配置
- 自动预览配置

### 部署执行

通过 `hdeploy deploy` 命令执行部署，支持：

- **单个环境部署**：指定环境名称单独部署
- **集群部署**：配置 cluster 数组，同时部署到多台服务器
- **确认提示**：部署前显示确认信息，防止误操作
- **任务进度**：清晰展示每个部署步骤的执行状态

### 备份管理

- 部署前自动备份远程文件
- 可配置最大备份版本数量
- 超过数量自动清理旧版本

### 通知机制

- 钉钉机器人通知
- 支持自定义开始和结束通知内容
- 可配置是否开启通知

## 📦 安装

### 环境要求

- **Node.js**: >= 16.0.0
- **npm** 或 **pnpm** 或 **yarn**

### 包管理器安装

```bash
# 使用 npm
npm install -g hdeploy-cli

# 使用 pnpm
pnpm add -g hdeploy-cli

# 使用 yarn
yarn global add hdeploy-cli
```

## 🚀 快速开始

### 第一步：初始化配置

在项目根目录下运行：

```bash
hdeploy init
```

按照提示完成配置：

1. 输入项目名称
2. 选择需要部署的环境（dev/test/prod）
3. 配置每个环境的详细信息：
   - 环境名称
   - 打包命令
   - 服务器地址、端口、用户名、密码
   - 本地打包目录
   - 远程部署路径
   - 是否备份
   - 是否删除远程文件
   - 是否显示确认提示
   - 是否删除本地打包文件
   - 是否开启钉钉通知
   - 是否自动打开预览

### 第二步：执行部署

```bash
# 部署到开发环境
hdeploy deploy -m dev

# 部署到测试环境
hdeploy deploy -m test

# 部署到生产环境
hdeploy deploy -m prod

# 集群部署（需在配置文件中配置 cluster）
hdeploy deploy -m cluster
```

## 📋 配置说明

### 配置文件结构

配置文件 `hdeploy.config.js` 会在项目根目录生成：

```javascript
module.exports = {
  projectName: "your-project-name",
  readyTimeout: 20000,
  cluster: [],
  dev: {
    name: "开发环境",
    script: "npm run build:dev",
    host: "192.168.1.100",
    port: 22,
    username: "root",
    password: "your-password",
    distPath: "dist",
    webDir: "/var/www/html",
    isBak: true,
    bakDir: "/var/www/backup",
    maxBakNum: 5,
    isDeleteRemoteFile: true,
    showConfirmMsg: true,
    isRemoveLocalFile: true,
    isOpenDingMsg: false,
    dingToken: "",
    dingStartMsg: "开始部署...",
    dingEndMsg: "部署完成！",
    isOpenPreview: false,
    previewUrl: "",
  },
  test: {
    // 测试环境配置
  },
  prod: {
    // 生产环境配置
  },
};
```

### 配置参数说明

| 参数名                 | 类型      | 必填 | 默认值  | 说明                                  |
| ---------------------- | --------- | ---- | ------- | ------------------------------------- |
| **projectName**        | `string`  | ✅   | -       | 项目名称                              |
| **readyTimeout**       | `number`  | ❌   | `20000` | SSH 连接超时时间（毫秒）              |
| **cluster**            | `array`   | ❌   | `[]`    | 集群环境列表，如 `['prod1', 'prod2']` |
| **name**               | `string`  | ✅   | -       | 环境名称                              |
| **script**             | `string`  | ✅   | -       | 打包命令，如 `npm run build`          |
| **host**               | `string`  | ✅   | -       | 服务器地址                            |
| **port**               | `number`  | ✅   | `22`    | SSH 端口号                            |
| **username**           | `string`  | ✅   | `root`  | 服务器用户名                          |
| **password**           | `string`  | ✅   | -       | 服务器密码                            |
| **distPath**           | `string`  | ✅   | `dist`  | 本地打包目录                          |
| **webDir**             | `string`  | ✅   | -       | 远程部署路径                          |
| **isBak**              | `boolean` | ❌   | `false` | 是否备份                              |
| **bakDir**             | `string`  | ❌   | -       | 备份目录路径                          |
| **maxBakNum**          | `number`  | ❌   | `5`     | 最大备份版本数量                      |
| **isDeleteRemoteFile** | `boolean` | ❌   | `true`  | 是否删除远程文件                      |
| **showConfirmMsg**     | `boolean` | ❌   | `true`  | 是否显示确认信息提示                  |
| **isRemoveLocalFile**  | `boolean` | ❌   | `true`  | 是否删除本地打包文件                  |
| **isOpenDingMsg**      | `boolean` | ❌   | `false` | 是否开启钉钉通知                      |
| **dingToken**          | `string`  | ❌   | -       | 钉钉机器人 Webhook Token              |
| **dingStartMsg**       | `string`  | ❌   | -       | 开始部署通知内容                      |
| **dingEndMsg**         | `string`  | ❌   | -       | 部署完成通知内容                      |
| **isOpenPreview**      | `boolean` | ❌   | `false` | 部署完成后是否自动打开预览            |
| **previewUrl**         | `string`  | ❌   | -       | 预览地址                              |

## 🔨 开发与构建

### 本地开发

```bash
# 克隆项目
git clone https://github.com/HorizonGe/hdeploy.git
cd hdeploy

# 安装依赖
pnpm install

# 链接到全局
pnpm link --global
```

### 发布到 npm

```bash
# 构建（如果需要）
# pnpm build

# 发布
npm publish
```

## 💡 使用示例

### 基本使用

```bash
# 1. 初始化配置
hdeploy-cli init

# 2. 部署到开发环境
hdeploy-cli deploy -m dev
```

### 集群部署配置

```javascript
// hdeploy.config.js
module.exports = {
  projectName: "my-project",
  readyTimeout: 20000,
  cluster: ["prod1", "prod2"],
  prod1: {
    name: "生产环境1",
    script: "npm run build:prod",
    host: "192.168.1.101",
    port: 22,
    username: "root",
    password: "password1",
    distPath: "dist",
    webDir: "/var/www/html",
    isBak: true,
    bakDir: "/var/www/backup",
    maxBakNum: 5,
    isDeleteRemoteFile: true,
    showConfirmMsg: true,
    isRemoveLocalFile: true,
    isOpenDingMsg: true,
    dingToken: "https://oapi.dingtalk.com/robot/send?access_token=xxx",
    dingStartMsg: "开始部署生产环境1...",
    dingEndMsg: "生产环境1部署完成！",
    isOpenPreview: true,
    previewUrl: "https://www.example.com",
  },
  prod2: {
    name: "生产环境2",
    script: "npm run build:prod",
    host: "192.168.1.102",
    port: 22,
    username: "root",
    password: "password2",
    distPath: "dist",
    webDir: "/var/www/html",
    isBak: true,
    bakDir: "/var/www/backup",
    maxBakNum: 5,
    isDeleteRemoteFile: true,
    showConfirmMsg: true,
    isRemoveLocalFile: true,
    isOpenDingMsg: true,
    dingToken: "https://oapi.dingtalk.com/robot/send?access_token=xxx",
    dingStartMsg: "开始部署生产环境2...",
    dingEndMsg: "生产环境2部署完成！",
    isOpenPreview: false,
  },
};
```

```bash
# 执行集群部署
hdeploy-cli deploy -m cluster
```

### 钉钉通知配置

1. 在钉钉群中添加自定义机器人
2. 获取 Webhook 地址
3. 在配置文件中设置：

```javascript
module.exports = {
  // ...
  prod: {
    // ...
    isOpenDingMsg: true,
    dingToken: "https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN",
    dingStartMsg: "🚀 开始部署项目到生产环境...",
    dingEndMsg: "✅ 项目部署完成！",
  },
};
```

## ⚠️ 重要事项

### 🔧 技术依赖

| 依赖项        | 版本要求    | 说明             |
| ------------- | ----------- | ---------------- |
| **Node.js**   | `>= 16.0.0` | 运行环境要求     |
| **ssh2**      | `^1.15.0`   | SSH 连接库       |
| **commander** | `^12.1.0`   | 命令行参数解析   |
| **inquirer**  | `^10.1.4`   | 交互式命令行界面 |

### 🎯 兼容性说明

- ✅ **支持平台**：Windows、macOS、Linux
- ✅ **支持服务器**：Linux 服务器（需要 SSH 服务）
- ✅ **支持项目**：任何前端项目（Vue、React、Angular 等）

### 🚨 安全提示

1. **密码安全**：配置文件中包含服务器密码，请确保：
   - 不要将 `hdeploy.config.js` 提交到版本控制
   - 在 `.gitignore` 中添加配置文件

2. **服务器权限**：确保部署用户对目标目录有读写权限

### 📝 .gitignore 建议

```
# hdeploy-cli 配置文件
hdeploy.config.js

# 打包目录
dist/
build/

# 压缩文件
*.zip
*.tar.gz
```

## 📚 故障排除

### 常见问题及解决方案

#### 1. SSH 连接失败

**可能原因：**

- 服务器地址或端口错误
- 用户名或密码错误
- 服务器防火墙阻止连接

**解决方案：**

```bash
# 检查是否能手动连接 SSH
ssh root@your-server-ip -p 22

# 确认配置文件中的 host、port、username、password 正确
```

#### 2. 打包失败

**可能原因：**

- 打包命令错误
- 项目依赖未安装
- Node.js 版本不兼容

**解决方案：**

```bash
# 手动执行打包命令测试
npm run build

# 检查 package.json 中的 scripts 配置
```

#### 3. 上传文件失败

**可能原因：**

- 远程目录不存在
- 没有写入权限
- 磁盘空间不足

**解决方案：**

```bash
# 检查远程目录是否存在
ssh root@your-server-ip "ls -la /var/www/html"

# 检查权限
ssh root@your-server-ip "ls -ld /var/www/html"

# 检查磁盘空间
ssh root@your-server-ip "df -h"
```

#### 4. 钉钉通知不发送

**可能原因：**

- Webhook Token 错误
- 钉钉机器人安全设置限制
- 网络连接问题

**解决方案：**

- 确认 Token 正确
- 检查钉钉机器人的安全设置（关键词、IP 白名单等）
- 确保网络可以访问钉钉 API

## 🔗 相关链接

- [NPM 包地址](https://www.npmjs.com/package/hdeploy-cli)
- [GitHub 仓库](https://github.com/HorizonGe/hdeploy)
- [ssh2 文档](https://github.com/mscdex/ssh2)
- [commander 文档](https://github.com/tj/commander.js)
- [inquirer 文档](https://github.com/SBoudrias/Inquirer.js)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 贡献步骤

1. **Fork** 项目到你的 GitHub 账号
2. **Clone** 分支到本地
3. **创建新分支**开发新功能
4. **提交代码**并推送到远程仓库
5. **创建 Pull Request**

### 开发规范

- 遵循现有代码风格
- 添加必要的注释和文档
- 确保新功能的稳定性和兼容性
- 使用 Prettier 格式化代码

## 📞 技术支持

如遇到问题，请提供以下信息：

- hdeploy 版本号：`hdeploy -v`
- Node.js 版本：`node -v`
- npm 版本：`npm -v`
- 错误复现步骤
- 控制台错误信息
- 操作系统信息

## 📜 许可证

[MIT License](LICENSE)

Copyright (c) 2024 HorizonGe

---

<div align="center">
  <p>✨ 感谢使用 hdeploy-cli！✨</p>
  <p>如果这个项目对你有帮助，请给我们一个 ⭐️</p>
</div>
