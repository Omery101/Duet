// פונקציה לטעינת מוצרים מהשרת
async function loadProductDetails(sku) {
    try {
        const response = await fetch(`/api/products/${sku}`);
        if (response.ok) {
            const product = await response.json();
            return product;
        }
        throw new Error('מוצר לא נמצא');
    } catch (error) {
        console.error('שגיאה בטעינת פרטי מוצר:', error);
        showMessage('שגיאה בטעינת פרטי המוצר', 'error');
        return null;
    }
}

// פונקציה להצגת עגלת הקניות
async function displayCart() {
    const cartItems = document.getElementById('cartItems');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">העגלה ריקה</p>';
        document.getElementById('orderButtonContainer').style.display = 'none';
        return;
    }
    
    let itemsHTML = '';
    let totalItemsCount = 0;
    
    // טעינת פרטי המוצרים מהשרת
    for (const item of cart) {
        const productDetails = await loadProductDetails(item.sku);
        if (!productDetails) {
            continue; // דילוג על מוצר שלא נמצא
        }
        
        totalItemsCount += item.quantity;
        itemsHTML += `
            <div class="cart-item" data-sku="${item.sku}">
                <div class="cart-item-image-container">
                    <img src="${productDetails.image}" alt="${productDetails.name}" class="cart-item-image" onerror="this.onerror=null; this.src='placeholder.jpg';">
                </div>
                <div class="cart-item-details">
                    <h3 class="cart-item-name">${productDetails.name}</h3>
                    <p class="cart-item-sku">מק"ט: ${productDetails.sku}</p>
                </div>
                <div class="cart-item-quantity">
                    <button type="button" class="quantity-btn" onclick="decreaseQuantity('${item.sku}')">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                        onchange="setQuantity('${item.sku}', this.value)">
                    <button type="button" class="quantity-btn" onclick="increaseQuantity('${item.sku}')">+</button>
                </div>
                <button type="button" class="remove-item" onclick="removeFromCart('${item.sku}')">×</button>
            </div>
        `;
    }
    
    // הוספת סיכום הפריטים בתחילת העגלה
    itemsHTML = `
        <div class="summary-details">
            <div class="summary-row">
                <span>סה"כ פריטים:</span>
                <span id="totalItems">${totalItemsCount}</span>
            </div>
        </div>
        ${itemsHTML}
    `;
    
    cartItems.innerHTML = itemsHTML;
    document.getElementById('orderButtonContainer').style.display = 'block';
}

// פונקציה להצגת טופס ההזמנה
function showOrderForm() {
    document.getElementById('cartItems').style.display = 'none';
    document.getElementById('orderButtonContainer').style.display = 'none';
    document.getElementById('orderFormContainer').style.display = 'block';
    document.querySelector('.cart-section').classList.add('hide-title');
}

// פונקציה להצגת העגלה
function showCart() {
    document.getElementById('cartItems').style.display = 'block';
    document.getElementById('orderButtonContainer').style.display = 'block';
    document.getElementById('orderFormContainer').style.display = 'none';
    document.querySelector('.cart-section').classList.remove('hide-title');
}

// פונקציה להגדלת כמות
function increaseQuantity(sku) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemIndex = cart.findIndex(item => item.sku === sku);
    
    if (itemIndex !== -1) {
        cart[itemIndex].quantity += 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
        updateCartCount();
    }
}

// פונקציה להקטנת כמות
function decreaseQuantity(sku) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemIndex = cart.findIndex(item => item.sku === sku);
    
    if (itemIndex !== -1) {
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1;
        } else {
            cart.splice(itemIndex, 1);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
        updateCartCount();
    }
}

// פונקציה לקביעת כמות
function setQuantity(sku, newQuantity) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemIndex = cart.findIndex(item => item.sku === sku);
    
    if (itemIndex !== -1) {
        newQuantity = parseInt(newQuantity);
        if (isNaN(newQuantity) || newQuantity < 1) {
            cart.splice(itemIndex, 1);
        } else {
            cart[itemIndex].quantity = newQuantity;
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
        updateCartCount();
    }
}

// פונקציה להסרת מוצר מהעגלה
function removeFromCart(sku) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.sku !== sku);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCart();
    updateCartCount();
}

// פונקציה לניקוי העגלה
function clearCart() {
    localStorage.removeItem('cart');
    displayCart();
    updateCartCount();
}

// פונקציה לאישור ניקוי העגלה
function confirmClearCart() {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל תכולת העגלה?')) {
        clearCart();
        showMessage('העגלה נוקתה בהצלחה', 'success');
    }
}

// פונקציה לעדכון מספר הפריטים בעגלה
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = totalItems;
    });
}

// פונקציה לשליחת הזמנה
function submitOrder(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const order = {
        id: Date.now().toString(),
        items: JSON.parse(localStorage.getItem('cart')) || [],
        customerName: formData.get('customerName'),
        email: formData.get('customerEmail'),
        phone: formData.get('customerPhone'),
        address: formData.get('customerAddress'),
        notes: formData.get('orderNotes'),
        date: new Date().toISOString()
    };
    
    // שמירת ההזמנה
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // ניקוי העגלה
    clearCart();
    
    // הצגת הודעת הצלחה
    showMessage('ההזמנה נשלחה בהצלחה!', 'success');
    
    // איפוס הטופס
    event.target.reset();
    
    // חזרה לתצוגת העגלה
    showCart();
}

// פונקציה להצגת הודעות
function showMessage(message, type) {
    // הסרת הודעות קודמות
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 9999;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        text-align: right;
    `;

    // התאמת צבעים לפי סוג ההודעה
    if (type === 'success') {
        messageDiv.style.backgroundColor = '#d4edda';
        messageDiv.style.color = '#155724';
        messageDiv.style.border = '1px solid #c3e6cb';
    } else if (type === 'error') {
        messageDiv.style.backgroundColor = '#f8d7da';
        messageDiv.style.color = '#721c24';
        messageDiv.style.border = '1px solid #f5c6cb';
    }

    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    // הוספת אנימציית היעלמות
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            messageDiv.remove();
        }, 300);
    }, 3000);
}

// הוספת סטייל לאנימציות
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// אתחול הדף
document.addEventListener('DOMContentLoaded', () => {
    displayCart();
    updateCartCount();
    
    // הוספת מאזין אירועים לטופס ההזמנה
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', submitOrder);
    }

    // הוספת מאזין אירועים לתפריט המבורגר
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // סגירת התפריט בעת לחיצה על קישור
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }
}); 