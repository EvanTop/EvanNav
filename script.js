let links = [];
let categories = [];
let settings = {
    websiteLogo: '',
    websiteTitle: 'My Website Favorites',
    footerInfo: '© EvanNav'
};
let currentPage = 1;
const itemsPerPage = 8;
let totalPages = 0;
let tempLinks = []; // 临时存储拖动排序后的链接
let currentCategory = "all"; // 当前分类
let adminCurrentPage = 1; // 新增后台专用的当前页变量

// 初始化
async function init() {
    try {
        await loadSettings();
        await loadLinks();
        await loadCategories();
        tempLinks = [...links]; // 初始化临时链接
        renderFrontend();
    } catch (error) {
        console.error('Initialization failed:', error);
        alert('加载数据失败，请刷新页面或检查网络连接！');
    }
}

// 加载设置
async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        if (!response.ok) throw new Error('Failed to fetch settings');
        settings = await response.json();
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
        const response = await fetch('/api/links');
        if (!response.ok) throw new Error('Failed to fetch links');
        links = await response.json();
        tempLinks = [...links]; // 更新临时链接
        totalPages = Math.ceil(links.length / itemsPerPage);
    } catch (error) {
        console.error('Failed to load links:', error);
        alert('加载链接失败，请刷新页面或检查网络连接！');
    }
}

// 加载分类
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        categories = await response.json();
    } catch (error) {
        console.error('Failed to load categories:', error);
        alert('加载分类失败，请刷新页面或检查网络连接！');
    }
}

// 渲染前台
function renderFrontend(category = "all") {
    currentCategory = category;
    const container = document.getElementById('nav-links');
    const filteredLinks = category === "all" 
        ? links 
        : links.filter(link => link.category === category);

    totalPages = Math.ceil(filteredLinks.length / itemsPerPage);
    currentPage = Math.min(currentPage, totalPages);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedLinks = filteredLinks.slice(startIndex, endIndex);

    container.innerHTML = paginatedLinks.map(link => {
        const encodeHTML = (str) => str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag]));
            
        return `
            <li class="nav-item" data-index="${filteredLinks.indexOf(link)}">
                <a href="${link.url}" class="nav-link" target="_blank">
                    ${link.logo ? `<img src="${link.logo}" class="link-logo" alt="${encodeHTML(link.name)}">` : ''}
                    <div class="link-info">
                        <div class="link-name">${encodeHTML(link.name)}</div>
                        <div class="link-desc">${encodeHTML(link.description)}</div>
                    </div>
                </a>
                <span class="status-badge ${link.status === 'normal' ? 'status-normal' : 'status-error'}">
                    ${link.status === 'normal' ? '正常' : '维护'}
                </span>
            </li>
        `;
    }).join('');

    updateCategoryFilters(category);
    updatePaginationButtons();
}

// 更新分类过滤器
function updateCategoryFilters(activeCategory = "all") {
    const container = document.getElementById('category-filters');
    const totalLinksCount = links.length;

    container.innerHTML = `
        <button class="category-btn ${activeCategory === 'all' ? 'active' : ''}" data-category="all">全部 (${totalLinksCount})</button>
    `;

    categories.forEach(cat => {
        container.innerHTML += `
            <button class="category-btn ${activeCategory === cat ? 'active' : ''}" data-category="${cat}">
                ${cat} (${links.filter(link => link.category === cat).length})
            </button>
        `;
    });

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentPage = 1;
            renderFrontend(this.dataset.category);
        });
    });
}

// 显示后台
function showAdmin() {
    document.querySelector('.frontend').style.display = 'none';
    document.querySelector('.backend').style.display = 'block';
    renderAdmin();
    renderCategories();
    loadFooterInfo();
    loadWebsiteSettings();
    loadAdminFooterInfo();
}

// 显示前台
function showFrontend() {
    document.querySelector('.backend').style.display = 'none';
    document.querySelector('.frontend').style.display = 'block';
    renderFrontend(currentCategory);
    loadWebsiteLogo();
    loadWebsiteTitle();
}

// 登录
async function login() {
    const password = document.getElementById('admin-password').value;
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        const result = await response.json();
        if (result.success) {
            document.querySelector('.login-form').style.display = 'none';
            document.querySelector('.admin-panel').style.display = 'block';
        } else {
            alert('密码错误！');
        }
    } catch (error) {
        console.error('Login failed:', error);
        alert('登录失败，请重试！');
    }
}

