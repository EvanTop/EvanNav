// 图片懒加载实现
document.addEventListener('DOMContentLoaded', function() {
    // 初始化懒加载
    initLazyLoading();
    
    // 监听滚动事件，使用节流函数优化性能
    window.addEventListener('scroll', throttle(checkLazyImages, 200));
    
    // 监听窗口大小变化，重新检查懒加载图片
    window.addEventListener('resize', throttle(checkLazyImages, 200));
});

// 初始化懒加载
function initLazyLoading() {
    // 获取所有带有data-src属性的图片
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    // 创建IntersectionObserver，如果浏览器支持
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                // 当图片进入视口时加载
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '0px 0px 200px 0px' // 提前200px加载
        });
        
        // 观察所有懒加载图片
        lazyImages.forEach(function(img) {
            imageObserver.observe(img);
        });
    } else {
        // 如果浏览器不支持IntersectionObserver，立即加载所有图片
        lazyImages.forEach(function(img) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
}

// 检查懒加载图片
function checkLazyImages() {
    // 如果浏览器不支持IntersectionObserver，手动检查图片是否在视口内
    if (!('IntersectionObserver' in window)) {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(function(img) {
            if (isInViewport(img)) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
        });
    }
}

// 检查元素是否在视口内
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) + 200 &&
        rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
        rect.bottom >= -200 &&
        rect.right >= 0
    );
}

// 节流函数，限制函数调用频率
function throttle(func, delay) {
    let lastCall = 0;
    return function(...args) {
        const now = new Date().getTime();
        if (now - lastCall < delay) {
            return;
        }
        lastCall = now;
        return func(...args);
    };
}

// 动态加载链接列表
function lazyLoadLinks(links, container, startIndex, endIndex, category = "all") {
    // 使用DocumentFragment提高性能
    const fragment = document.createDocumentFragment();
    
    // 过滤链接
    const filteredLinks = category === "all" 
        ? links 
        : links.filter(link => link.category === category);
    
    // 获取当前页的链接
    const paginatedLinks = filteredLinks.slice(startIndex, endIndex);
    
    // 创建链接元素
    paginatedLinks.forEach(link => {
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.dataset.index = filteredLinks.indexOf(link);
        
        // 使用data-src属性进行懒加载
        const logoImg = link.logo 
            ? `<img data-src="${link.logo}" class="link-logo" alt="${encodeHTML(link.name)}">`
            : '';
            
        li.innerHTML = `
            <a href="${link.url}" class="nav-link" target="_blank">
                ${logoImg}
                <div class="link-info">
                    <div class="link-name">${encodeHTML(link.name)}</div>
                    <div class="link-desc">${encodeHTML(link.description)}</div>
                </div>
            </a>
            <div class="link-status">
                <span class="status-badge ${link.status === 'normal' ? 'status-normal' : 'status-error'}">
                    ${link.status === 'normal' ? '正常' : '维护'}
                </span>
            </div>
        `;
        
        fragment.appendChild(li);
    });
    
    // 清空容器并添加新内容
    container.innerHTML = '';
    container.appendChild(fragment);
    
    // 初始化新添加图片的懒加载
    initLazyLoading();
    
    return paginatedLinks.length;
}

// HTML编码，防止XSS攻击
function encodeHTML(str) {
    return str ? str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])) : '';
}
