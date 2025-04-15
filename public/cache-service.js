// 缓存服务实现
class CacheService {
    constructor(prefix = 'evannav_') {
        this.prefix = prefix;
        this.memoryCache = {};
        this.cacheExpiration = {};
        this.defaultTTL = 3600000; // 默认缓存1小时（毫秒）
    }

    // 设置缓存项
    set(key, value, ttl = this.defaultTTL) {
        const prefixedKey = this.prefix + key;
        
        // 内存缓存
        this.memoryCache[prefixedKey] = value;
        this.cacheExpiration[prefixedKey] = Date.now() + ttl;
        
        // localStorage缓存
        try {
            const cacheItem = {
                value: value,
                expiry: Date.now() + ttl
            };
            localStorage.setItem(prefixedKey, JSON.stringify(cacheItem));
            return true;
        } catch (error) {
            console.warn('localStorage缓存失败:', error);
            return false;
        }
    }

    // 获取缓存项
    get(key) {
        const prefixedKey = this.prefix + key;
        
        // 先检查内存缓存
        if (this.memoryCache[prefixedKey]) {
            // 检查是否过期
            if (this.cacheExpiration[prefixedKey] > Date.now()) {
                return this.memoryCache[prefixedKey];
            } else {
                // 过期则删除
                delete this.memoryCache[prefixedKey];
                delete this.cacheExpiration[prefixedKey];
            }
        }
        
        // 再检查localStorage
        try {
            const cacheItemStr = localStorage.getItem(prefixedKey);
            if (cacheItemStr) {
                const cacheItem = JSON.parse(cacheItemStr);
                // 检查是否过期
                if (cacheItem.expiry > Date.now()) {
                    // 同步到内存缓存
                    this.memoryCache[prefixedKey] = cacheItem.value;
                    this.cacheExpiration[prefixedKey] = cacheItem.expiry;
                    return cacheItem.value;
                } else {
                    // 过期则删除
                    localStorage.removeItem(prefixedKey);
                }
            }
        } catch (error) {
            console.warn('读取localStorage缓存失败:', error);
        }
        
        return null;
    }

    // 删除缓存项
    remove(key) {
        const prefixedKey = this.prefix + key;
        
        // 删除内存缓存
        delete this.memoryCache[prefixedKey];
        delete this.cacheExpiration[prefixedKey];
        
        // 删除localStorage缓存
        try {
            localStorage.removeItem(prefixedKey);
            return true;
        } catch (error) {
            console.warn('删除localStorage缓存失败:', error);
            return false;
        }
    }

    // 清除所有缓存
    clear() {
        // 清除内存缓存
        this.memoryCache = {};
        this.cacheExpiration = {};
        
        // 清除localStorage缓存
        try {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.prefix)) {
                    keys.push(key);
                }
            }
            
            keys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.warn('清除localStorage缓存失败:', error);
            return false;
        }
    }

    // 清理过期缓存
    clearExpired() {
        // 清理内存缓存
        const now = Date.now();
        Object.keys(this.cacheExpiration).forEach(key => {
            if (this.cacheExpiration[key] <= now) {
                delete this.memoryCache[key];
                delete this.cacheExpiration[key];
            }
        });
        
        // 清理localStorage缓存
        try {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.prefix)) {
                    const cacheItemStr = localStorage.getItem(key);
                    if (cacheItemStr) {
                        const cacheItem = JSON.parse(cacheItemStr);
                        if (cacheItem.expiry <= now) {
                            keys.push(key);
                        }
                    }
                }
            }
            
            keys.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.warn('清理过期localStorage缓存失败:', error);
        }
    }
}

// 创建全局缓存服务实例
const cacheService = new CacheService();

// 定期清理过期缓存
setInterval(() => {
    cacheService.clearExpired();
}, 300000); // 每5分钟清理一次
