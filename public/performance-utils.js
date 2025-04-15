// 虚拟滚动实现 - 优化大量链接时的渲染性能
class VirtualScroller {
    constructor(options) {
        this.container = options.container;
        this.itemHeight = options.itemHeight || 100;
        this.buffer = options.buffer || 5; // 上下缓冲区的项目数
        this.renderItem = options.renderItem;
        this.totalItems = options.totalItems || 0;
        this.items = options.items || [];
        
        this.visibleItems = [];
        this.lastScrollTop = 0;
        this.scrollDirection = 'down';
        
        this.init();
    }
    
    init() {
        // 创建内部容器
        this.innerContainer = document.createElement('div');
        this.innerContainer.style.position = 'relative';
        this.innerContainer.style.width = '100%';
        this.innerContainer.style.height = `${this.totalItems * this.itemHeight}px`;
        
        // 清空并添加内部容器
        this.container.innerHTML = '';
        this.container.appendChild(this.innerContainer);
        
        // 添加滚动事件监听
        this.container.addEventListener('scroll', this.handleScroll.bind(this));
        
        // 初始渲染
        this.render();
    }
    
    handleScroll() {
        // 确定滚动方向
        const scrollTop = this.container.scrollTop;
        this.scrollDirection = scrollTop > this.lastScrollTop ? 'down' : 'up';
        this.lastScrollTop = scrollTop;
        
        // 使用requestAnimationFrame优化滚动性能
        requestAnimationFrame(() => {
            this.render();
        });
    }
    
    render() {
        const scrollTop = this.container.scrollTop;
        const containerHeight = this.container.clientHeight;
        
        // 计算可见区域的起始和结束索引
        const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
        const endIndex = Math.min(
            this.totalItems - 1,
            Math.ceil((scrollTop + containerHeight) / this.itemHeight) + this.buffer
        );
        
        // 计算当前可见项目
        const newVisibleItems = [];
        for (let i = startIndex; i <= endIndex; i++) {
            newVisibleItems.push(i);
        }
        
        // 找出需要添加和移除的项目
        const itemsToAdd = newVisibleItems.filter(i => !this.visibleItems.includes(i));
        const itemsToRemove = this.visibleItems.filter(i => !newVisibleItems.includes(i));
        
        // 移除不再可见的项目
        itemsToRemove.forEach(index => {
            const element = this.innerContainer.querySelector(`[data-index="${index}"]`);
            if (element) {
                this.innerContainer.removeChild(element);
            }
        });
        
        // 添加新可见的项目
        itemsToAdd.forEach(index => {
            if (index >= 0 && index < this.totalItems && this.items[index]) {
                const item = this.items[index];
                const element = this.renderItem(item, index);
                element.dataset.index = index;
                element.style.position = 'absolute';
                element.style.top = `${index * this.itemHeight}px`;
                element.style.width = '100%';
                this.innerContainer.appendChild(element);
            }
        });
        
        // 更新可见项目列表
        this.visibleItems = newVisibleItems;
    }
    
    // 更新数据
    updateData(items, totalItems) {
        this.items = items || this.items;
        this.totalItems = totalItems || this.items.length;
        
        // 更新内部容器高度
        this.innerContainer.style.height = `${this.totalItems * this.itemHeight}px`;
        
        // 清空当前可见项目
        this.visibleItems = [];
        this.innerContainer.innerHTML = '';
        
        // 重新渲染
        this.render();
    }
    
    // 滚动到指定索引
    scrollToIndex(index) {
        if (index >= 0 && index < this.totalItems) {
            this.container.scrollTop = index * this.itemHeight;
        }
    }
}

