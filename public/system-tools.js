// 初始化访问统计跟踪器
let linkVisitTracker;

// 访问统计功能实现
function refreshVisitStats() {
    // 确保访问统计跟踪器已初始化
    if (!linkVisitTracker) {
        linkVisitTracker = new VisitTracker();
    }
    
    // 获取访问统计数据
    const report = linkVisitTracker.generateReport();
    const links = JSON.parse(localStorage.getItem('links') || '[]');
    
    // 更新统计摘要
    document.getElementById('total-links-count').textContent = report.totalLinks || links.length;
    document.getElementById('total-visits-count').textContent = report.totalVisits || 0;
    document.getElementById('today-visits-count').textContent = report.todayVisits || 0;
    
    // 更新访问量最高的链接表格
    const mostVisitedLinks = report.mostVisited || [];
    const mostVisitedLinksTable = document.getElementById('most-visited-links');
    mostVisitedLinksTable.innerHTML = '';
    
    mostVisitedLinks.forEach(link => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${link.name}</td>
            <td>${link.totalVisits}</td>
            <td>${link.lastVisit ? new Date(link.lastVisit).toLocaleString() : '从未访问'}</td>
        `;
        mostVisitedLinksTable.appendChild(row);
    });
    
    // 如果没有数据，显示提示信息
    if (mostVisitedLinks.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" class="text-center">暂无访问数据</td>';
        mostVisitedLinksTable.appendChild(row);
    }
    
    // 更新最近访问的链接表格
    const recentlyVisitedLinks = report.recentlyVisited || [];
    const recentlyVisitedLinksTable = document.getElementById('recently-visited-links');
    recentlyVisitedLinksTable.innerHTML = '';
    
    recentlyVisitedLinks.forEach(link => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${link.name}</td>
            <td>${link.totalVisits}</td>
            <td>${link.lastVisit ? new Date(link.lastVisit).toLocaleString() : '从未访问'}</td>
        `;
        recentlyVisitedLinksTable.appendChild(row);
    });
    
    // 如果没有数据，显示提示信息
    if (recentlyVisitedLinks.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" class="text-center">暂无访问数据</td>';
        recentlyVisitedLinksTable.appendChild(row);
    }
    
    showToast('访问统计已刷新');
}

// 导出访问统计数据
function exportVisitStats() {
    // 确保访问统计跟踪器已初始化
    if (!linkVisitTracker) {
        linkVisitTracker = new VisitTracker();
    }
    
    const report = linkVisitTracker.generateReport();
    
    const exportData = {
        summary: {
            totalLinks: report.totalLinks,
            totalVisits: report.totalVisits,
            todayVisits: report.todayVisits,
            exportDate: new Date().toISOString()
        },
        mostVisitedLinks: report.mostVisited,
        recentlyVisitedLinks: report.recentlyVisited
    };
    
    // 创建下载链接
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "visit_statistics_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    showToast('访问统计数据已导出');
}

// 清除访问统计数据
function clearVisitStats() {
    // 确保访问统计跟踪器已初始化
    if (!linkVisitTracker) {
        linkVisitTracker = new VisitTracker();
    }
    
    if (confirm('确定要清除所有访问统计数据吗？此操作不可恢复。')) {
        linkVisitTracker.clearStats();
        refreshVisitStats();
        showToast('访问统计数据已清除');
    }
}

// 缓存管理功能实现
function refreshCacheInfo() {
    // 确保缓存服务已初始化
    if (typeof cacheService === 'undefined') {
        console.error('缓存服务未初始化');
        return;
    }
    
    // 获取缓存信息
    const memoryCacheCount = Object.keys(cacheService.memoryCache).length;
    
    // 计算localStorage中的缓存项数量
    let localStorageCacheCount = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(cacheService.prefix)) {
            localStorageCacheCount++;
        }
    }
    
    const lastClearTime = localStorage.getItem('lastCacheClearTime');
    
    // 更新缓存信息显示
    document.getElementById('memory-cache-count').textContent = memoryCacheCount;
    document.getElementById('local-storage-count').textContent = localStorageCacheCount;
    document.getElementById('last-cache-clear').textContent = lastClearTime ? new Date(lastClearTime).toLocaleString() : '从未清理';
    
    showToast('缓存信息已刷新');
}

// 清理过期缓存
function clearExpiredCache() {
    // 确保缓存服务已初始化
    if (typeof cacheService === 'undefined') {
        console.error('缓存服务未初始化');
        return;
    }
    
    cacheService.clearExpired();
    localStorage.setItem('lastCacheClearTime', new Date().toISOString());
    refreshCacheInfo();
    showToast('已清理过期缓存');
}

// 清除所有缓存
function clearAllCache() {
    // 确保缓存服务已初始化
    if (typeof cacheService === 'undefined') {
        console.error('缓存服务未初始化');
        return;
    }
    
    if (confirm('确定要清除所有缓存数据吗？这可能会导致页面加载速度暂时变慢。')) {
        cacheService.clear();
        localStorage.setItem('lastCacheClearTime', new Date().toISOString());
        refreshCacheInfo();
        showToast('已清除所有缓存');
    }
}