// 渲染后台
function renderAdmin() {
    const tbody = document.getElementById('links-list');
    const startIndex = (adminCurrentPage - 1) * itemsPerPage; // 使用 adminCurrentPage
    const endIndex = startIndex + itemsPerPage;
    const paginatedLinks = tempLinks.slice(startIndex, endIndex); // 使用临时链接

    tbody.innerHTML = paginatedLinks.map((link, index) => {
        const encodeHTML = (str) => str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag]));
            
        return `
            <tr data-index="${startIndex + index}">
                <td class="arrow-cell">
                    <button class="arrow-btn up-arrow" onclick="moveUp(${startIndex + index})">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="arrow-btn down-arrow" onclick="moveDown(${startIndex + index})">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                </td>
                <td>
                    <div class="form-group">
                        <input value="${encodeHTML(link.name)}" placeholder="名称" class="name-input">
                    </div>
                </td>
                <td>
                    <div class="form-group">
                        <input value="${encodeHTML(link.url)}" placeholder="网址" class="url-input">
                    </div>
                </td>
                <td>
                    <div class="form-group">
                        <select class="category-select">
                            ${categories.map(cat => 
                                `<option value="${encodeHTML(cat)}" ${link.category === cat ? 'selected' : ''}>${encodeHTML(cat)}</option>`
                            ).join('')}
                        </select>
                    </div>
                </td>
                <td>
                    <div class="form-group">
                        <textarea class="description-textarea">${encodeHTML(link.description)}</textarea>
                    </div>
                </td>
                <td>
                    <div class="form-group">
                        <select class="status-select" onchange="updateStatus(${startIndex + index}, this.value)">
                            <option value="normal" ${link.status === 'normal' ? 'selected' : ''}>正常</option>
                            <option value="error" ${link.status !== 'normal' ? 'selected' : ''}>维护</option>
                        </select>
                    </div>
                </td>
                <td>
                    <div class="form-group">
                        <input type="text" placeholder="https://example.com/logo.png" value="${encodeHTML(link.logo || '')}" class="logo-input">
                    </div>
                </td>
                <td class="action-cell">
                    <button class="btn-secondary btn-save" onclick="saveLink(${startIndex + index})">保存</button>
                    <button class="btn-secondary btn-delete" onclick="deleteLink(${startIndex + index})">删除</button>
                </td>
            </tr>
        `;
    }).join('');

    updatePaginationButtons();
}

// 渲染分类
function renderCategories() {
    const container = document.getElementById('categories-list');
    container.innerHTML = categories.map((cat, index) => {
        const encodeHTML = (str) => str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag]));
            
        return `
            <div class="category-item">
                <span>${encodeHTML(cat)}</span>
                <button onclick="deleteCategory(${index})">✕</button>
            </div>
        `;
    }).join('');
}

// 加载页脚信息
function loadFooterInfo() {
    document.getElementById('footer-text').value = settings.footerInfo.replace('© EvanNav', '');
    document.getElementById('footer-info').innerHTML = `<p><a href="https://evan.xin" id="cvp79407dlc9i3dt24jg" style="text-decoration: none; color: inherit;">© EvanNav</a> ${settings.footerInfo.replace('© EvanNav', '')}</p>`;
}

// 加载后台页脚信息
function loadAdminFooterInfo() {
    document.getElementById('admin-footer-info').innerHTML = `<p><a href="https://evan.xin" id="cvp79407dlc9i3dt24jg" style="text-decoration: none; color: inherit;">© EvanNav</a> ${settings.footerInfo.replace('© EvanNav', '')}</p>`;
}

// 加载网站设置
function loadWebsiteSettings() {
    document.getElementById('website-logo-input').value = settings.websiteLogo;
    document.getElementById('website-title-input').value = settings.websiteTitle;
}

