// 全局变量
let links = [];
let categories = [];
let settings = {
    websiteLogo: '',
    websiteTitle: 'My Website Favorites',
    footerInfo: '© EvanNav',
    autoCheck: {
        enabled: true,
        interval: 24,
        checkTime: "03:00",
        lastRun: null
    }
};
let currentPage = 1;
const itemsPerPage = 8;
let totalPages = 0;
let tempLinks = []; // 临时存储拖动排序后的链接
let currentCategory = "all"; // 当前分类
let adminCurrentPage = 1; // 后台专用的当前页变量
let adminCurrentCategory = "all"; // 后台专用的当前分类变量
let searchQuery = ""; // 搜索查询字符串

// DOM 缓存
const domCache = {};

// 工具函数
const utils = {
    // HTML编码，防止XSS攻击
    encodeHTML: (str) => str ? str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])) : '',
    
    // 格式化日期
    formatDate: (dateString) => {
        if (!dateString) return '未检测';
        return new Date(dateString).toLocaleString('zh-CN');
    },
    
    // 获取DOM元素并缓存
    getElement: (id) => {
        if (!domCache[id]) {
            domCache[id] = document.getElementById(id);
        }
        return domCache[id];
    },
    
    // 防抖函数
    debounce: (func, wait) => {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    },
    
    // 显示通知
    showNotification: (message, isError = false) => {
        if (isError) {
            console.error(message);
        }
        alert(message);
    }
};