// 性能监控功能实现
function refreshPerformanceMetrics() {
    // 确保性能监控工具已初始化
    if (typeof PerformanceMonitor === 'undefined') {
        console.error('性能监控工具未初始化');
        return;
    }
    
    // 获取性能指标
    const metrics = PerformanceMonitor.getMetrics();
    
    // 更新页面加载性能指标
    document.getElementById('page-load-time').textContent = 
        (metrics.page_load?.duration || 0).toFixed(2) + ' ms';
    document.getElementById('dom-parse-time').textContent = 
        (metrics.crp_dom || 0).toFixed(2) + ' ms';
    document.getElementById('first-paint-time').textContent = 
        (metrics.crp_fcp || 0).toFixed(2) + ' ms';
    
    // 更新资源使用情况
    if (window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        document.getElementById('memory-usage').textContent = 
            (memory.usedJSHeapSize / (1024 * 1024)).toFixed(2) + ' MB';
        document.getElementById('js-heap-size').textContent = 
            (memory.totalJSHeapSize / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
        document.getElementById('memory-usage').textContent = '不可用';
        document.getElementById('js-heap-size').textContent = '不可用';
    }
    
    showToast('性能指标已刷新');
}

// 生成性能报告
function generatePerformanceReport() {
    // 确保性能监控工具已初始化
    if (typeof PerformanceMonitor === 'undefined') {
        console.error('性能监控工具未初始化');
        return;
    }
    
    // 获取性能指标
    const metrics = PerformanceMonitor.getMetrics();
    
    // 创建报告数据
    const reportData = {
        timestamp: new Date().toISOString(),
        pageLoad: {
            total: metrics.page_load?.duration || 0,
            domParse: metrics.crp_dom || 0,
            firstPaint: metrics.crp_fcp || 0,
            request: metrics.crp_request || 0,
            dns: metrics.crp_dns || 0,
            tcp: metrics.crp_tcp || 0
        },
        memory: {}
    };
    
    // 添加内存使用情况（如果可用）
    if (window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        reportData.memory = {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit
        };
    }
    
    // 创建下载链接
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "performance_report_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    showToast('性能报告已生成');
}

// 显示提示消息
function showToast(message) {
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    // 添加到页面
    document.body.appendChild(toast);
    
    // 显示toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // 3秒后隐藏并移除
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// 初始化函数 - 在页面加载完成后调用
document.addEventListener('DOMContentLoaded', function() {
    // 初始化访问统计跟踪器
    linkVisitTracker = new VisitTracker();
    
    // 初始化访问统计标签页
    const visitStatsTab = document.querySelector('.admin-tab[data-tab="visit-statistics"]');
    if (visitStatsTab) {
        visitStatsTab.addEventListener('click', function() {
            refreshVisitStats();
        });
    }
    
    // 为访问统计页面的按钮添加事件监听器
    const refreshStatsBtn = document.getElementById('refresh-stats-btn');
    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', refreshVisitStats);
    }
    
    const exportStatsBtn = document.getElementById('export-stats-btn');
    if (exportStatsBtn) {
        exportStatsBtn.addEventListener('click', exportVisitStats);
    }
    
    const clearStatsBtn = document.getElementById('clear-stats-btn');
    if (clearStatsBtn) {
        clearStatsBtn.addEventListener('click', clearVisitStats);
    }
    
    // 初始化系统工具标签页
    const systemToolsTab = document.querySelector('.admin-tab[data-tab="system-tools"]');
    if (systemToolsTab) {
        systemToolsTab.addEventListener('click', function() {
            refreshCacheInfo();
            refreshPerformanceMetrics();
        });
    }
    
    // 为缓存管理按钮添加事件监听器
    const refreshCacheBtn = document.getElementById('refresh-cache-btn');
    if (refreshCacheBtn) {
        refreshCacheBtn.addEventListener('click', refreshCacheInfo);
    }
    
    const clearExpiredCacheBtn = document.getElementById('clear-expired-cache-btn');
    if (clearExpiredCacheBtn) {
        clearExpiredCacheBtn.addEventListener('click', clearExpiredCache);
    }
    
    const clearAllCacheBtn = document.getElementById('clear-all-cache-btn');
    if (clearAllCacheBtn) {
        clearAllCacheBtn.addEventListener('click', clearAllCache);
    }
    
    // 为性能监控按钮添加事件监听器
    const refreshMetricsBtn = document.getElementById('refresh-metrics-btn');
    if (refreshMetricsBtn) {
        refreshMetricsBtn.addEventListener('click', refreshPerformanceMetrics);
    }
    
    const generateReportBtn = document.getElementById('generate-report-btn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generatePerformanceReport);
    }
});
