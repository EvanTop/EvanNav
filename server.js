const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3003;
const DATA_FILE = path.join(__dirname, 'data.json');

// 缓存数据，减少文件读写
let dataCache = null;
let dataCacheTime = 0;
const CACHE_TTL = 60 * 1000; // 缓存有效期1分钟

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 读取数据文件（带缓存）
function readData() {
    const now = Date.now();
    
    // 如果缓存有效，直接返回缓存数据
    if (dataCache && (now - dataCacheTime < CACHE_TTL)) {
        return JSON.parse(JSON.stringify(dataCache)); // 返回深拷贝，防止引用修改
    }
    
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const parsedData = JSON.parse(data);
        
        // 确保返回的数据结构完整
        const result = {
            links: parsedData.links || [
                {
                    name: "Evan's Space",
                    url: "https://www.evan.xin",
                    category: "博客",
                    description: "EvanNav Designer",
                    status: "normal",
                    logo: "https://www.evan.xin/logo.png",
                    lastChecked: null
                }
            ],
            categories: parsedData.categories || ["博客", "工具", "收藏"],
            settings: parsedData.settings || {
                websiteLogo: '',
                websiteTitle: 'My Website Favorites',
                footerInfo: '© EvanNav',
                autoCheck: {
                    enabled: true,
                    interval: 24,
                    checkTime: "03:00",
                    lastRun: null
                }
            },
            adminPassword: parsedData.adminPassword || 'admin123456'
        };
        
        // 更新缓存
        dataCache = JSON.parse(JSON.stringify(result));
        dataCacheTime = now;
        
        return result;
    } catch (error) {
        console.error('读取数据文件失败:', error);
        
        // 如果文件不存在或解析失败，返回默认数据
        const defaultData = {
            links: [
                {
                    name: "Evan's Space",
                    url: "https://www.evan.xin",
                    category: "博客",
                    description: "EvanNav Designer",
                    status: "normal",
                    logo: "https://www.evan.xin/logo.png",
                    lastChecked: null
                }
            ],
            categories: ["博客", "工具", "收藏"],
            settings: {
                websiteLogo: '',
                websiteTitle: 'My Website Favorites',
                footerInfo: '© EvanNav',
                autoCheck: {
                    enabled: true,
                    interval: 24,
                    checkTime: "03:00",
                    lastRun: null
                }
            },
            adminPassword: 'admin123456'
        };
        
        // 更新缓存
        dataCache = JSON.parse(JSON.stringify(defaultData));
        dataCacheTime = now;
        
        return defaultData;
    }
}

// 写入数据文件
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        
        // 更新缓存
        dataCache = JSON.parse(JSON.stringify(data));
        dataCacheTime = Date.now();
        
        return true;
    } catch (error) {
        console.error('写入数据文件失败:', error);
        return false;
    }
}

// 链接检测函数（带并发控制）
async function checkLinkStatus(url) {
    try {
        const response = await axios.get(url, {
            timeout: 10000, // 10秒超时
            validateStatus: false, // 不抛出HTTP错误
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        // 2xx 状态码表示链接正常
        return response.status >= 200 && response.status < 300 ? 'normal' : 'error';
    } catch (error) {
        // 请求失败，链接异常
        return 'error';
    }
}

// 检查所有链接（带并发控制）
async function checkAllLinks() {
    console.log('开始检查所有链接...');
    const data = readData();
    const currentTime = new Date().toISOString();
    
    // 更新最后运行时间
    if (data.settings.autoCheck) {
        data.settings.autoCheck.lastRun = currentTime;
        // 立即保存更新后的设置，确保lastRun时间被正确记录
        writeData(data);
    }
    
    // 并发控制
    const MAX_CONCURRENT = 5; // 最大并发数
    const links = [...data.links]; // 复制链接数组
    const results = [];
    
    // 分批处理链接
    for (let i = 0; i < links.length; i += MAX_CONCURRENT) {
        const batch = links.slice(i, i + MAX_CONCURRENT);
        const batchPromises = batch.map(async (link, batchIndex) => {
            const index = i + batchIndex;
            console.log(`检查链接 [${index + 1}/${links.length}]: ${link.name} (${link.url})`);
            
            try {
                const status = await checkLinkStatus(link.url);
                console.log(`链接 ${link.name} 状态: ${status}`);
                
                // 记录状态变化
                if (link.status !== status) {
                    console.log(`链接 ${link.name} 状态变化: ${link.status} -> ${status}`);
                }
                
                return {
                    index,
                    status,
                    lastChecked: currentTime
                };
            } catch (error) {
                console.error(`检查链接 ${link.name} 失败:`, error);
                return {
                    index,
                    error: true
                };
            }
        });
        
        // 等待当前批次完成
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
    }
    
    // 更新链接状态
    results.forEach(result => {
        if (!result.error) {
            data.links[result.index].status = result.status;
            data.links[result.index].lastChecked = result.lastChecked;
        }
    });
    
    // 再次读取数据，确保获取最新状态
    const updatedData = readData();
    
    // 确保保留最新的lastRun时间
    updatedData.settings.autoCheck.lastRun = currentTime;
    
    // 更新链接状态
    results.forEach(result => {
        if (!result.error) {
            updatedData.links[result.index].status = result.status;
            updatedData.links[result.index].lastChecked = result.lastChecked;
        }
    });
    
    // 保存更新后的数据
    writeData(updatedData);
    console.log('链接检查完成');
}

// 手动触发链接检查
app.post('/api/check-links', async (req, res) => {
    try {
        // 使用非阻塞方式执行链接检查
        res.json({ success: true, message: '链接检查已开始' });
        
        // 在响应发送后执行检查
        await checkAllLinks();
        
        // 记录日志
        console.log('手动触发的链接检查已完成');
    } catch (error) {
        console.error('链接检查失败:', error);
        // 由于已经发送了响应，这里只记录错误
    }
});

// 设置定时任务
function setupCronJob() {
    const data = readData();
    const { enabled, interval, checkTime } = data.settings.autoCheck;
    
    if (!enabled) {
        console.log('自动检查功能已禁用');
        return;
    }
    
    // 解析检查时间
    const [hour, minute] = checkTime.split(':').map(Number);
    
    // 创建cron表达式 - 每天指定时间运行
    const cronExpression = `${minute} ${hour} */${interval} * *`;
    console.log(`设置定时任务: ${cronExpression}`);
    
    // 设置定时任务
    const job = cron.schedule(cronExpression, () => {
        console.log('执行定时链接检查');
        checkAllLinks().catch(err => {
            console.error('定时链接检查失败:', err);
        });
    });
    
    return job;
}

// 错误处理中间件
function errorHandler(fn) {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            console.error('API错误:', error);
            res.status(500).json({ 
                error: '服务器内部错误',
                message: error.message 
            });
        }
    };
}

