// 分享功能相关函数

// 当前分享的链接信息
let currentShareLink = null;

// 显示分享弹窗
function showShareModal(link) {
    // 保存当前分享的链接信息
    currentShareLink = link;
    
    // 设置分享弹窗内容
    const shareLogo = document.getElementById('share-logo');
    const shareName = document.getElementById('share-name');
    const shareDesc = document.getElementById('share-desc');
    const shareUrl = document.getElementById('share-url');
    const shareQrcode = document.getElementById('share-qrcode');
    
    // 填充内容
    shareLogo.src = link.logo || '';
    shareLogo.alt = link.name;
    shareName.textContent = link.name;
    shareDesc.textContent = link.description || '';
    
    // 去掉URL前缀
    const displayUrl = link.url.replace(/^https?:\/\//, '');
    shareUrl.textContent = displayUrl;
    
    // 生成二维码
    generateQRCode(link.url);
    
    // 显示弹窗
    const modal = document.getElementById('share-modal');
    modal.classList.add('active');
    
    // 阻止点击事件冒泡
    if (event) {
        event.stopPropagation();
    }
}

// 关闭分享弹窗
function closeShareModal() {
    const modal = document.getElementById('share-modal');
    modal.classList.remove('active');
}

// 生成二维码
function generateQRCode(url) {
    // 检测是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // 如果是移动设备，直接使用固定的二维码图片
    if (isMobile) {
        const shareQrcode = document.getElementById('share-qrcode');
        shareQrcode.src = 'https://evan.plus/images/evan-m.png';
        console.log('移动端使用固定二维码: https://evan.plus/images/evan-m.png');
        return;
    }
    
    // 桌面端继续使用动态生成的二维码
    // 使用QRCode.js库生成二维码
    if (typeof QRCode !== 'undefined') {
        // 清除旧的二维码容器
        const qrcodeContainer = document.getElementById('qrcode-container');
        if (qrcodeContainer) {
            qrcodeContainer.innerHTML = '';
            
            try {
                // 创建新的二维码
                new QRCode(qrcodeContainer, {
                    text: url,
                    width: 100,
                    height: 100,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
                
                // 获取生成的图片并设置到img元素
                setTimeout(() => {
                    const qrcodeImg = qrcodeContainer.querySelector('img');
                    if (qrcodeImg) {
                        const shareQrcode = document.getElementById('share-qrcode');
                        shareQrcode.src = qrcodeImg.src;
                    } else {
                        // 如果没有找到img元素，可能是移动端的问题，尝试获取canvas
                        const qrcodeCanvas = qrcodeContainer.querySelector('canvas');
                        if (qrcodeCanvas) {
                            try {
                                const shareQrcode = document.getElementById('share-qrcode');
                                shareQrcode.src = qrcodeCanvas.toDataURL('image/png');
                            } catch (e) {
                                console.error('Canvas to data URL error:', e);
                                useBackupQRCode(url);
                            }
                        } else {
                            useBackupQRCode(url);
                        }
                    }
                }, 200); // 增加更长的延迟时间，确保二维码生成完成
            } catch (error) {
                console.error('QR code generation error:', error);
                useBackupQRCode(url);
            }
        }
    } else {
        // QRCode库未加载时使用备用方法
        useBackupQRCode(url);
    }
    
    // 使用备用的二维码生成服务
    function useBackupQRCode(url) {
        const shareQrcode = document.getElementById('share-qrcode');
        // 使用Google Charts API生成二维码
        shareQrcode.src = 'https://chart.googleapis.com/chart?cht=qr&chl=' + encodeURIComponent(url) + '&chs=100x100&chld=H|0';
        
        // 如果Google Charts API也失败，尝试QRServer API
        shareQrcode.onerror = function() {
            shareQrcode.src = 'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=' + encodeURIComponent(url);
        };
    }
}

// 分享到QQ
function shareToQQ() {
    if (!currentShareLink) return;
    
    const url = encodeURIComponent(currentShareLink.url);
    const title = encodeURIComponent(currentShareLink.name);
    const desc = encodeURIComponent(currentShareLink.description || '');
    const shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}&desc=${desc}`;
    
    window.open(shareUrl, '_blank');
}

// 分享到微信
function shareToWechat() {
    // 微信分享通常是展示二维码让用户扫描
    alert('请使用微信扫描二维码分享');
}

// 下载分享图片
function downloadShareImage() {
    if (!currentShareLink) return;
    
    // 创建一个临时的canvas元素
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置canvas大小与参考图片一致
    canvas.width = 350;
    canvas.height = 200;
    
    // 绘制背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制上半部分（白色背景）
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, 120);
    
    // 绘制下半部分（浅灰色背景）
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 120, canvas.width, 80);
    
    // 绘制上半部分的细线边框
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, canvas.width - 20, 100);
    
    // 获取logo图片
    const logoImg = document.getElementById('share-logo');
    if (logoImg && logoImg.src && logoImg.src !== 'data:,' && !logoImg.src.endsWith('/')) {
        const logo = new Image();
        logo.crossOrigin = 'Anonymous';
        logo.onload = function() {
            // 绘制logo（左侧）
            ctx.save();
            ctx.beginPath();
            ctx.arc(40, 60, 25, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(logo, 15, 35, 50, 50);
            ctx.restore();
            
            // 绘制名称和描述
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(currentShareLink.name, 80, 50);
            
            ctx.fillStyle = '#64748b';
            ctx.font = '12px Arial';
            const desc = currentShareLink.description || '';
            ctx.fillText(desc.length > 20 ? desc.substring(0, 20) + '...' : desc, 80, 70);
            
            // 获取二维码图片
            const qrcode = document.getElementById('share-qrcode');
            if (qrcode && qrcode.src) {
                const qrcodeImg = new Image();
                qrcodeImg.crossOrigin = 'Anonymous';
                qrcodeImg.onload = function() {
                    // 绘制二维码（右侧）
                    ctx.drawImage(qrcodeImg, canvas.width - 100, 20, 80, 80);
                    
                    // 绘制URL（中间部分）
                    ctx.fillStyle = '#475569';
                    ctx.font = '14px Arial';
                    ctx.textAlign = 'center';
                    const displayUrl = currentShareLink.url.replace(/^https?:\/\//, '');
                    ctx.fillText(displayUrl, canvas.width / 2, 150);
                    
                    // 绘制底部图标
                    drawBottomIcons();
                };
                qrcodeImg.onerror = function() {
                    console.error('QR code image load failed');
                    // 绘制URL和底部图标，即使二维码加载失败
                    ctx.fillStyle = '#475569';
                    ctx.font = '14px Arial';
                    ctx.textAlign = 'center';
                    const displayUrl = currentShareLink.url.replace(/^https?:\/\//, '');
                    ctx.fillText(displayUrl, canvas.width / 2, 150);
                    
                    drawBottomIcons();
                };
                qrcodeImg.src = qrcode.src;
            } else {
                // 没有二维码时，仍然绘制URL和底部图标
                ctx.fillStyle = '#475569';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                const displayUrl = currentShareLink.url.replace(/^https?:\/\//, '');
                ctx.fillText(displayUrl, canvas.width / 2, 150);
                
                drawBottomIcons();
            }
        };
        logo.onerror = function() {
            // logo加载失败时，仍然继续处理
            console.error('Logo image load failed');
            processWithoutLogo();
        };
        logo.src = logoImg.src;
    } else {
        // 没有logo时的处理
        processWithoutLogo();
    }
    
    // 没有logo时的处理函数
    function processWithoutLogo() {
        // 绘制名称和描述
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(currentShareLink.name, 80, 50);
        
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Arial';
        const desc = currentShareLink.description || '';
        ctx.fillText(desc.length > 20 ? desc.substring(0, 20) + '...' : desc, 80, 70);
        
        // 获取二维码图片
        const qrcode = document.getElementById('share-qrcode');
        if (qrcode && qrcode.src) {
            const qrcodeImg = new Image();
            qrcodeImg.crossOrigin = 'Anonymous';
            qrcodeImg.onload = function() {
                // 绘制二维码（右侧）
                ctx.drawImage(qrcodeImg, canvas.width - 100, 20, 80, 80);
                
                // 绘制URL（中间部分）
                ctx.fillStyle = '#475569';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                const displayUrl = currentShareLink.url.replace(/^https?:\/\//, '');
                ctx.fillText(displayUrl, canvas.width / 2, 150);
                
                // 绘制底部图标
                drawBottomIcons();
            };
            qrcodeImg.onerror = function() {
                console.error('QR code image load failed');
                // 绘制URL和底部图标，即使二维码加载失败
                ctx.fillStyle = '#475569';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                const displayUrl = currentShareLink.url.replace(/^https?:\/\//, '');
                ctx.fillText(displayUrl, canvas.width / 2, 150);
                
                drawBottomIcons();
            };
            qrcodeImg.src = qrcode.src;
        } else {
            // 没有二维码时，仍然绘制URL和底部图标
            ctx.fillStyle = '#475569';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            const displayUrl = currentShareLink.url.replace(/^https?:\/\//, '');
            ctx.fillText(displayUrl, canvas.width / 2, 150);
            
            drawBottomIcons();
        }
    }
    
    // 绘制底部图标
    function drawBottomIcons() {
        // 直接下载图片，不绘制底部图标
        downloadCanvasImage();
    }
    
    // 下载canvas图片
    function downloadCanvasImage() {
        try {
            // 在移动设备上使用不同的下载方法
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                // 移动设备：打开图片在新窗口，用户可以长按保存
                const dataUrl = canvas.toDataURL('image/png');
                const newTab = window.open();
                if (newTab) {
                    newTab.document.write(`<img src="${dataUrl}" alt="分享图片" style="max-width:100%"/>`);
                    newTab.document.write('<p style="text-align:center">长按图片保存到相册</p>');
                    newTab.document.title = `${currentShareLink.name}-分享`;
                } else {
                    alert('无法打开新窗口，请检查浏览器设置');
                }
            } else {
                // 桌面设备：使用常规下载方法
                const dataUrl = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = `${currentShareLink.name}-分享.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Download image error:', error);
            alert('下载图片失败，请重试');
        }
    }
}

// 复制分享链接
function copyShareLink() {
    if (!currentShareLink) return;
    
    // 创建临时textarea元素
    const textarea = document.createElement('textarea');
    textarea.value = currentShareLink.url;
    document.body.appendChild(textarea);
    
    // 选择并复制文本
    textarea.select();
    document.execCommand('copy');
    
    // 移除临时元素
    document.body.removeChild(textarea);
    
    // 显示提示
    alert('链接已复制到剪贴板');
}

// 点击弹窗外部关闭弹窗
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('share-modal');
    
    // 点击弹窗外部关闭
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeShareModal();
        }
    });
});
