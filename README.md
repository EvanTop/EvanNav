# EvanNav

[![Blog-Evan's Space](https://img.shields.io/badge/Blog-Evan's%20Space-black?logo=blog&color=blueviolet)](https://evan.xin)
[![Repo Size](https://img.shields.io/github/repo-size/EvanTop/EvanNav)](https://github.com/EvanTop/EvanNav)
[![Stars](https://img.shields.io/github/stars/EvanTop/EvanNav)](https://github.com/EvanTop/EvanNav/stargazers)



https://img.shields.io/badge/Blog-Evan's%20Space-black?logo=blog&color=blueviolet
- 轻盈设计，优雅体验，专属你的个人私有化导航和收藏  
- 一位HR写的第一个程序，基于Node.js多点鼓励，多点星星✨  
- 欢迎推荐给任何平台或个人，祝大家玩的愉快！

|![QQ](https://i.imgur.com/zGqbG1s.png)|![QQ](https://i.imgur.com/K94PINK.png)|
| ---      | ---       |

# EvanNav 项目部署文档

## 一、环境准备

### 1.1 服务器环境
- 操作系统：CentOS 7 或 Ubuntu 20.04
- 硬件要求：至少 1 核 CPU，2GB 内存，20GB 磁盘空间
- 网络要求：确保服务器能够访问互联网，且防火墙允许 HTTP/HTTPS 流量

### 1.2 安装 Node.js 环境
1. 登录宝塔面板：使用浏览器访问 `http://your-server-ip:8888`，并登录宝塔面板。
2. 进入软件商店：点击左侧菜单中的“软件商店”。
3. 安装 Node.js：
   - 在软件商店中搜索“Node.js”。
   - 选择合适的版本（建议使用 LTS 版本）并点击“安装”。

## 二、项目部署

### 2.1 上传项目文件
1. 创建项目目录：`mkdir -p /www/wwwroot/project`
2. 上传文件：将项目文件上传到 `/www/wwwroot/project` 目录，可以使用宝塔面板的文件管理器或通过命令行工具如 SCP、FTP。

### 2.2 安装项目依赖
1. 进入项目目录：`cd /www/wwwroot/project`
2. 安装依赖：`npm install`

### 2.3 启动项目
1. 启动项目：`npm start`
2. 启动 server.js：`node server.js`

### 2.4 配置项目
1. 修改配置：根据您的需求修改 `data.json` 文件中的内容，包括管理员密码等。

## 三、项目维护

### 3.1 数据备份
1. 手动备份：定期备份 `data.json` 文件和项目数据。
2. 自动备份：设置 cron 任务定期备份项目数据。

### 3.2 更新项目
1. 拉取更新：通过手动上传更新后的项目文件。
2. 重新安装依赖：`npm install`
3. 重启项目：`npm start`

## 四、常见问题

### 4.1 端口占用问题
- 检查端口占用：`netstat -tulnp | grep 3003`
- 杀死占用进程：`kill -9 [PID]`

### 4.2 页面显示异常
- 清除缓存：清除浏览器缓存后重试。
- 检查文件：确保所有项目文件都已正确上传。

通过以上步骤，您应该能够成功部署和运行 EvanNav 项目。如有其他问题，请参考 Node.js 的官方文档或联系技术支持。

## 更新信息
2025.04.09
- 新增加载页面（LOGO和网站标题同步显示）
- 主页实现预加载，优化用户使用体验
- **更新说明：由于不太熟悉Github，新版本只在QQ群文件中发布。**

## 其他信息
- 默认后台密码：`admin123456`
- 官方网站：[evan.plus](https://evan.plus) 
- 作者Blog：[evan.xin](https://evan.xin) 和 [evan.top](https://evan.top)

- 公众号：
- ![公众号](https://www.evan.xin/wp-content/uploads/2025/04/111.png)
- 打赏码：
- ![公众号](https://www.evan.xin/wp-content/uploads/2025/04/388-e1744121248572.png)
- QQ交流群：
- ![QQ](https://www.evan.xin/wp-content/uploads/2025/04/00000-e1744123000122.png)




