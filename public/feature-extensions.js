// 链接访问统计功能
class VisitTracker {
    constructor() {
        this.storageKey = 'evannav_visit_stats';
        this.stats = this.loadStats();
        this.initEventListeners();
    }
    
    // 加载统计数据
    loadStats() {
        try {
            const statsData = localStorage.getItem(this.storageKey);
            return statsData ? JSON.parse(statsData) : {};
        } catch (error) {
            console.error('加载访问统计数据失败:', error);
            return {};
        }
    }
    
    // 保存统计数据
    saveStats() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
            return true;
        } catch (error) {
            console.error('保存访问统计数据失败:', error);
            return false;
        }
    }
    
    // 记录访问
    recordVisit(linkId, linkName) {
        if (!linkId) return false;
        
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // YYYY-MM-DD格式
        
        // 初始化链接的统计数据
        if (!this.stats[linkId]) {
            this.stats[linkId] = {
                name: linkName || `链接${linkId}`,
                totalVisits: 0,
                lastVisit: null,
                dailyVisits: {}
            };
        }
        
        // 更新总访问次数
        this.stats[linkId].totalVisits++;
        
        // 更新最后访问时间
        this.stats[linkId].lastVisit = now.toISOString();
        
        // 更新每日访问次数
        if (!this.stats[linkId].dailyVisits[today]) {
            this.stats[linkId].dailyVisits[today] = 0;
        }
        this.stats[linkId].dailyVisits[today]++;
        
        // 保存统计数据
        return this.saveStats();
    }
    
    // 获取链接的统计数据
    getLinkStats(linkId) {
        return this.stats[linkId] || null;
    }
    
    // 获取所有链接的统计数据
    getAllStats() {
        return this.stats;
    }
    
    // 获取访问量最高的链接
    getMostVisitedLinks(limit = 10) {
        return Object.entries(this.stats)
            .map(([id, data]) => ({
                id,
                name: data.name,
                totalVisits: data.totalVisits,
                lastVisit: data.lastVisit
            }))
            .sort((a, b) => b.totalVisits - a.totalVisits)
            .slice(0, limit);
    }
    
    // 获取最近访问的链接
    getRecentlyVisitedLinks(limit = 10) {
        return Object.entries(this.stats)
            .map(([id, data]) => ({
                id,
                name: data.name,
                totalVisits: data.totalVisits,
                lastVisit: data.lastVisit
            }))
            .filter(item => item.lastVisit)
            .sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit))
            .slice(0, limit);
    }
    
    // 获取特定日期的访问统计
    getDailyStats(date) {
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
        const result = {};
        
        Object.entries(this.stats).forEach(([id, data]) => {
            if (data.dailyVisits && data.dailyVisits[dateStr]) {
                result[id] = {
                    name: data.name,
                    visits: data.dailyVisits[dateStr]
                };
            }
        });
        
        return result;
    }
    
    // 清除统计数据
    clearStats() {
        this.stats = {};
        return this.saveStats();
    }
    
    // 初始化事件监听器
    initEventListeners() {
        // 使用事件委托监听链接点击
        document.addEventListener('click', (event) => {
            // 查找最近的链接元素
            let target = event.target;
            while (target && target !== document) {
                if (target.tagName === 'A' && target.classList.contains('nav-link')) {
                    // 获取链接ID
                    const listItem = target.closest('.nav-item');
                    if (listItem && listItem.dataset.index) {
                        const linkId = listItem.dataset.index;
                        const linkName = target.querySelector('.link-name')?.textContent || '';
                        
                        // 记录访问
                        this.recordVisit(linkId, linkName);
                    }
                    break;
                }
                target = target.parentNode;
            }
        });
    }
    
    // 生成访问统计报告
    generateReport() {
        const mostVisited = this.getMostVisitedLinks(5);
        const recentlyVisited = this.getRecentlyVisitedLinks(5);
        
        // 计算总访问量
        let totalVisits = 0;
        Object.values(this.stats).forEach(data => {
            totalVisits += data.totalVisits;
        });
        
        // 计算今日访问量
        const today = new Date().toISOString().split('T')[0];
        let todayVisits = 0;
        Object.values(this.stats).forEach(data => {
            if (data.dailyVisits && data.dailyVisits[today]) {
                todayVisits += data.dailyVisits[today];
            }
        });
        
        return {
            totalLinks: Object.keys(this.stats).length,
            totalVisits,
            todayVisits,
            mostVisited,
            recentlyVisited
        };
    }
}

// 已删除主题功能和搜索功能
