// אלמנטים
const productsList = document.getElementById('productsList');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const orderForm = document.getElementById('orderForm');
const orderFormElement = document.getElementById('orderFormElement');

// הצגת מוצרים
function renderProducts(products) {
    const productsList = document.getElementById('productsList');
    if (!productsList) return;

    if (products.length === 0) {
        productsList.innerHTML = '<p class="no-products">לא נמצאו מוצרים</p>';
        return;
    }

    productsList.innerHTML = products.map(product => `
        <div class="product-card">
            ${product.image ? 
                `<img src="${product.image}" alt="${product.name}" class="product-image">` : 
                '<div class="no-image">אין תמונה</div>'
            }
            <h3>${product.name}</h3>
            <p>${product.desc}</p>
            <p class="category">${getCategoryDisplayName(product.category)}</p>
            <p class="sku">מק"ט: ${product.sku}</p>
            <button onclick="openOrderForm('${product.id}')" class="order-btn">הזמן עכשיו</button>
        </div>
    `).join('');
}

// פונקציה לסינון מוצרים
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedCategory = document.getElementById('categoryFilter').value;
    const showFavorites = document.getElementById('showFavorites').checked;
    const showSale = document.getElementById('showSale').checked;
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        // שם, תיאור, קטגוריה, SKU
        const name = card.querySelector('.product-name')?.textContent?.toLowerCase() || '';
        const description = card.querySelector('.product-description')?.textContent?.toLowerCase() || '';
        const category = card.querySelector('.product-category')?.textContent?.toLowerCase() || '';
        const sku = card.getAttribute('data-sku')?.toLowerCase() || '';

        // בדיקת חיפוש
        const matchesSearch =
            !searchTerm ||
            name.includes(searchTerm) ||
            description.includes(searchTerm) ||
            category.includes(searchTerm) ||
            sku.includes(searchTerm);

        // בדיקת קטגוריה
        const matchesCategory =
            selectedCategory === 'all' ||
            card.getAttribute('data-category') === selectedCategory;

        // בדיקת מועדפים
        const matchesFavorites =
            !showFavorites || favorites.includes(sku);

        // בדיקת מבצעים
        const matchesSale =
            !showSale || card.getAttribute('data-sale') === 'true';

        // הצגה/הסתרה
        if (matchesSearch && matchesCategory && matchesFavorites && matchesSale) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// פונקציה להמרת קוד קטגוריה לשם תצוגה
function getCategoryDisplayName(categoryCode) {
    const categories = JSON.parse(localStorage.getItem('categories')) || {};
    const [mainCategory, subCategory] = categoryCode.split('_');
    
    if (categories[mainCategory]) {
        if (subCategory) {
            const sub = categories[mainCategory].subcategories.find(sub => sub.code === subCategory);
            return sub ? `${categories[mainCategory].name} - ${sub.name}` : categories[mainCategory].name;
        }
        return categories[mainCategory].name;
    }
    return categoryCode;
}

// פונקציה להמרת שם תצוגה לקוד קטגוריה
function getCategoryCode(displayName) {
    const categories = JSON.parse(localStorage.getItem('categories')) || {};
    
    for (const [code, category] of Object.entries(categories)) {
        if (category.name === displayName) {
            return code;
        }
        for (const sub of category.subcategories) {
            if (`${category.name} - ${sub.name}` === displayName) {
                return `${code}_${sub.code}`;
            }
        }
    }
    return displayName;
}


// פונקציה לטעינת מוצרים מהשרת
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        if (response.ok) {
            const serverProducts = await response.json();
            if (serverProducts && serverProducts.length > 0) {
                displayProducts(serverProducts);
                return;
            }
        }
    } catch (error) {
        console.error('Error fetching products:', error);
    }
    // fallback: נסה לטעון מה-localStorage
    const localProducts = JSON.parse(localStorage.getItem('products')) || [];
    if (localProducts.length > 0) {
        displayProducts(localProducts);
    } else {
        document.getElementById('productsList').innerHTML = '<p class="no-products">לא נמצאו מוצרים</p>';
    }
}

