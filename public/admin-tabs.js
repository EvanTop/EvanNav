// 后台标签页切换功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化标签页切换
    initAdminTabs();
    
    // 移动端优化：检测屏幕宽度，显示/隐藏浮动按钮
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
});

// 初始化后台标签页切换
function initAdminTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    if (!tabs.length) return;
    
    tabs.forEach(tab => {
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
                
                // 如果是链接管理标签，显示浮动按钮（在移动端）
                const floatingButton = document.getElementById('mobile-add-button');
                if (floatingButton) {
                    floatingButton.style.display = tabId === 'link-management' && window.innerWidth < 768 ? 'flex' : 'none';
                }
            }
        });
    });
}

// 检测是否为移动视图
function checkMobileView() {
    const isMobile = window.innerWidth < 768;
    const floatingButton = document.getElementById('mobile-add-button');
    const activeTab = document.querySelector('.admin-tab.active');
    
    if (floatingButton) {
        // 只在移动视图下的链接管理标签页显示浮动按钮
        if (isMobile && activeTab && activeTab.getAttribute('data-tab') === 'link-management') {
            floatingButton.style.display = 'flex';
        } else {
            floatingButton.style.display = 'none';
        }
    }
    
    // 优化移动端表格显示
    if (isMobile) {
        optimizeTablesForMobile();
    }
}

// 优化移动端表格显示
function optimizeTablesForMobile() {
    const tables = document.querySelectorAll('.links-table');
    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                // 根据表头设置data-label属性，用于移动端显示
                const headerLabels = ['名称', '网址', '分类', '简介', '状态', 'Logo', '操作'];
                if (index < headerLabels.length) {
                    cell.setAttribute('data-label', headerLabels[index]);
                }
            });
        });
    });
}