// 保存网站设置
async function saveWebsiteSettings() {
    const websiteLogo = document.getElementById('website-logo-input').value;
    const websiteTitle = document.getElementById('website-title-input').value;
    settings.websiteLogo = websiteLogo;
    settings.websiteTitle = websiteTitle;
    try {
        await fetch('/api/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        loadWebsiteLogo();
        loadWebsiteTitle();
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

// 加载网站Logo
function loadWebsiteLogo() {
    const websiteLogo = settings.websiteLogo;
    const logoImg = document.getElementById('website-logo');
    
    if (websiteLogo) {
        logoImg.src = websiteLogo;
        logoImg.style.display = 'block';
    } else {
        logoImg.style.display = 'none';
    }
}

// 加载网站标题
function loadWebsiteTitle() {
    const websiteTitle = settings.websiteTitle;
    document.querySelector('.logo-container h1').textContent = websiteTitle;
    document.title = websiteTitle;
}

// 保存页脚信息
async function saveFooterInfo() {
    const footerInfo = document.getElementById('footer-text').value;
    settings.footerInfo = '© EvanNav' + (footerInfo ? ' ' + footerInfo : '');
    try {
        await fetch('/api/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        loadFooterInfo();
        loadAdminFooterInfo();
    } catch (error) {
        console.error('Failed to save footer info:', error);
    }
}

// 添加新链接
async function addNewLink() {
    const newLink = { 
        name: "新链接", 
        url: "https://", 
        category: categories[0] || "未分类", 
        description: "", 
        status: "normal",
        logo: ""
    };
    try {
        const response = await fetch('/api/links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newLink)
        });
        const addedLink = await response.json();
        links.push(addedLink);
        tempLinks.push(addedLink); // 更新临时链接
        adminCurrentPage = Math.ceil(links.length / itemsPerPage);
        renderAdmin();
    } catch (error) {
        console.error('Failed to add new link:', error);
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
        alert('名称、网址和分类不能为空！');
        return;
    }

    const updatedLink = {
        name,
        url,
        category,
        description,
        status,
        logo
    };

    try {
        await fetch(`/api/links/${index}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedLink)
        });
        links[index] = updatedLink;
        tempLinks[index] = updatedLink; // 更新临时链接
        renderFrontend(currentCategory);
        renderAdmin();
    } catch (error) {
        console.error('Failed to update link:', error);
    }
}

// 保存所有链接
async function saveAllLinks() {
    try {
        await fetch('/api/links', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tempLinks) // 保存临时链接的顺序
        });
        links = [...tempLinks]; // 更新主链接列表
        renderFrontend(currentCategory);
        renderAdmin();
        alert('所有链接已保存！');
    } catch (error) {
        console.error('Failed to save all links:', error);
    }
}

// 删除链接
async function deleteLink(index) {
    if(confirm('确认删除该链接？')) {
        try {
            await fetch(`/api/links/${index}`, {
                method: 'DELETE'
            });
            links.splice(index, 1);
            tempLinks.splice(index, 1); // 更新临时链接
            adminCurrentPage = Math.max(1, Math.min(adminCurrentPage, Math.ceil(links.length / itemsPerPage)));
            renderAdmin();
            renderFrontend(currentCategory);
        } catch (error) {
            console.error('Failed to delete link:', error);
        }
    }
}

// 更新状态
async function updateStatus(index, status) {
    links[index].status = status;
    tempLinks[index].status = status; // 更新临时链接的状态
    try {
        await fetch(`/api/links/${index}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(links[index])
        });
        renderFrontend(currentCategory);
        renderAdmin();
    } catch (error) {
        console.error('Failed to update status:', error);
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
    const categoryName = document.getElementById('new-category').value.trim();
    if (!categoryName) {
        alert('分类名称不能为空！');
        return;
    }

    // 验证输入内容
    if (!/^[a-zA-Z0-9\u4e00-\u9fa5]+$/.test(categoryName)) {
        alert('分类名称只能包含字母、数字和中文！');
        return;
    }

    if (!categories.includes(categoryName)) {
        try {
            await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: categoryName })
            });
            categories.push(categoryName);
            document.getElementById('new-category').value = '';
            renderCategories();
            renderFrontend(currentCategory);
        } catch (error) {
            console.error('Failed to add category:', error);
        }
    } else {
        alert('该分类已存在！');
    }
}

// 删除分类
async function deleteCategory(index) {
    if(confirm('确认删除该分类？此操作不会删除链接，只会将链接分类重置为第一个分类')) {
        const deletedCategory = categories[index];
        try {
            await fetch(`/api/categories/${index}`, {
                method: 'DELETE'
            });
            categories.splice(index, 1);
            
            // 更新链接分类
            links.forEach(link => {
                if(link.category === deletedCategory) {
                    link.category = categories[0] || "未分类";
                }
            });
            
            tempLinks = [...links]; // 更新临时链接
            await fetch('/api/links', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(links)
            });
            
            renderCategories();
            renderAdmin();
            renderFrontend(currentCategory);
        } catch (error) {
            console.error('Failed to delete category:', error);
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
    if (adminCurrentPage * itemsPerPage < tempLinks.length) {
        adminCurrentPage++;
        renderAdmin();
    }
}

// 更新分页按钮状态
function updatePaginationButtons() {
    const filteredLinks = currentCategory === "all" 
        ? links 
        : links.filter(link => link.category === currentCategory);
    totalPages = Math.ceil(filteredLinks.length / itemsPerPage);

    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage * itemsPerPage >= filteredLinks.length;
    document.getElementById('admin-prev-page').disabled = adminCurrentPage === 1;
    document.getElementById('admin-next-page').disabled = adminCurrentPage * itemsPerPage >= tempLinks.length;
}

// 修改密码
async function changePassword() {
    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!oldPassword || !newPassword || !confirmPassword) {
        alert('所有字段不能为空！');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('新密码和确认密码不一致！');
        return;
    }

    try {
        await fetch('/api/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ oldPassword, newPassword })
        });
        alert('密码修改成功！');
        document.getElementById('old-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
    } catch (error) {
        console.error('Failed to change password:', error);
        alert('修改密码失败，请重试！');
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
        alert('请选择有效的JSON文件！');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedLinks = JSON.parse(e.target.result);
            if (!Array.isArray(importedLinks)) {
                throw new Error('导入数据格式不正确！');
            }

            importedLinks.forEach(link => {
                if (!link.name || !link.url || !link.category) {
                    throw new Error('导入数据格式不正确！');
                }
            });

            links = importedLinks;
            tempLinks = [...links]; // 更新临时链接
            try {
                fetch('/api/links', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(links)
                });
                renderAdmin();
                renderFrontend(currentCategory);
                alert('链接导入成功！');
            } catch (error) {
                console.error('Failed to import links:', error);
                alert('导入失败，请重试！');
            }
        } catch (error) {
            alert('导入失败，请检查文件格式是否正确。');
        }
    };
    reader.readAsText(file);
}

// 初始化应用
init();