// הצגת מוצרים
function displayProducts(products) {
    const productsList = document.getElementById('productsList');
    if (!productsList) return;
    if (!products || products.length === 0) {
        productsList.innerHTML = '<p class="no-products">לא נמצאו מוצרים</p>';
        return;
    }
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    productsList.innerHTML = products.map(product => {
        let imageGallery = '';
        if (product.hasMultipleTypes && product.productTypes && product.productTypes.length > 0) {
            const defaultType = product.productTypes.find(type => type.isDefault) || product.productTypes[0];
            const images = product.productTypes.map(type => `
                <div class="product-type-image ${type.isDefault ? 'active' : ''}" data-type-id="${type._id}">
                    <img src="/uploads/${type.image}" alt="${type.name}" class="product-image">
                    <span class="type-name">${type.name}</span>
                </div>
            `).join('');
            imageGallery = `
                <div class="product-gallery">
                    <div class="gallery-main">
                        <img src="/uploads/${defaultType.image}" alt="${product.name}" class="product-image">
                    </div>
                    <div class="gallery-thumbnails">
                        ${images}
                    </div>
                </div>
            `;
        } else {
            imageGallery = product.image ? 
                `<img src="${product.image}" alt="${product.name}" class="product-image">` : 
                '<div class="no-image">אין תמונה</div>';
        }
        return `
            <div class="product-card" data-sku="${product.sku}" data-category="${product.category}" data-sale="${product.onSale || false}">
                ${product.onSale ? '<span class="sale-badge">מבצע!</span>' : ''}
                <button class="favorite-button ${favorites.includes(product.sku) ? 'active' : ''}" onclick="toggleFavorite('${product.sku}')">
                    <i class="fas fa-star"></i>
                </button>
                ${imageGallery}
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.desc || product.description}</p>
                    <span class="product-category">${getCategoryDisplayName(product.category)}</span>
                    <p class="product-sku">מק"ט: ${product.sku}</p>
                    <button class="order-button" onclick="addToCart('${product.sku}')">הוסף לעגלה</button>
                </div>
            </div>
        `;
    }).join('');
    // מאזיני גלריה
    document.querySelectorAll('.product-gallery').forEach(gallery => {
        const thumbnails = gallery.querySelectorAll('.gallery-thumbnails .product-type-image');
        const mainImage = gallery.querySelector('.gallery-main img');
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                thumbnails.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
                mainImage.src = thumb.querySelector('img').src;
                mainImage.alt = thumb.querySelector('.type-name').textContent;
            });
        });
    });
}

// פונקציה לטעינת קטגוריות מהשרת
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        updateCategoryFilter(categories);
    } catch (error) {
        console.error('שגיאה בטעינת קטגוריות:', error);
    }
}

// עדכון מסנן הקטגוריות
function updateCategoryFilter(categories) {
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = '<option value="all">כל הקטגוריות</option>';
    
    Object.entries(categories).forEach(([code, category]) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
}

// פונקציה לפתיחת טופס הזמנה
function openOrderForm(productId) {
    const orderForm = document.getElementById('orderForm');
    const productIdInput = document.getElementById('productId');
    
    if (orderForm && productIdInput) {
        productIdInput.value = productId;
        orderForm.style.display = 'block';
        orderForm.scrollIntoView({ behavior: 'smooth' });
    }
}

// פונקציה לסגירת טופס הזמנה
function closeOrderForm() {
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.style.display = 'none';
        orderForm.reset();
    }
}

// פונקציה לשליחת הזמנה
async function submitOrder(event) {
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

    try {
        // שליחת ההזמנה לשרת
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(order)
        });

        if (!response.ok) {
            throw new Error('שגיאה בשליחת ההזמנה');
        }

        // שמירת ההזמנה בלוקל סטורג'
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // ניקוי העגלה
        clearCart();
        
        // הצגת הודעת הצלחה
        showMessage('ההזמנה נשלחה בהצלחה!', 'success');
        
        // איפוס הטופס
        event.target.reset();

    } catch (error) {
        console.error('שגיאה בשליחת ההזמנה:', error);
        showMessage('אירעה שגיאה בשליחת ההזמנה. אנא נסה שוב.', 'error');
    }
}

