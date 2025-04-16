// 更新后台分类过滤器
function updateAdminCategoryFilters() {
    const filterContainer = utils.getElement('admin-category-filters');
    if (!filterContainer) return;
    
    // 清空容器
    filterContainer.innerHTML = '';
    
    // 添加"全部"按钮
    const allButton = document.createElement('button');
    allButton.className = `admin-category-btn ${adminCurrentCategory === 'all' ? 'active' : ''}`;
    allButton.textContent = '全部';
    allButton.onclick = () => {
        adminCurrentCategory = 'all';
        adminCurrentPage = 1;
        renderAdmin();
    };
    filterContainer.appendChild(allButton);
    
    // 添加分类按钮
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = `admin-category-btn ${adminCurrentCategory === category ? 'active' : ''}`;
        button.textContent = category;
        button.onclick = () => {
            adminCurrentCategory = category;
            adminCurrentPage = 1;
            renderAdmin();
        };
        filterContainer.appendChild(button);
    });
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
    
    // 生成页码
    if (totalPages > 1) {
        // 确定要显示的页码范围
        let startPage = Math.max(1, adminCurrentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        // 调整起始页，确保始终显示5个页码（如果总页数足够）
        if (endPage - startPage < 4 && totalPages > 5) {
            startPage = Math.max(1, endPage - 4);
        }
        
        // 添加第一页和省略号
        if (startPage > 1) {
            addPageNumber(1);
            if (startPage > 2) {
                addEllipsis();
            }
        }
        
        // 添加中间页码
        for (let i = startPage; i <= endPage; i++) {
            addPageNumber(i);
        }
        
        // 添加省略号和最后一页
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                addEllipsis();
            }
            addPageNumber(totalPages);
        }
    }
    
    // 添加页码按钮
    function addPageNumber(pageNum) {
        const pageButton = document.createElement('button');
        pageButton.className = `page-number ${adminCurrentPage === pageNum ? 'active' : ''}`;
        pageButton.textContent = pageNum;
        pageButton.onclick = () => {
            adminCurrentPage = pageNum;
            renderAdmin();
        };
        paginationNumbers.appendChild(pageButton);
    }
    
    // 添加省略号
    function addEllipsis() {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        paginationNumbers.appendChild(ellipsis);
    }
}

// 搜索链接
function searchLinks() {
    const searchInput = utils.getElement('admin-search-input');
    if (!searchInput) return;
    
    searchQuery = searchInput.value.trim();
    adminCurrentPage = 1;
    renderAdmin();
}