// API 路由
app.get('/api/links', errorHandler(async (req, res) => {
    const data = readData();
    res.json(data.links);
}));

app.post('/api/links', errorHandler(async (req, res) => {
    const data = readData();
    // 确保新链接包含lastChecked字段
    const newLink = {
        ...req.body,
        lastChecked: null
    };
    data.links.push(newLink);
    writeData(data);
    res.status(201).json(newLink);
}));

app.put('/api/links/:index', errorHandler(async (req, res) => {
    const data = readData();
    const index = parseInt(req.params.index);
    if (index >= 0 && index < data.links.length) {
        // 保留lastChecked字段
        const lastChecked = data.links[index].lastChecked;
        data.links[index] = {
            ...req.body,
            lastChecked
        };
        writeData(data);
        res.json(data.links[index]);
    } else {
        res.status(404).json({ error: 'Link not found' });
    }
}));

app.put('/api/links', errorHandler(async (req, res) => {
    const data = readData();
    // 确保所有链接都有lastChecked字段
    data.links = req.body.map((link, index) => {
        const oldLink = data.links[index] || {};
        return {
            ...link,
            lastChecked: link.lastChecked || oldLink.lastChecked || null
        };
    });
    writeData(data);
    res.json(data.links);
}));

app.delete('/api/links/:index', errorHandler(async (req, res) => {
    const data = readData();
    const index = parseInt(req.params.index);
    if (index >= 0 && index < data.links.length) {
        data.links.splice(index, 1);
        writeData(data);
        res.status(204).end();
    } else {
        res.status(404).json({ error: 'Link not found' });
    }
}));

app.get('/api/categories', errorHandler(async (req, res) => {
    const data = readData();
    res.json(data.categories);
}));

app.post('/api/categories', errorHandler(async (req, res) => {
    const data = readData();
    data.categories.push(req.body.name);
    writeData(data);
    res.status(201).json(req.body);
}));

app.delete('/api/categories/:index', errorHandler(async (req, res) => {
    const data = readData();
    const index = parseInt(req.params.index);
    if (index >= 0 && index < data.categories.length) {
        data.categories.splice(index, 1);
        writeData(data);
        res.status(204).end();
    } else {
        res.status(404).json({ error: 'Category not found' });
    }
}));

app.get('/api/settings', errorHandler(async (req, res) => {
    const data = readData();
    res.json(data.settings);
}));

app.put('/api/settings', errorHandler(async (req, res) => {
    const data = readData();
    data.settings = req.body;
    writeData(data);
    
    // 更新定时任务
    if (global.cronJob) {
        global.cronJob.stop();
    }
    global.cronJob = setupCronJob();
    
    res.json(data.settings);
}));

app.post('/api/login', errorHandler(async (req, res) => {
    const data = readData();
    const { password } = req.body;
    if (data.adminPassword === password) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
}));

app.post('/api/change-password', errorHandler(async (req, res) => {
    const data = readData();
    const { oldPassword, newPassword } = req.body;
    if (data.adminPassword === oldPassword) {
        data.adminPassword = newPassword;
        writeData(data);
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid old password' });
    }
}));

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('未捕获的错误:', err);
    res.status(500).json({ 
        error: '服务器内部错误',
        message: err.message 
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    
    // 初始化定时任务
    global.cronJob = setupCronJob();
});