// פונקציה להצגת הודעות
function showMessage(message, type) {
    // אם זו הודעת החלפת שיר
    if (type === 'track') {
        const existingMessage = document.querySelector('.track-message');
        if (existingMessage) {
            existingMessage.remove();
        }

    const messageDiv = document.createElement('div');
        messageDiv.className = 'track-message';
        messageDiv.innerHTML = `
            <i class="fas fa-music"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(messageDiv);

        // הפעלת האנימציה
        setTimeout(() => messageDiv.classList.add('show'), 10);

        // הסרת ההודעה אחרי 3 שניות
        setTimeout(() => {
            messageDiv.classList.remove('show');
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
        return;
    }

    // הודעות רגילות (שגיאה, הצלחה וכו')
    const messageDiv = document.getElementById('messageDiv');
    if (!messageDiv) return;

    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
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
    loadProducts();
    loadCategories();
    updateCartCount();
    initializeMusicPlayer();

    // הוספת מאזיני אירועים
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const showFavorites = document.getElementById('showFavorites');
    const showSale = document.getElementById('showSale');
    const cartTab = document.getElementById('cartTab');
    const orderForm = document.getElementById('orderForm');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }
    
    if (showFavorites) {
        showFavorites.addEventListener('change', filterProducts);
    }
    
    if (showSale) {
        showSale.addEventListener('change', filterProducts);
    }
    
    if (cartTab) {
        cartTab.addEventListener('click', (e) => {
            e.preventDefault();
            showCart();
        });
    }
    
    if (orderForm) {
        orderForm.addEventListener('submit', submitOrder);
    }

    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

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
});

// אתחול EmailJS
emailjs.init("YOUR_PUBLIC_KEY"); // יש להחליף במפתח הציבורי שלך מ-EmailJS

// שליחת טופס יצירת קשר
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const templateParams = {
        from_name: document.getElementById('contactName').value,
        from_email: document.getElementById('contactEmail').value,
        phone: document.getElementById('contactPhone').value,
        message: document.getElementById('contactMessage').value
    };

    try {
        await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);
        showMessage('ההודעה נשלחה בהצלחה!', 'success');
        contactForm.reset();
    } catch (error) {
        showMessage('אירעה שגיאה בשליחת ההודעה. אנא נסה שוב.', 'error');
        console.error('Error:', error);
    }
});

// קבלת שם הקטגוריה
function getCategoryName(categoryCode) {
    const categories = {
        'home': 'עיצוב הבית',
        'office': 'ציוד משרדי',
        'sports': 'ציוד ספורט',
        'tents': 'אוהלים',
        'beauty': 'מוצרי טיפוח',
        'cooking': 'ציוד בישול'
    };
    
    return categories[categoryCode] || categoryCode;
}

// פונקציה להוספה/הסרה ממועדפים
function toggleFavorite(sku) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const button = document.querySelector(`.favorite-button[onclick="toggleFavorite('${sku}')"]`);
    const productCard = document.querySelector(`.product-card[data-sku="${sku}"]`);
    
    if (favorites.includes(sku)) {
        // הסרת המוצר ממועדפים
        favorites = favorites.filter(id => id !== sku);
        button.classList.remove('active');
        button.title = 'הוסף למועדפים';
    } else {
        // הוספת המוצר למועדפים
        favorites.push(sku);
        button.classList.add('active');
        button.title = 'הסר ממועדפים';
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // אם מופעל סינון מועדפים, עדכן את התצוגה
    if (document.getElementById('showFavorites').checked) {
        filterProducts();
    }

    // הצגת הודעת אישור
    const message = favorites.includes(sku) ? 'המוצר נוסף למועדפים' : 'המוצר הוסר ממועדפים';
    showMessage(message, 'success');
}

// פונקציה להוספת מוצר לעגלה
function addToCart(sku) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.sku === sku);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        // מצא את המוצר המלא מרשימת המוצרים המוצגת
        const productElement = document.querySelector(`.product-card[data-sku="${sku}"]`);
        if (productElement) {
            const name = productElement.querySelector('.product-name').textContent;
            const image = productElement.querySelector('.product-image') ? productElement.querySelector('.product-image').src : null;
            // ייתכן שיהיו פרטים נוספים שנרצה לשמור, כמו מחיר ותיאור
            // כרגע נשמור רק שם, מק"ט וכמות, כמו שהיה קודם, בתוספת תמונה
            cart.push({ sku, name, image, quantity: 1 });
        } else {
            console.error('Product element not found for SKU:', sku);
            // במקרה שלא מצאנו את אלמנט המוצר בדף, נשמור רק SKU וכמות (כמו שהיה)
            // אופציה אחרת היא לנסות לטעון את פרטי המוצר מהשרת כאן
            cart.push({ sku, quantity: 1 });
        }
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showMessage('המוצר נוסף לעגלה', 'success');
}

// פונקציה לעדכון מספר המוצרים בעגלה
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelector('.cart-count').textContent = totalItems;
}

// פונקציה להצגת עגלת הקניות
function showCart() {
    const productsList = document.getElementById('productsList');
    const cartSection = document.getElementById('cartSection');
    const cartItems = document.getElementById('cartItems');
    
    // הסתרת רשימת המוצרים והצגת העגלה
    productsList.style.display = 'none';
    cartSection.style.display = 'block';
    
    // טעינת פריטי העגלה
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">העגלה ריקה</p>';
        return;
    }
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image-container">
                <img src="/uploads/${item.image}" 
                     alt="${item.name}" 
                     class="cart-item-image" 
                     onerror="this.onerror=null; this.src='placeholder.jpg';">
            </div>
            <div class="cart-item-details">
                <h3 class="cart-item-name">${item.name}</h3>
                <p class="cart-item-sku">מק"ט: ${item.sku}</p>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="updateQuantity('${item.sku}', ${item.quantity - 1})">-</button>
                <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                    onchange="updateQuantity('${item.sku}', this.value)">
                <button class="quantity-btn" onclick="updateQuantity('${item.sku}', ${item.quantity + 1})">+</button>
            </div>
            <button class="remove-item" onclick="removeFromCart('${item.sku}')">×</button>
        `;
        cartItems.appendChild(cartItem);
    });
}

