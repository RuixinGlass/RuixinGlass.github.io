// 等待DOM完全加载
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面已加载完成');
    
    // 添加购物车按钮点击事件
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            alert('商品已添加到购物车！');
        });
    }
    
    // 立即购买按钮点击事件
    const orderNowBtn = document.querySelector('.order-now-btn');
    if (orderNowBtn) {
        orderNowBtn.addEventListener('click', function() {
            alert('正在跳转到订单页面...');
        });
    }
    
    // 订购样品按钮点击事件
    const inquiryBtn = document.querySelector('.inquiry-btn');
    if (inquiryBtn) {
        inquiryBtn.addEventListener('click', function() {
            alert('正在跳转到样品订购页面...');
        });
    }
    
    // 颜色选择功能
    const colorBoxes = document.querySelectorAll('.color-box');
    colorBoxes.forEach(box => {
        box.addEventListener('click', function() {
            // 移除所有选中状态
            colorBoxes.forEach(b => b.classList.remove('selected'));
            // 添加当前选中状态
            this.classList.add('selected');
            
            // 更新选中的颜色文本
            const colorName = this.classList.contains('gold') ? '金色' : '默认颜色';
            document.querySelector('.option-value:nth-child(2)').textContent = colorName;
        });
    });
});

// 示例函数：获取产品数据
function fetchProductData() {
    // 在实际项目中，这里可能会使用fetch API从服务器获取数据
    console.log('获取产品数据...');
    
    // 模拟API请求
    setTimeout(() => {
        const productData = {
            name: '高品质商品',
            price: '299.00',
            description: '这是一个从API获取的产品描述示例。这个产品具有很多优秀的特性和功能。',
            imageUrl: 'images/product.jpg'
        };
        
        updateProductUI(productData);
    }, 1000);
}

// 示例函数：更新产品UI
function updateProductUI(data) {
    const nameElement = document.querySelector('.product-info h3');
    const priceElement = document.querySelector('.price');
    const descriptionElement = document.querySelector('.description');
    const imageElement = document.querySelector('.product-image img');
    
    if (nameElement) nameElement.textContent = data.name;
    if (priceElement) priceElement.textContent = `¥ ${data.price}`;
    if (descriptionElement) descriptionElement.textContent = data.description;
    if (imageElement) imageElement.src = data.imageUrl;
}