// 资源压缩工具
const CompressionUtils = {
    // 压缩JSON数据
    compressJSON(data) {
        try {
            // 使用JSON.stringify移除空白字符
            const jsonString = JSON.stringify(data);
            
            // 如果浏览器支持CompressionStream，使用gzip压缩
            if (typeof CompressionStream !== 'undefined') {
                const blob = new Blob([jsonString], { type: 'application/json' });
                const compressedStream = blob.stream().pipeThrough(new CompressionStream('gzip'));
                return new Response(compressedStream).blob();
            }
            
            // 否则返回原始JSON字符串
            return jsonString;
        } catch (error) {
            console.error('压缩JSON数据失败:', error);
            return JSON.stringify(data);
        }
    },
    
    // 解压JSON数据
    async decompressJSON(data) {
        try {
            // 如果是Blob类型，说明是压缩过的
            if (data instanceof Blob) {
                // 使用DecompressionStream解压
                const decompressedStream = data.stream().pipeThrough(new DecompressionStream('gzip'));
                const decompressedBlob = await new Response(decompressedStream).blob();
                const jsonString = await decompressedBlob.text();
                return JSON.parse(jsonString);
            }
            
            // 如果是字符串，直接解析
            if (typeof data === 'string') {
                return JSON.parse(data);
            }
            
            // 其他情况直接返回
            return data;
        } catch (error) {
            console.error('解压JSON数据失败:', error);
            return data;
        }
    },
    
    // 压缩字符串
    compressString(str) {
        // 简单的字符串压缩，实际项目中可以使用更高效的算法
        if (typeof str !== 'string') return str;
        
        // 使用LZString库压缩（如果可用）
        if (typeof LZString !== 'undefined') {
            return LZString.compress(str);
        }
        
        return str;
    },
    
    // 解压字符串
    decompressString(str) {
        if (typeof str !== 'string') return str;
        
        // 使用LZString库解压（如果可用）
        if (typeof LZString !== 'undefined') {
            return LZString.decompress(str);
        }
        
        return str;
    }
};

// 性能监控工具
const PerformanceMonitor = {
    metrics: {},
    
    // 开始计时
    startTimer(label) {
        this.metrics[label] = {
            start: performance.now()
        };
    },
    
    // 结束计时并返回耗时
    endTimer(label) {
        if (!this.metrics[label] || !this.metrics[label].start) {
            console.warn(`Timer "${label}" not started`);
            return 0;
        }
        
        const end = performance.now();
        const duration = end - this.metrics[label].start;
        this.metrics[label].end = end;
        this.metrics[label].duration = duration;
        
        return duration;
    },
    
    // 记录指标
    recordMetric(label, value) {
        this.metrics[label] = {
            value: value,
            timestamp: performance.now()
        };
    },
    
    // 获取所有性能指标
    getMetrics() {
        return this.metrics;
    },
    
    // 清除所有指标
    clearMetrics() {
        this.metrics = {};
    },
    
    // 记录关键渲染路径
    recordCRP() {
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            
            // 计算关键时间点
            const metrics = {
                // DNS查询时间
                dns: timing.domainLookupEnd - timing.domainLookupStart,
                // TCP连接时间
                tcp: timing.connectEnd - timing.connectStart,
                // 请求响应时间
                request: timing.responseEnd - timing.requestStart,
                // DOM解析时间
                dom: timing.domComplete - timing.domLoading,
                // 页面加载时间
                load: timing.loadEventEnd - timing.navigationStart,
                // 首次内容绘制时间
                fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
            };
            
            Object.keys(metrics).forEach(key => {
                this.recordMetric(`crp_${key}`, metrics[key]);
            });
            
            return metrics;
        }
        
        return null;
    }
};

// 资源预加载
function preloadResources() {
    // 预加载关键CSS
    const cssLinks = [
        'styles.css',
        'admin-styles.css'
    ];
    
    cssLinks.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = href;
        document.head.appendChild(link);
    });
    
    // 预加载关键JavaScript
    const jsLinks = [
        'script.js',
        'admin-tabs.js',
        'lazy-load.js',
        'cache-service.js'
    ];
    
    jsLinks.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = src;
        document.head.appendChild(link);
    });
    
    // 预加载网站logo
    const websiteLogo = localStorage.getItem('websiteLogo');
    if (websiteLogo) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = websiteLogo;
        document.head.appendChild(link);
    }
}

// 页面加载时预加载资源
document.addEventListener('DOMContentLoaded', function() {
    // 开始性能监控
    PerformanceMonitor.startTimer('page_load');
    
    // 预加载资源
    preloadResources();
    
    // 页面加载完成后记录性能指标
    window.addEventListener('load', function() {
        PerformanceMonitor.endTimer('page_load');
        PerformanceMonitor.recordCRP();
        
        // 清理过期缓存
        if (typeof cacheService !== 'undefined') {
            cacheService.clearExpired();
        }
    });
});