// פונקציה לעדכון כמות מוצר בעגלה
function updateQuantity(sku, newQuantity) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemIndex = cart.findIndex(item => item.sku === sku);
    
    if (itemIndex !== -1) {
        if (newQuantity < 1) {
            cart.splice(itemIndex, 1);
        } else {
            cart[itemIndex].quantity = parseInt(newQuantity);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showCart();
    }
}

// פונקציה להסרת מוצר מהעגלה
function removeFromCart(sku) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.sku !== sku);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showCart();
}

// פונקציה לניקוי העגלה
function clearCart() {
    localStorage.removeItem('cart');
    updateCartCount();
    showCart();
}

// Constants
const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
    document.addEventListener('DOMContentLoaded', function() {
    // Navigation elements
        const hamburger = document.querySelector('.hamburger');
        const navLinks = document.querySelector('.nav-links');
        const mainNav = document.getElementById('mainNav');

    // Music player elements
        const musicToggle = document.getElementById('musicToggle');
        const backgroundMusic = document.getElementById('backgroundMusic');
        const musicIcon = musicToggle.querySelector('i');

    // State variables
    let isMusicPlaying = false;
        let currentTrackIndex = 0;
        const tracks = [
        '/music/חנן בן ארי - בשורות טובות.mp3',
            '/music/בלדה לגמל.mp3',
        '/music/גלי עטרי - דרך ארוכה.mp3',
            '/music/כמעט כבר נוגע - יהודה פוליקר.mp3',
            '/music/אפרים ואסתר שמיר - ערב של יום בהיר.mp3',
        '/music/אריק סיני - דרך הכורכר.mp3'
        ];

    // Music Player Functions
        function updateMusicIcon() {
        musicIcon.className = isMusicPlaying ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    }

    function playNextTrack() {
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        const audio = document.getElementById('backgroundMusic');
        audio.src = tracks[currentTrackIndex];
        
            if (isMusicPlaying) {
            audio.play().catch(error => {
                console.error('שגיאה בהשמעת השיר:', error);
                showMessage('לא ניתן להפעיל את המוזיקה', 'error');
            });
        }
        
        // שמירת האינדקס הנוכחי
        localStorage.setItem('currentTrackIndex', currentTrackIndex);
        
        // הצגת הודעת החלפת שיר
        const trackName = tracks[currentTrackIndex].split('/').pop().replace('.mp3', '');
        showMessage(`מנגן: ${trackName}`, 'track');
            }

    function initializeMusicPlayer() {
        // Load saved state
        const savedTrackIndex = localStorage.getItem('currentTrackIndex');
        const savedMusicState = localStorage.getItem('musicPlaying');
        const savedTime = localStorage.getItem('currentTime');

        if (savedTrackIndex) {
            currentTrackIndex = parseInt(savedTrackIndex);
            backgroundMusic.src = tracks[currentTrackIndex];
        }

        if (savedTime) {
            backgroundMusic.currentTime = parseFloat(savedTime);
        }

        if (savedMusicState !== null) {
            isMusicPlaying = savedMusicState === 'true';
        }

        // Initial music state
        updateMusicIcon();
        if (isMusicPlaying) {
        const playPromise = backgroundMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                    console.log('Cannot autoplay music:', error);
                isMusicPlaying = false;
                    updateMusicIcon();
            });
            }
        }

        // Next track handling
        backgroundMusic.addEventListener('ended', playNextTrack);

        // Toggle music
        musicToggle.addEventListener('click', function() {
            if (isMusicPlaying) {
                backgroundMusic.pause();
                isMusicPlaying = false;
            } else {
                backgroundMusic.play().catch(error => {
                    console.log('אין אפשרות להפעיל את המוזיקה:', error);
                });
                isMusicPlaying = true;
            }
            updateMusicIcon();
            localStorage.setItem('musicPlaying', isMusicPlaying);
        });

        // Next track button
        const nextTrackButton = document.getElementById('nextTrack');
        nextTrackButton.addEventListener('click', function() {
            // אם המוזיקה לא מנגנת, נפעיל אותה
            if (!isMusicPlaying) {
                isMusicPlaying = true;
                updateMusicIcon();
                localStorage.setItem('musicPlaying', true);
            }
            playNextTrack();
        });

        // Save state before leaving
        window.addEventListener('beforeunload', function() {
            localStorage.setItem('musicPlaying', isMusicPlaying);
            localStorage.setItem('currentTrackIndex', currentTrackIndex);
            localStorage.setItem('currentTime', backgroundMusic.currentTime);
        });
    }

    // Initialize all functionality
    function initialize() {
        initializeMusicPlayer();
    }

    // Start initialization
    initialize();
    });