// API 请求封装
const api = {
    // 基础请求方法
    async request(url, method = 'GET', data = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            if (data) {
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            
            // 对于DELETE请求，可能没有返回内容
            if (method === 'DELETE') {
                return { success: true };
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API请求错误 (${url}):`, error);
            throw error;
        }
    },
    
    // 获取所有链接
    getLinks() {
        return this.request('/api/links');
    },
    
    // 获取所有分类
    getCategories() {
        return this.request('/api/categories');
    },
    
    // 获取设置
    getSettings() {
        return this.request('/api/settings');
    },
    
    // 更新设置
    updateSettings(settingsData) {
        return this.request('/api/settings', 'PUT', settingsData);
    },
    
    // 添加链接
    addLink(linkData) {
        return this.request('/api/links', 'POST', linkData);
    },
    
    // 更新链接
    updateLink(index, linkData) {
        return this.request(`/api/links/${index}`, 'PUT', linkData);
    },
    
    // 删除链接
    deleteLink(index) {
        return this.request(`/api/links/${index}`, 'DELETE');
    },
    
    // 更新所有链接
    updateAllLinks(linksData) {
        return this.request('/api/links', 'PUT', linksData);
    },
    
    // 添加分类
    addCategory(categoryData) {
        return this.request('/api/categories', 'POST', categoryData);
    },
    
    // 删除分类
    deleteCategory(index) {
        return this.request(`/api/categories/${index}`, 'DELETE');
    },
    
    // 登录
    login(password) {
        return this.request('/api/login', 'POST', { password });
    },
    
    // 修改密码
    changePassword(oldPassword, newPassword) {
        return this.request('/api/change-password', 'POST', { oldPassword, newPassword });
    },
    
    // 检测所有链接
    checkLinks() {
        return this.request('/api/check-links', 'POST');
    }
};

// 初始化
async function init() {
    try {
        await loadSettings();
        await loadLinks();
        await loadCategories();
        tempLinks = [...links]; // 初始化临时链接
        renderFrontend();
        
        // 优先加载自定义网站名称，避免延迟
        const loadingTitle = utils.getElement('loading-title');
        if (loadingTitle) {
            loadingTitle.textContent = settings.websiteTitle || 'My Website Favorites';
        }
        
        // 初始化标签页切换
        initAdminTabs();
        
        // 添加事件监听器
        addEventListeners();
    } catch (error) {
        console.error('Initialization failed:', error);
        utils.showNotification('加载数据失败，请刷新页面或检查网络连接！', true);
    }
}

// 添加事件监听器
function addEventListeners() {
    // 使用事件委托处理分类按钮点击
    const categoryFilters = utils.getElement('category-filters');
    if (categoryFilters) {
        categoryFilters.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-btn')) {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentPage = 1;
                renderFrontend(e.target.dataset.category);
            }
        });
    }
}

// 加载设置
async function loadSettings() {
    try {
        settings = await api.getSettings();
        loadWebsiteLogo();
        loadWebsiteTitle();
        loadFooterInfo();
        loadAdminFooterInfo();
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

// 加载链接
async function loadLinks() {
    try {
        links = await api.getLinks();
        tempLinks = [...links]; // 更新临时链接
        totalPages = Math.ceil(links.length / itemsPerPage);
    } catch (error) {
        console.error('Failed to load links:', error);
        utils.showNotification('加载链接失败，请刷新页面或检查网络连接！', true);
    }
}

// 加载分类
async function loadCategories() {
    try {
        categories = await api.getCategories();
    } catch (error) {
        console.error('Failed to load categories:', error);
        utils.showNotification('加载分类失败，请刷新页面或检查网络连接！', true);
    }
}

// 渲染前台
function renderFrontend(category = "all") {
    currentCategory = category;
    const container = utils.getElement('nav-links');
    if (!container) return;
    
    const filteredLinks = category === "all" 
        ? links 
        : links.filter(link => link.category === category);

    totalPages = Math.ceil(filteredLinks.length / itemsPerPage);
    currentPage = Math.min(currentPage, totalPages || 1);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedLinks = filteredLinks.slice(startIndex, endIndex);

    // 使用DocumentFragment提高性能
    const fragment = document.createDocumentFragment();
    
    paginatedLinks.forEach(link => {
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.dataset.index = filteredLinks.indexOf(link);
        
        // 添加上次检测时间提示
        const lastCheckedText = link.lastChecked 
            ? `上次检测: ${utils.formatDate(link.lastChecked)}`
            : '未检测';
            
        li.innerHTML = `
            <a href="${link.url}" class="nav-link" target="_blank">
                ${link.logo ? `<img src="${link.logo}" class="link-logo" alt="${utils.encodeHTML(link.name)}">` : ''}
                <div class="link-info">
                    <div class="link-name">${utils.encodeHTML(link.name)}</div>
                    <div class="link-desc">${utils.encodeHTML(link.description)}</div>
                </div>
            </a>
            <div class="link-status">
                <span class="status-badge ${link.status === 'normal' ? 'status-normal' : 'status-error'}">
                    ${link.status === 'normal' ? '正常' : '维护'}
                </span>
                <span class="last-checked-time" title="${lastCheckedText}">${lastCheckedText}</span>
            </div>
        `;
        
        fragment.appendChild(li);
    });
    
    // 清空容器并添加新内容
    container.innerHTML = '';
    container.appendChild(fragment);

    updateCategoryFilters(category);
    updatePaginationButtons();
}

// 更新分类过滤器
function updateCategoryFilters(activeCategory = "all") {
    const container = utils.getElement('category-filters');
    if (!container) return;
    
    const totalLinksCount = links.length;
    
    // 使用DocumentFragment提高性能
    const fragment = document.createDocumentFragment();
    
    const allBtn = document.createElement('button');
    allBtn.className = `category-btn ${activeCategory === 'all' ? 'active' : ''}`;
    allBtn.dataset.category = 'all';
    allBtn.textContent = `全部 (${totalLinksCount})`;
    fragment.appendChild(allBtn);

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `category-btn ${activeCategory === cat ? 'active' : ''}`;
        btn.dataset.category = cat;
        btn.textContent = `${cat} (${links.filter(link => link.category === cat).length})`;
        fragment.appendChild(btn);
    });
    
    // 清空容器并添加新内容
    container.innerHTML = '';
    container.appendChild(fragment);
}

// 初始化后台标签页切换
function initAdminTabs() {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有标签页和内容的active类
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            
            // 添加active类到当前标签页和对应内容
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
        });
    });
}

// 显示后台
function showAdmin() {
    const frontend = document.querySelector('.frontend');
    const backend = document.querySelector('.backend');
    
    if (frontend && backend) {
        frontend.style.opacity = '0';
        frontend.style.display = 'none';
        backend.style.display = 'block';
        
        // 使用requestAnimationFrame确保DOM更新后再设置opacity
        requestAnimationFrame(() => {
            backend.style.opacity = '1';
        });
        
        renderAdmin();
        renderCategories();
        loadFooterInfo();
        loadWebsiteSettings();
        loadAutoCheckSettings();
        loadAdminFooterInfo();
    }
}

// 显示前台
function showFrontend() {
    const frontend = document.querySelector('.frontend');
    const backend = document.querySelector('.backend');
    
    if (frontend && backend) {
        backend.style.opacity = '0';
        backend.style.display = 'none';
        frontend.style.display = 'block';
        
        // 使用requestAnimationFrame确保DOM更新后再设置opacity
        requestAnimationFrame(() => {
            frontend.style.opacity = '1';
        });
        
        renderFrontend(currentCategory);
        loadWebsiteLogo();
        loadWebsiteTitle();
    }
}

// 登录
async function login() {
    const passwordInput = utils.getElement('admin-password');
    if (!passwordInput) return;
    
    const password = passwordInput.value;
    
    try {
        const result = await api.login(password);
        if (result.success) {
            document.querySelector('.login-form').style.display = 'none';
            document.querySelector('.admin-panel').style.display = 'block';
        } else {
            utils.showNotification('密码错误！', true);
        }
    } catch (error) {
        console.error('Login failed:', error);
        utils.showNotification('登录失败，请重试！', true);
    }
}

// 渲染后台
function renderAdmin() {
    const tbody = utils.getElement('links-list');
    if (!tbody) return;
    
    // 更新后台分类过滤器
    updateAdminCategoryFilters();
    
    // 根据当前分类和搜索查询过滤链接
    let filteredLinks = tempLinks;
    
    // 应用分类过滤
    if (adminCurrentCategory !== "all") {
        filteredLinks = filteredLinks.filter(link => link.category === adminCurrentCategory);
    }
    
    // 应用搜索过滤
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredLinks = filteredLinks.filter(link => 
            link.name.toLowerCase().includes(query) || 
            link.url.toLowerCase().includes(query) || 
            link.description.toLowerCase().includes(query) || 
            link.category.toLowerCase().includes(query)
        );
    }
    
    // 计算总页数
    const adminTotalPages = Math.ceil(filteredLinks.length / itemsPerPage);
    adminCurrentPage = Math.min(adminCurrentPage, adminTotalPages || 1);
    
    const startIndex = (adminCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedLinks = filteredLinks.slice(startIndex, endIndex);

    // 使用DocumentFragment提高性能
    const fragment = document.createDocumentFragment();
    
    paginatedLinks.forEach((link, index) => {
        const tr = document.createElement('tr');
        // 存储原始数组中的索引，而不是过滤后数组中的索引
        const originalIndex = tempLinks.indexOf(link);
        tr.dataset.index = originalIndex;
        
        // 添加上次检测时间信息
        const lastCheckedText = link.lastChecked 
            ? utils.formatDate(link.lastChecked)
            : '未检测';
            
        tr.innerHTML = `
            <td data-label="名称">
                <div class="form-group">
                    <input value="${utils.encodeHTML(link.name)}" placeholder="名称" class="name-input">
                </div>
            </td>
            <td data-label="网址">
                <div class="form-group">
                    <input value="${utils.encodeHTML(link.url)}" placeholder="网址" class="url-input">
                    <div class="last-checked">
                        <small>上次检测: ${lastCheckedText}</small>
                    </div>
                </div>
            </td>
            <td data-label="分类">
                <div class="form-group">
                    <select class="category-select">
                        ${categories.map(cat => 
                            `<option value="${utils.encodeHTML(cat)}" ${link.category === cat ? 'selected' : ''}>${utils.encodeHTML(cat)}</option>`
                        ).join('')}
                    </select>
                </div>
            </td>
            <td data-label="简介">
                <div class="form-group">
                    <textarea class="description-textarea">${utils.encodeHTML(link.description)}</textarea>
                </div>
            </td>
            <td data-label="状态">
                <div class="form-group">
                    <select class="status-select" onchange="updateStatus(${originalIndex}, this.value)">
                        <option value="normal" ${link.status === 'normal' ? 'selected' : ''}>正常</option>
                        <option value="error" ${link.status !== 'normal' ? 'selected' : ''}>维护</option>
                    </select>
                </div>
            </td>
            <td data-label="Logo">
                <div class="form-group">
                    <input type="text" placeholder="https://example.com/logo.png" value="${utils.encodeHTML(link.logo || '')}" class="logo-input">
                </div>
            </td>
            <td class="action-cell" data-label="操作">
                <div class="action-buttons-group">
                    <button class="btn-secondary btn-save" onclick="saveLink(${originalIndex})">保存</button>
                    <button class="btn-secondary btn-delete" onclick="deleteLink(${originalIndex})">删除</button>
                </div>
                <div class="arrow-buttons-group">
                    <button class="btn-secondary arrow-btn" onclick="moveUp(${originalIndex})">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="btn-secondary arrow-btn" onclick="moveDown(${originalIndex})">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                </div>
            </td>
        `;
        
        fragment.appendChild(tr);
    });
    
    // 清空容器并添加新内容
    tbody.innerHTML = '';
    tbody.appendChild(fragment);

    // 更新分页按钮和页码
    updateAdminPaginationButtons(adminTotalPages);
}

// 渲染分类
function renderCategories() {
    const container = utils.getElement('categories-list');
    if (!container) return;
    
    // 使用DocumentFragment提高性能
    const fragment = document.createDocumentFragment();
    
    categories.forEach((cat, index) => {
        const div = document.createElement('div');
        div.className = 'category-item';
        div.innerHTML = `
            <span>${utils.encodeHTML(cat)}</span>
            <button onclick="deleteCategory(${index})">✕</button>
        `;
        
        fragment.appendChild(div);
    });
    
    // 清空容器并添加新内容
    container.innerHTML = '';
    container.appendChild(fragment);
}

// 加载页脚信息
function loadFooterInfo() {
    // 保护版权信息，确保无法被更改
    const footerInfo = '© EvanNav';
    const footerTextInput = utils.getElement('footer-text');
    const footerInfoElement = utils.getElement('footer-info');
    
    if (footerTextInput) {
        footerTextInput.value = settings.footerInfo.replace('© EvanNav', '');
    }
    
    if (footerInfoElement) {
        footerInfoElement.innerHTML = `<p><a href="https://evan.xin" id="cvp79407dlc9i3dt24jg" style="text-decoration: none; color: inherit;">${footerInfo}</a> ${settings.footerInfo.replace('© EvanNav', '')}</p>`;
    }
}

// 加载后台页脚信息
function loadAdminFooterInfo() {
    // 保护版权信息，确保无法被更改
    const footerInfo = '© EvanNav';
    const adminFooterInfoElement = utils.getElement('admin-footer-info');
    
    if (adminFooterInfoElement) {
        adminFooterInfoElement.innerHTML = `<p><a href="https://evan.xin" id="cvp79407dlc9i3dt24jg" style="text-decoration: none; color: inherit;">${footerInfo}</a> ${settings.footerInfo.replace('© EvanNav', '')}</p>`;
    }
}

// 加载网站设置
function loadWebsiteSettings() {
    const logoInput = utils.getElement('website-logo-input');
    const titleInput = utils.getElement('website-title-input');
    
    if (logoInput) {
        logoInput.value = settings.websiteLogo;
    }
    
    if (titleInput) {
        titleInput.value = settings.websiteTitle;
    }
}

// 加载自检设置
function loadAutoCheckSettings() {
    if (!settings.autoCheck) {
        settings.autoCheck = {
            enabled: true,
            interval: 24,
            checkTime: "03:00",
            lastRun: null
        };
    }
    
    const { enabled, interval, checkTime, lastRun } = settings.autoCheck;
    
    const enabledCheckbox = utils.getElement('auto-check-enabled');
    const intervalInput = utils.getElement('check-interval');
    const checkTimeInput = utils.getElement('check-time');
    const lastCheckTimeElement = utils.getElement('last-check-time');
    
    if (enabledCheckbox) {
        enabledCheckbox.checked = enabled;
    }
    
    if (intervalInput) {
        intervalInput.value = interval;
    }
    
    if (checkTimeInput) {
        checkTimeInput.value = checkTime;
    }
    
    // 显示上次检测时间
    if (lastCheckTimeElement) {
        if (lastRun) {
            lastCheckTimeElement.textContent = utils.formatDate(lastRun);
        } else {
            lastCheckTimeElement.textContent = '从未检测';
        }
    }
}

// 保存自检设置
async function saveAutoCheckSettings() {
    const enabledCheckbox = utils.getElement('auto-check-enabled');
    const intervalInput = utils.getElement('check-interval');
    const checkTimeInput = utils.getElement('check-time');
    
    if (!enabledCheckbox || !intervalInput || !checkTimeInput) return;
    
    const enabled = enabledCheckbox.checked;
    const interval = parseInt(intervalInput.value);
    const checkTime = checkTimeInput.value;
    
    // 验证输入
    if (isNaN(interval) || interval < 1 || interval > 168) {
        utils.showNotification('检测间隔必须是1到168之间的整数！', true);
        return;
    }
    
    if (!checkTime.match(/^\d{2}:\d{2}$/)) {
        utils.showNotification('检测时间格式不正确，请使用HH:MM格式！', true);
        return;
    }
    
    // 更新设置
    settings.autoCheck = {
        ...settings.autoCheck,
        enabled,
        interval,
        checkTime
    };
    
    try {
        await api.updateSettings(settings);
        utils.showNotification('自检设置已保存！');
    } catch (error) {
        console.error('Failed to save auto check settings:', error);
        utils.showNotification('保存设置失败，请重试！', true);
    }
}

// 手动检测所有链接
async function manualCheckLinks() {
    const lastCheckTimeElement = utils.getElement('last-check-time');
    if (!lastCheckTimeElement) return;
    
    const originalText = lastCheckTimeElement.textContent;
    lastCheckTimeElement.textContent = '检测中...';
    
    try {
        await api.checkLinks();
        
        // 重新加载链接和设置
        await loadLinks();
        await loadSettings();
        
        // 更新界面
        renderAdmin();
        renderFrontend(currentCategory);
        loadAutoCheckSettings();
        
        utils.showNotification('所有链接检测完成！');
    } catch (error) {
        console.error('Failed to check links:', error);
        utils.showNotification('链接检测失败，请重试！', true);
        lastCheckTimeElement.textContent = originalText;
    }
}

// 保存网站设置
async function saveWebsiteSettings() {
    const logoInput = utils.getElement('website-logo-input');
    const titleInput = utils.getElement('website-title-input');
    
    if (!logoInput || !titleInput) return;
    
    const websiteLogo = logoInput.value;
    const websiteTitle = titleInput.value;
    
    settings.websiteLogo = websiteLogo;
    settings.websiteTitle = websiteTitle;
    
    try {
        await api.updateSettings(settings);
        loadWebsiteLogo();
        loadWebsiteTitle();
        utils.showNotification('网站设置已保存！');
    } catch (error) {
        console.error('Failed to save settings:', error);
        utils.showNotification('保存设置失败，请重试！', true);
    }
}

// 加载网站Logo
function loadWebsiteLogo() {
    const logoImg = utils.getElement('website-logo');
    if (!logoImg) return;
    
    const websiteLogo = settings.websiteLogo;
    
    if (websiteLogo) {
        logoImg.src = websiteLogo;
        logoImg.style.display = 'block';
    } else {
        logoImg.style.display = 'none';
    }
}

// 加载网站标题
function loadWebsiteTitle() {
    const titleElement = document.querySelector('.logo-container h1');
    if (!titleElement) return;
    
    const websiteTitle = settings.websiteTitle;
    titleElement.textContent = websiteTitle;
    document.title = websiteTitle;
}

// 保存页脚信息
async function saveFooterInfo() {
    const footerTextInput = utils.getElement('footer-text');
    if (!footerTextInput) return;
    
    const footerInfo = footerTextInput.value;
    // 保护版权信息，确保无法被更改
    settings.footerInfo = '© EvanNav' + (footerInfo ? ' ' + footerInfo : '');
    
    try {
        await api.updateSettings(settings);
        loadFooterInfo();
        loadAdminFooterInfo();
        utils.showNotification('页脚信息已保存！');
    } catch (error) {
        console.error('Failed to save footer info:', error);
        utils.showNotification('保存页脚信息失败，请重试！', true);
    }
}

// 添加新链接
async function addNewLink() {
    // 使用当前选中的分类（如果不是"all"）；否则使用第一个可用分类
    const linkCategory = (adminCurrentCategory !== "all" ? adminCurrentCategory : (categories[0] || "未分类"));
    
    const newLink = { 
        name: "新链接", 
        url: "https://", 
        category: linkCategory, 
        description: "", 
        status: "normal",
        logo: "",
        lastChecked: null
    };
    
    try {
        const addedLink = await api.addLink(newLink);
        links.push(addedLink);
        tempLinks.push(addedLink); // 更新临时链接
        adminCurrentPage = Math.ceil(links.length / itemsPerPage);
        renderAdmin();
        
        // 为新添加的链接添加样式
        setTimeout(() => {
            const lastRow = document.querySelector('.links-table tr:last-child');
            if (lastRow) {
                lastRow.classList.add('new-link-form');
                
                // 聚焦到名称输入框
                const nameInput = lastRow.querySelector('.name-input');
                if (nameInput) nameInput.focus();
                
                // 滚动到新链接位置
                lastRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    } catch (error) {
        console.error('Failed to add new link:', error);
        utils.showNotification('添加链接失败，请重试！', true);
    }
}

// 保存链接
async function saveLink(index) {
    const row = document.querySelector(`tr[data-index="${index}"]`);
    if (!row) return;

    // 验证输入内容
    const name = row.querySelector('.name-input').value.trim();
    const url = row.querySelector('.url-input').value.trim();
    const category = row.querySelector('.category-select').value;
    const description = row.querySelector('.description-textarea').value.trim();
    const status = row.querySelector('.status-select').value;
    const logo = row.querySelector('.logo-input').value.trim();

    if (!name || !url || !category) {
        utils.showNotification('名称、网址和分类不能为空！', true);
        return;
    }

    // 保留lastChecked字段
    const lastChecked = links[index].lastChecked;
    
    const updatedLink = {
        name,
        url,
        category,
        description,
        status,
        logo,
        lastChecked
    };

    try {
        await api.updateLink(index, updatedLink);
        links[index] = updatedLink;
        tempLinks[index] = updatedLink; // 更新临时链接
        renderFrontend(currentCategory);
        renderAdmin();
        utils.showNotification('链接已保存！');
    } catch (error) {
        console.error('Failed to update link:', error);
        utils.showNotification('保存链接失败，请重试！', true);
    }
}

// 保存所有链接
async function saveAllLinks() {
    try {
        await api.updateAllLinks(tempLinks);
        links = [...tempLinks]; // 更新主链接列表
        renderFrontend(currentCategory);
        renderAdmin();
        utils.showNotification('所有链接已保存！');
    } catch (error) {
        console.error('Failed to save all links:', error);
        utils.showNotification('保存所有链接失败，请重试！', true);
    }
}

// 删除链接
async function deleteLink(index) {
    if(confirm('确认删除该链接？')) {
        try {
            await api.deleteLink(index);
            links.splice(index, 1);
            tempLinks.splice(index, 1); // 更新临时链接
            adminCurrentPage = Math.max(1, Math.min(adminCurrentPage, Math.ceil(links.length / itemsPerPage)));
            renderAdmin();
            renderFrontend(currentCategory);
        } catch (error) {
            console.error('Failed to delete link:', error);
            utils.showNotification('删除链接失败，请重试！', true);
        }
    }
}

// 更新状态
async function updateStatus(index, status) {
    links[index].status = status;
    tempLinks[index].status = status; // 更新临时链接的状态
    
    try {
        await api.updateLink(index, links[index]);
        renderFrontend(currentCategory);
        renderAdmin();
    } catch (error) {
        console.error('Failed to update status:', error);
        utils.showNotification('更新状态失败，请重试！', true);
    }
}

// 向上移动一行
function moveUp(index) {
    if (index > 0) {
        const temp = tempLinks[index];
        tempLinks[index] = tempLinks[index - 1];
        tempLinks[index - 1] = temp;
        renderAdmin();
    }
}

// 向下移动一行
function moveDown(index) {
    if (index < tempLinks.length - 1) {
        const temp = tempLinks[index];
        tempLinks[index] = tempLinks[index + 1];
        tempLinks[index + 1] = temp;
        renderAdmin();
    }
}

// 添加新分类
async function addNewCategory() {
    const newCategoryInput = utils.getElement('new-category');
    if (!newCategoryInput) return;
    
    const categoryName = newCategoryInput.value.trim();
    
    if (!categoryName) {
        utils.showNotification('分类名称不能为空！', true);
        return;
    }

    // 验证输入内容
    if (!/^[a-zA-Z0-9\u4e00-\u9fa5]+$/.test(categoryName)) {
        utils.showNotification('分类名称只能包含字母、数字和中文！', true);
        return;
    }

    if (!categories.includes(categoryName)) {
        try {
            await api.addCategory({ name: categoryName });
            categories.push(categoryName);
            newCategoryInput.value = '';
            renderCategories();
            renderFrontend(currentCategory);
            renderAdmin(); // 更新链接表格中的分类选择器
        } catch (error) {
            console.error('Failed to add category:', error);
            utils.showNotification('添加分类失败，请重试！', true);
        }
    } else {
        utils.showNotification('该分类已存在！', true);
    }
}

// 删除分类
async function deleteCategory(index) {
    if(confirm('确认删除该分类？此操作不会删除链接，只会将链接分类重置为第一个分类')) {
        const deletedCategory = categories[index];
        
        try {
            await api.deleteCategory(index);
            categories.splice(index, 1);
            
            // 更新链接分类
            links.forEach(link => {
                if(link.category === deletedCategory) {
                    link.category = categories[0] || "未分类";
                }
            });
            
            tempLinks = [...links]; // 更新临时链接
            await api.updateAllLinks(links);
            
            renderCategories();
            renderAdmin();
            renderFrontend(currentCategory);
        } catch (error) {
            console.error('Failed to delete category:', error);
            utils.showNotification('删除分类失败，请重试！', true);
        }
    }
}

// 上一页（前台）
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderFrontend(currentCategory);
    }
}

// 下一页（前台）
function nextPage() {
    const filteredLinks = currentCategory === "all" 
        ? links 
        : links.filter(link => link.category === currentCategory);
        
    if (currentPage * itemsPerPage < filteredLinks.length) {
        currentPage++;
        renderFrontend(currentCategory);
    }
}

// 上一页（后台）
function adminPrevPage() {
    if (adminCurrentPage > 1) {
        adminCurrentPage--;
        renderAdmin();
    }
}

// 下一页（后台）
function adminNextPage() {
    const filteredLinks = getFilteredAdminLinks();
    const totalPages = Math.ceil(filteredLinks.length / itemsPerPage);
    if (adminCurrentPage < totalPages) {
        adminCurrentPage++;
        renderAdmin();
    }
}

// 获取过滤后的后台链接
function getFilteredAdminLinks() {
    let filteredLinks = tempLinks;
    
    // 应用分类过滤
    if (adminCurrentCategory !== "all") {
        filteredLinks = filteredLinks.filter(link => link.category === adminCurrentCategory);
    }
    
    // 应用搜索过滤
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredLinks = filteredLinks.filter(link => 
            link.name.toLowerCase().includes(query) || 
            link.url.toLowerCase().includes(query) || 
            link.description.toLowerCase().includes(query) || 
            link.category.toLowerCase().includes(query)
        );
    }
    
    return filteredLinks;
}

// 更新分页按钮状态
function updatePaginationButtons() {
    const prevPageBtn = utils.getElement('prev-page');
    const nextPageBtn = utils.getElement('next-page');
    
    const filteredLinks = currentCategory === "all" 
        ? links 
        : links.filter(link => link.category === currentCategory);
    totalPages = Math.ceil(filteredLinks.length / itemsPerPage) || 1;

    if (prevPageBtn) {
        prevPageBtn.disabled = currentPage === 1;
    }
    
    if (nextPageBtn) {
        nextPageBtn.disabled = currentPage * itemsPerPage >= filteredLinks.length;
    }
}

// 更新后台分类过滤器
function updateAdminCategoryFilters() {
    const filterContainer = utils.getElement('admin-category-filters');
    if (!filterContainer) return;
    
    // 清空容器
    filterContainer.innerHTML = '';
    
    // 创建按钮容器，用于统一样式和布局
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'admin-buttons-container';
    filterContainer.appendChild(buttonsContainer);
    
    // 每行最多显示的按钮数量
    const maxButtonsPerRow = 8;
    
    // 添加"全部"按钮
    const allButton = document.createElement('button');
    allButton.className = `admin-category-btn ${adminCurrentCategory === 'all' ? 'active' : ''}`;
    allButton.textContent = '全部';
    allButton.onclick = () => {
        adminCurrentCategory = 'all';
        adminCurrentPage = 1;
        renderAdmin();
    };
    buttonsContainer.appendChild(allButton);
    
    // 添加操作按钮（新增链接、全部保存、导入链接、导出链接）
    // 这些按钮已经在HTML中定义，不需要在这里添加
    
    // 计算可见分类按钮数量（考虑已有的"全部"按钮）
    const visibleCategoriesCount = maxButtonsPerRow - 1;
    
    // 如果分类数量超过可显示数量，需要折叠
    if (categories.length > visibleCategoriesCount) {
        // 添加可见分类按钮
        for (let i = 0; i < visibleCategoriesCount - 1; i++) {
            const category = categories[i];
            const button = document.createElement('button');
            button.className = `admin-category-btn ${adminCurrentCategory === category ? 'active' : ''}`;
            button.textContent = category;
            button.onclick = () => {
                adminCurrentCategory = category;
                adminCurrentPage = 1;
                renderAdmin();
            };
            buttonsContainer.appendChild(button);
        }
        
        // 创建折叠按钮（最后一个按钮）
        const foldButton = document.createElement('button');
        foldButton.className = 'admin-category-btn fold-btn';
        foldButton.textContent = '收藏';
        foldButton.onclick = () => {
            adminCurrentCategory = '收藏';
            adminCurrentPage = 1;
            renderAdmin();
        };
        buttonsContainer.appendChild(foldButton);
        
        // 创建折叠菜单
        const foldMenu = document.createElement('div');
        foldMenu.className = 'fold-menu';
        
        // 添加剩余分类到折叠菜单
        for (let i = visibleCategoriesCount - 1; i < categories.length; i++) {
            const category = categories[i];
            const menuItem = document.createElement('button');
            menuItem.className = `fold-menu-item ${adminCurrentCategory === category ? 'active' : ''}`;
            menuItem.textContent = category;
            menuItem.onclick = (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                adminCurrentCategory = category;
                adminCurrentPage = 1;
                renderAdmin();
            };
            foldMenu.appendChild(menuItem);
        }
        
        // 将折叠菜单添加到折叠按钮
        foldButton.appendChild(foldMenu);
        
        // 添加鼠标悬停事件
        foldButton.addEventListener('mouseenter', () => {
            foldMenu.style.display = 'block';
        });
        
        foldButton.addEventListener('mouseleave', () => {
            foldMenu.style.display = 'none';
        });
    } else {
        // 如果分类数量不多，直接显示所有分类按钮
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = `admin-category-btn ${adminCurrentCategory === category ? 'active' : ''}`;
            button.textContent = category;
            button.onclick = () => {
                adminCurrentCategory = category;
                adminCurrentPage = 1;
                renderAdmin();
            };
            buttonsContainer.appendChild(button);
        });
    }
}

// 更新后台分页按钮和页码
function updateAdminPaginationButtons(totalPages) {
    const prevButton = utils.getElement('admin-prev-page');
    const nextButton = utils.getElement('admin-next-page');
    const paginationNumbers = utils.getElement('admin-pagination-numbers');
    
    if (!prevButton || !nextButton || !paginationNumbers) return;
    
    // 更新上一页/下一页按钮状态
    prevButton.disabled = adminCurrentPage <= 1;
    nextButton.disabled = adminCurrentPage >= totalPages;
    
    // 清空页码容器
    paginationNumbers.innerHTML = '';
    
    // 生成页码，最多显示10页
    if (totalPages > 1) {
        // 确定要显示的页码范围，最多显示10页
        const maxVisiblePages = 10;
        let startPage = 1;
        let endPage = Math.min(totalPages, maxVisiblePages);
        
        // 如果当前页接近末尾，调整显示范围
        if (adminCurrentPage > maxVisiblePages - 3) {
            startPage = Math.max(1, adminCurrentPage - Math.floor(maxVisiblePages / 2));
            endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            // 确保始终显示最多maxVisiblePages个页码
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
        }
        
        // 添加页码按钮
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = `page-number ${adminCurrentPage === i ? 'active' : ''}`;
            pageButton.textContent = i;
            pageButton.onclick = () => {
                adminCurrentPage = i;
                renderAdmin();
            };
            paginationNumbers.appendChild(pageButton);
        }
    }
}

// 搜索链接
function searchLinks() {
    const searchInput = utils.getElement('admin-search-input');
    if (!searchInput) return;
    
    searchQuery = searchInput.value.trim();
    
    if (!searchQuery) {
        utils.showNotification('请输入搜索关键词');
        return;
    }
    
    // 执行搜索
    const query = searchQuery.toLowerCase();
    const searchResults = tempLinks.filter(link => 
        link.name.toLowerCase().includes(query) || 
        link.url.toLowerCase().includes(query) || 
        link.description.toLowerCase().includes(query) || 
        link.category.toLowerCase().includes(query)
    );
    
    // 显示搜索结果弹窗
    showSearchResults(searchResults, query);
    
    // 同时更新链接列表显示
    adminCurrentPage = 1;
    renderAdmin();
}

// 显示搜索结果弹窗
function showSearchResults(results, query) {
    // 移除已有的搜索结果弹窗
    const existingModal = document.querySelector('.search-results-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    // 创建搜索结果弹窗
    const modal = document.createElement('div');
    modal.className = 'search-results-modal';
    
    const container = document.createElement('div');
    container.className = 'search-results-container';
    
    const header = document.createElement('div');
    header.className = 'search-results-header';
    
    const title = document.createElement('h3');
    title.textContent = `搜索结果: "${query}" (${results.length}个)`;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'search-results-close';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => {
        document.body.removeChild(modal);
    };
    
    header.appendChild(title);
    header.appendChild(closeButton);
    container.appendChild(header);
    
    if (results.length > 0) {
        const resultsList = document.createElement('ul');
        resultsList.className = 'search-results-list';
        
        results.forEach(link => {
            const item = document.createElement('li');
            item.className = 'search-result-item';
            
            const name = document.createElement('div');
            name.className = 'search-result-name';
            name.textContent = link.name;
            
            const url = document.createElement('div');
            url.className = 'search-result-url';
            url.textContent = link.url;
            
            const category = document.createElement('span');
            category.className = 'search-result-category';
            category.textContent = link.category;
            
            const description = document.createElement('div');
            description.className = 'search-result-description';
            description.textContent = link.description;
            
            item.appendChild(name);
            item.appendChild(url);
            item.appendChild(category);
            item.appendChild(description);
            
            // 点击搜索结果项跳转到对应链接的编辑位置
            item.onclick = () => {
                document.body.removeChild(modal);
                
                // 设置当前分类为该链接的分类
                adminCurrentCategory = link.category;
                
                // 计算该链接在当前分类下的页码
                const filteredLinks = getFilteredAdminLinks();
                const linkIndex = filteredLinks.indexOf(link);
                if (linkIndex !== -1) {
                    adminCurrentPage = Math.floor(linkIndex / itemsPerPage) + 1;
                    renderAdmin();
                    
                    // 延迟一下，确保DOM已更新
                    setTimeout(() => {
                        const linkRow = document.querySelector(`tr[data-index="${linkIndex}"]`);
                        if (linkRow) {
                            linkRow.classList.add('highlight');
                            linkRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            
                            // 移除高亮效果
                            setTimeout(() => {
                                linkRow.classList.remove('highlight');
                            }, 2000);
                        }
                    }, 100);
                }
            };
            
            resultsList.appendChild(item);
        });
        
        container.appendChild(resultsList);
    } else {
        const noResults = document.createElement('div');
        noResults.style.padding = '1rem';
        noResults.style.textAlign = 'center';
        noResults.style.color = '#64748b';
        noResults.textContent = '没有找到匹配的链接';
        container.appendChild(noResults);
    }
    
    modal.appendChild(container);
    document.body.appendChild(modal);
    
    // 移除点击弹窗外部关闭的功能，确保只能通过右上角的关闭按钮关闭
}

// 修改密码
async function changePassword() {
    const oldPasswordInput = utils.getElement('old-password');
    const newPasswordInput = utils.getElement('new-password');
    const confirmPasswordInput = utils.getElement('confirm-password');
    
    if (!oldPasswordInput || !newPasswordInput || !confirmPasswordInput) return;
    
    const oldPassword = oldPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!oldPassword || !newPassword || !confirmPassword) {
        utils.showNotification('所有字段不能为空！', true);
        return;
    }

    if (newPassword !== confirmPassword) {
        utils.showNotification('新密码和确认密码不一致！', true);
        return;
    }

    try {
        await api.changePassword(oldPassword, newPassword);
        utils.showNotification('密码修改成功！');
        oldPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
    } catch (error) {
        console.error('Failed to change password:', error);
        utils.showNotification(error.message || '修改密码失败，请重试！', true);
    }
}

// 导出链接
function exportLinks() {
    const data = JSON.stringify(tempLinks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'links_export.json';
    a.click();
    URL.revokeObjectURL(url);
}

// 导入链接
function importLinks(file) {
    if (!file || file.type !== 'application/json') {
        utils.showNotification('请选择有效的JSON文件！', true);
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const importedLinks = JSON.parse(e.target.result);
            if (!Array.isArray(importedLinks)) {
                throw new Error('导入数据格式不正确！');
            }

            importedLinks.forEach(link => {
                if (!link.name || !link.url || !link.category) {
                    throw new Error('导入数据格式不正确！');
                }
                
                // 确保每个链接都有lastChecked字段
                if (!link.hasOwnProperty('lastChecked')) {
                    link.lastChecked = null;
                }
            });

            links = importedLinks;
            tempLinks = [...links]; // 更新临时链接
            
            try {
                await api.updateAllLinks(links);
                renderAdmin();
                renderFrontend(currentCategory);
                utils.showNotification('链接导入成功！');
            } catch (error) {
                console.error('Failed to import links:', error);
                utils.showNotification('导入失败，请重试！', true);
            }
        } catch (error) {
            utils.showNotification('导入失败，请检查文件格式是否正确。', true);
        }
    };
    reader.readAsText(file);
}

// 预加载资源
function preloadAssets() {
    const assetsToLoad = [
        'index.html',
        'styles.css',
        'script.js',
        'favicon.ico'
    ];

    let loadedCount = 0;
    const progressBar = utils.getElement('progress-bar');
    const loadingTitle = utils.getElement('loading-title');

    if (loadingTitle) {
        loadingTitle.textContent = '正在加载资源...';
    }

    assetsToLoad.forEach(asset => {
        const resource = new Image();
        resource.src = asset;

        const updateProgress = () => {
            loadedCount++;
            if (progressBar) {
                const progress = (loadedCount / assetsToLoad.length) * 100;
                progressBar.style.width = progress + '%';
            }
        };

        resource.onload = updateProgress;
        resource.onerror = updateProgress;
    });
}

// 移除加载缓冲页并添加主页面淡入效果
window.addEventListener('load', function() {
    preloadAssets();

    // 同步网站标题
    const loadingTitle = utils.getElement('loading-title');
    const websiteTitle = utils.getElement('website-title');
    
    if (loadingTitle && websiteTitle) {
        loadingTitle.textContent = websiteTitle.textContent;
    }
    
    // 模拟加载进度
    const progressBar = utils.getElement('progress-bar');
    if (progressBar) {
        let width = 0;
        const interval = setInterval(function() {
            if (width >= 100) {
                clearInterval(interval);
                // 淡出加载页面并淡入主页面
                setTimeout(function() {
                    const loadingScreen = utils.getElement('loading-screen');
                    if (loadingScreen) {
                        loadingScreen.style.opacity = '0';
                        loadingScreen.style.transition = 'opacity 0.5s ease';
                        setTimeout(function() {
                            loadingScreen.style.display = 'none';
                            
                            // 淡入主页面
                            const frontend = utils.getElement('frontend');
                            const backend = utils.getElement('backend');
                            
                            if (frontend) {
                                frontend.style.opacity = '1';
                            }
                            
                            if (backend) {
                                backend.style.opacity = '1';
                            }
                        }, 500);
                    }
                }, 1000);
            } else {
                width += 5;
                progressBar.style.width = width + '%';
            }
        }, 100);
    }
});

// 初始化应用
init();
