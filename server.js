const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3003;
const DATA_FILE = path.join(__dirname, 'data.json');

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 读取数据文件
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const parsedData = JSON.parse(data);
        
        // 确保返回的数据结构完整
        return {
            links: parsedData.links || [
                {
                    name: "Evan's Space",
                    url: "https://www.evan.xin",
                    category: "博客",
                    description: "EvanNav Designer",
                    status: "normal",
                    logo: "https://www.evan.xin/logo.png"
                }
            ],
            categories: parsedData.categories || ["博客", "工具", "收藏"],
            settings: parsedData.settings || {
                websiteLogo: '',
                websiteTitle: 'My Website Favorites',
                footerInfo: '© EvanNav'
            },
            adminPassword: parsedData.adminPassword || 'admin123456'
        };
    } catch (error) {
        // 如果文件不存在或解析失败，返回默认数据
        return {
            links: [
                {
                    name: "Evan's Space",
                    url: "https://www.evan.xin",
                    category: "博客",
                    description: "EvanNav Designer",
                    status: "normal",
                    logo: "https://www.evan.xin/logo.png"
                }
            ],
            categories: ["博客", "工具", "收藏"],
            settings: {
                websiteLogo: '',
                websiteTitle: 'My Website Favorites',
                footerInfo: '© EvanNav'
            },
            adminPassword: 'admin123456'
        };
    }
}

// 写入数据文件
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API 路由
app.get('/api/links', (req, res) => {
    const data = readData();
    res.json(data.links);
});

app.post('/api/links', (req, res) => {
    const data = readData();
    data.links.push(req.body);
    writeData(data);
    res.status(201).json(req.body);
});

app.put('/api/links/:index', (req, res) => {
    const data = readData();
    const index = parseInt(req.params.index);
    if (index >= 0 && index < data.links.length) {
        data.links[index] = req.body;
        writeData(data);
        res.json(data.links[index]);
    } else {
        res.status(404).json({ error: 'Link not found' });
    }
});

app.put('/api/links', (req, res) => {
    const data = readData();
    data.links = req.body;
    writeData(data);
    res.json(data.links);
});

app.delete('/api/links/:index', (req, res) => {
    const data = readData();
    const index = parseInt(req.params.index);
    if (index >= 0 && index < data.links.length) {
        data.links.splice(index, 1);
        writeData(data);
        res.status(204).end();
    } else {
        res.status(404).json({ error: 'Link not found' });
    }
});

app.get('/api/categories', (req, res) => {
    const data = readData();
    res.json(data.categories);
});

app.post('/api/categories', (req, res) => {
    const data = readData();
    data.categories.push(req.body.name);
    writeData(data);
    res.status(201).json(req.body);
});

app.delete('/api/categories/:index', (req, res) => {
    const data = readData();
    const index = parseInt(req.params.index);
    if (index >= 0 && index < data.categories.length) {
        data.categories.splice(index, 1);
        writeData(data);
        res.status(204).end();
    } else {
        res.status(404).json({ error: 'Category not found' });
    }
});

app.get('/api/settings', (req, res) => {
    const data = readData();
    res.json(data.settings);
});

app.put('/api/settings', (req, res) => {
    const data = readData();
    data.settings = req.body;
    writeData(data);
    res.json(data.settings);
});

app.post('/api/login', (req, res) => {
    const data = readData();
    const { password } = req.body;
    if (data.adminPassword === password) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

app.post('/api/change-password', (req, res) => {
    const data = readData();
    const { oldPassword, newPassword } = req.body;
    if (data.adminPassword === oldPassword) {
        data.adminPassword = newPassword;
        writeData(data);
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid old password' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});