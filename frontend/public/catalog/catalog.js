// אלמנטים
const productsList = document.getElementById('productsList');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const orderForm = document.getElementById('orderForm');
const orderFormElement = document.getElementById('orderFormElement');

// Constants for music player
const TRACKS = [
    '/music/חנן בן ארי - בשורות טובות.mp3',
    '/music/בלדה לגמל.mp3',
    '/music/גלי עטרי - דרך ארוכה.mp3',
    '/music/כמעט כבר נוגע - יהודה פוליקר.mp3',
    '/music/אפרים ואסתר שמיר - ערב של יום בהיר.mp3',
    '/music/אריק סיני - דרך הכורכר.mp3'
];

let isMusicPlaying = false;
let currentTrackIndex = 0;

// Music Player Functions
function updateMusicIcon() {
    const musicIcon = document.querySelector('#musicToggle i');
    if (musicIcon) {
        musicIcon.className = isMusicPlaying ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    }
}

function playNextTrack() {
    const audio = document.getElementById('backgroundMusic');
    if (!audio) return;

    currentTrackIndex = (currentTrackIndex + 1) % TRACKS.length;
    audio.src = TRACKS[currentTrackIndex];
    
    if (isMusicPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('שגיאה בהשמעת השיר:', error);
                showMessage('לא ניתן להפעיל את המוזיקה', 'error');
                isMusicPlaying = false;
                updateMusicIcon();
            });
        }
    }
    
    localStorage.setItem('currentTrackIndex', currentTrackIndex);
    
    const trackName = TRACKS[currentTrackIndex].split('/').pop().replace('.mp3', '');
    showMessage(`מנגן: ${trackName}`, 'track');
}

function initializeMusicPlayer() {
    const audio = document.getElementById('backgroundMusic');
    const musicToggle = document.getElementById('musicToggle');
    const nextTrackButton = document.getElementById('nextTrack');
    
    if (!audio || !musicToggle || !nextTrackButton) {
        console.error('חסרים אלמנטים נדרשים לנגן המוזיקה');
        return;
    }

    // Load saved state
    const savedTrackIndex = localStorage.getItem('currentTrackIndex');
    const savedMusicState = localStorage.getItem('musicPlaying');
    const savedTime = localStorage.getItem('currentTime');

    if (savedTrackIndex !== null) {
        currentTrackIndex = parseInt(savedTrackIndex);
        audio.src = TRACKS[currentTrackIndex];
    }

    if (savedTime) {
        audio.currentTime = parseFloat(savedTime);
    }

    if (savedMusicState !== null) {
        isMusicPlaying = savedMusicState === 'true';
    }

    // Initial music state
    updateMusicIcon();

    // Event Listeners
    audio.addEventListener('ended', playNextTrack);
    
    audio.addEventListener('error', (e) => {
        console.error('שגיאה בטעינת השיר:', e);
        showMessage('שגיאה בטעינת השיר', 'error');
        isMusicPlaying = false;
        updateMusicIcon();
    });

    musicToggle.addEventListener('click', () => {
        if (isMusicPlaying) {
            audio.pause();
            isMusicPlaying = false;
        } else {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    isMusicPlaying = true;
                    updateMusicIcon();
                    localStorage.setItem('musicPlaying', true);
                }).catch(error => {
                    console.error('לא ניתן להפעיל את המוזיקה:', error);
                    showMessage('לא ניתן להפעיל את המוזיקה', 'error');
                });
            }
        }
    });

    nextTrackButton.addEventListener('click', () => {
        if (!isMusicPlaying) {
            isMusicPlaying = true;
            updateMusicIcon();
            localStorage.setItem('musicPlaying', true);
        }
        playNextTrack();
    });

    // Save state before leaving
    window.addEventListener('beforeunload', () => {
        localStorage.setItem('musicPlaying', isMusicPlaying);
        localStorage.setItem('currentTrackIndex', currentTrackIndex);
        localStorage.setItem('currentTime', audio.currentTime);
    });

    // Try to play if music was playing
    if (isMusicPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('Cannot autoplay music:', error);
                isMusicPlaying = false;
                updateMusicIcon();
            });
        }
    }
}

// אתחול כל הפונקציונליות
document.addEventListener('DOMContentLoaded', function() {
    // מאזין לחיפוש
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
    
    // מאזין לסינון קטגוריה
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }
    
    // מאזין לסינון מועדפים
    const showFavorites = document.getElementById('showFavorites');
    if (showFavorites) {
        showFavorites.addEventListener('change', filterProducts);
    }
    
    // מאזין לסינון מבצעים
    const showSale = document.getElementById('showSale');
    if (showSale) {
        showSale.addEventListener('change', filterProducts);
    }
    
    // מאזין לעגלת קניות
    const cartTab = document.getElementById('cartTab');
    if (cartTab) {
        cartTab.addEventListener('click', (e) => {
            e.preventDefault();
            showCart();
        });
    }
    
    // מאזין לטופס הזמנה
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', submitOrder);
    }

    // טיפול בתפריט המבורגר
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
    
    // טעינת מוצרים וקטגוריות
    loadCategories().then(() => {
        loadProducts();
    });
    
    // אתחול פונקציות נוספות
    updateCartCount();
    initializeMusicPlayer();
});

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

// פונקציה לסינון מוצרים - מתוקנת
function filterProducts() {
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    const selectedCategory = document.getElementById('categoryFilter')?.value || 'all';
    const showFavorites = document.getElementById('showFavorites')?.checked || false;
    const showSale = document.getElementById('showSale')?.checked || false;
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        // קבלת הנתונים מה-data attributes
        const sku = card.getAttribute('data-sku') || '';
        const category = card.getAttribute('data-category') || '';
        const isOnSale = card.getAttribute('data-sale') === 'true';
        
        // קבלת טקסט מהאלמנטים
        const name = card.querySelector('h3')?.textContent?.toLowerCase() || 
                    card.querySelector('.product-name')?.textContent?.toLowerCase() || '';
        const description = card.querySelector('p')?.textContent?.toLowerCase() || 
                           card.querySelector('.product-description')?.textContent?.toLowerCase() || '';
        const categoryText = card.querySelector('.category')?.textContent?.toLowerCase() || 
                            card.querySelector('.product-category')?.textContent?.toLowerCase() || '';
        const skuText = card.querySelector('.sku')?.textContent?.toLowerCase() || '';

        // בדיקת חיפוש
        const matchesSearch = !searchTerm || 
            name.includes(searchTerm) ||
            description.includes(searchTerm) ||
            categoryText.includes(searchTerm) ||
            skuText.includes(searchTerm) ||
            sku.toLowerCase().includes(searchTerm);

        // בדיקת קטגוריה
        const matchesCategory = selectedCategory === 'all' || category === selectedCategory;

        // בדיקת מועדפים
        const matchesFavorites = !showFavorites || favorites.includes(sku);

        // בדיקת מבצעים
        const matchesSale = !showSale || isOnSale;

        // הצגה/הסתרה
        const shouldShow = matchesSearch && matchesCategory && matchesFavorites && matchesSale;
        card.style.display = shouldShow ? '' : 'none';
    });
}

// פונקציה להמרת קוד קטגוריה לשם תצוגה
function getCategoryDisplayName(categoryCode) {
    const categories = JSON.parse(localStorage.getItem('categories')) || [];
    if (Array.isArray(categories)) {
        const category = categories.find(cat => cat.code === categoryCode);
        return category ? category.name : categoryCode;
    }
    if (typeof categories === 'object') {
        const category = categories[categoryCode];
        return category ? category.name : categoryCode;
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
    }
    return displayName;
}


// פונקציה לטעינת מוצרים מהשרת
async function loadProducts() {
    try {
        console.log('Loading products from server...');
        const response = await fetch('/api/products');
        if (response.ok) {
            const serverProducts = await response.json();
            console.log('Server products:', serverProducts);
            if (serverProducts && serverProducts.length > 0) {
                console.log('Displaying server products');
                displayProducts(serverProducts);
                return;
            }
        }
    } catch (error) {
        console.error('Error fetching products:', error);
    }
    // fallback: נסה לטעון מה-localStorage
    console.log('Falling back to localStorage products');
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
        // קביעת נתיב תמונה נכון
let imagePath = '';
        if (product.image) {
    // אם זה URL מלא (http או https) - אל תשנה אותו
    if (/^https?:\/\//.test(product.image)) {
        imagePath = product.image;
    } 
    // אם כבר מתחיל בנתיב המקומי הנכון - השאר ככה
    else if (product.image.startsWith('/uploads/products/')) {
        imagePath = product.image;
    } 
    // אם זה נתיב יחסי - הוסף לו את הנתיב הבסיסי
    else {
        imagePath = '/uploads/products/' + product.image.replace(/^\/uploads\//, '');
    }
  }

        // --- תמיכה בגלריה עבור מערך תמונות ---
        if (Array.isArray(product.images) && product.images.length > 1) {
            // גלריה עבור מערך תמונות רגיל
            const images = product.images.map((img, idx) => {
                let imgPath = img.startsWith('http')? img : img.startsWith('/uploads/products/')   ? img   : '/uploads/products/' + img.replace(/^\/uploads\//, '');
                return `
                    <div class="product-image-thumb${idx === 0 ? ' active' : ''}" data-img-idx="${idx}">
                        <img src="${imgPath}" alt="${product.name} ${idx + 1}" class="product-image">
                    </div>
                `;
            }).join('');
            let firstImgPath = product.images[0].startsWith('/uploads/products/') ? product.images[0] : '/uploads/products/' + product.images[0].replace(/^\/uploads\//, '');
            imageGallery = `
                <div class="product-gallery">
                    <div class="gallery-main">
                        <img src="${firstImgPath}" alt="${product.name}" class="product-image">
                    </div>
                    <div class="gallery-thumbnails">
                        ${images}
                    </div>
                </div>
            `;
        } else if (product.hasMultipleTypes && product.productTypes && product.productTypes.length > 0) {
            const defaultType = product.productTypes.find(type => type.isDefault) || product.productTypes[0];
            const images = product.productTypes.map(type => {
                let typeImagePath = '';
                if (type.image) {
                    typeImagePath = type.image.startsWith('/uploads/products/') ? type.image : '/uploads/products/' + type.image.replace(/^\/uploads\//, '');
                }
                return `
                <div class="product-type-image ${type.isDefault ? 'active' : ''}" data-type-id="${type._id}">
                        <img src="${typeImagePath}" alt="${type.name}" class="product-image">
                    <span class="type-name">${type.name}</span>
                </div>
                `;
            }).join('');
            let defaultTypeImagePath = '';
            if (defaultType.image) {
                defaultTypeImagePath = defaultType.image.startsWith('/uploads/products/') ? defaultType.image : '/uploads/products/' + defaultType.image.replace(/^\/uploads\//, '');
            }
            imageGallery = `
                <div class="product-gallery">
                    <div class="gallery-main">
                        <img src="${defaultTypeImagePath}" alt="${product.name}" class="product-image">
                    </div>
                    <div class="gallery-thumbnails">
                        ${images}
                    </div>
                </div>
            `;
        } else {
            imageGallery = product.image ? 
                `<img src="${imagePath}" alt="${product.name}" class="product-image">` : 
                '<div class="no-image">אין תמונה</div>';
        }
        return `
            <div class="product-card" data-sku="${product.sku}" data-category="${product.category}" data-sale="${product.onSale || false}" data-product='${JSON.stringify(product).replace(/'/g, "&#39;")}' >
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
                    <div class="cart-buttons-group">
                    <button class="order-button" onclick="addToCart('${product.sku}')">הוסף לעגלה</button>
                        <button class="remove-cart-button" onclick="removeFromCartBySku('${product.sku}')">הסר מהעגלה</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    // מאזיני גלריה
    document.querySelectorAll('.product-gallery').forEach(gallery => {
        // עבור productTypes (קיים)
        const thumbnailsTypes = gallery.querySelectorAll('.gallery-thumbnails .product-type-image');
        const mainImage = gallery.querySelector('.gallery-main img');
        thumbnailsTypes.forEach(thumb => {
            thumb.addEventListener('click', () => {
                thumbnailsTypes.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
                mainImage.src = thumb.querySelector('img').src;
                mainImage.alt = thumb.querySelector('.type-name').textContent;
            });
        });
        // עבור מערך תמונות רגיל
        const thumbnailsImages = gallery.querySelectorAll('.gallery-thumbnails .product-image-thumb');
        thumbnailsImages.forEach(thumb => {
            thumb.addEventListener('click', () => {
                thumbnailsImages.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
                mainImage.src = thumb.querySelector('img').src;
                mainImage.alt = thumb.querySelector('img').alt;
            });
        });
    });
    // מאזין לפתיחת פופאפ תמונה בלחיצה על כרטיס מוצר
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // לא להפעיל אם לוחצים על כפתור/אייקון
            if (e.target.closest('button') || e.target.closest('.favorite-button')) return;
            const product = JSON.parse(this.getAttribute('data-product').replace(/&#39;/g, "'"));
            openProductModal(product);
        });
    });
}

// --- פופאפ מוצר ---
function openProductModal(product) {
    document.getElementById('productModal')?.remove();
    let modalHtml = `<div id="productModal" class="product-modal-overlay">
        <div class="product-modal">
            <button class="close-modal">×</button>`;
    if (product.hasMultipleTypes && product.productTypes && product.productTypes.length > 0) {
        // דפדוף בין סוגי מוצר עם חצים
        const defaultIdx = product.productTypes.findIndex(type => type.isDefault) >= 0 ? product.productTypes.findIndex(type => type.isDefault) : 0;
        const types = product.productTypes;
        const getImgPath = t => t.image ? (t.image.startsWith('/uploads/products/') ? t.image : '/uploads/products/' + t.image.replace(/^\/uploads\//, '')) : '';
        modalHtml += `
            <div class="modal-gallery">
                <button class="modal-arrow modal-arrow-right">&#8592;</button>
                <img src="${getImgPath(types[defaultIdx])}" alt="${product.name}" class="modal-main-image" data-idx="${defaultIdx}">
                <button class="modal-arrow modal-arrow-left">&#8594;</button>
                <div class="modal-type-name">${types[defaultIdx].name || ''}</div>
            </div>
        `;
    } else if (Array.isArray(product.images) && product.images.length > 1) {
        // דפדוף בין תמונות רגילות (אם יש)
        let firstImgPath = product.images[0].startsWith('/uploads/products/') ? product.images[0] : '/uploads/products/' + product.images[0].replace(/^\/uploads\//, '');
        modalHtml += `
            <div class="modal-gallery">
                <img src="${firstImgPath}" alt="${product.name}" class="modal-main-image">
            </div>
        `;
    } else {
        let imgPath = product.image ? (product.image.startsWith('/uploads/products/') ? product.image : '/uploads/products/' + product.image.replace(/^\/uploads\//, '')) : '';
        modalHtml += `<div class="modal-gallery">
            <img src="${imgPath}" alt="${product.name}" class="modal-main-image">
        </div>`;
    }
    modalHtml += `<div class="modal-info">
        <h2>${product.name}</h2>
        <p>${product.desc || product.description || ''}</p>
        <span class="product-category">${getCategoryDisplayName(product.category)}</span>
        <p class="product-sku">מק"ט: ${product.sku}</p>
    </div>
    </div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.querySelector('#productModal .close-modal').onclick = closeProductModal;
    document.getElementById('productModal').onclick = function(e) {
        if (e.target === this) closeProductModal();
    };
    // דפדוף בין סוגי מוצר
    if (product.hasMultipleTypes && product.productTypes && product.productTypes.length > 0) {
        const types = product.productTypes;
        let idx = product.productTypes.findIndex(type => type.isDefault) >= 0 ? product.productTypes.findIndex(type => type.isDefault) : 0;
        const mainImg = document.querySelector('#productModal .modal-main-image');
        const typeNameDiv = document.querySelector('#productModal .modal-type-name');
        document.querySelector('#productModal .modal-arrow-left').onclick = function(e) {
            e.stopPropagation();
            idx = (idx + 1) % types.length;
            mainImg.src = types[idx].image ? (types[idx].image.startsWith('/uploads/products/') ? types[idx].image : '/uploads/products/' + types[idx].image.replace(/^\/uploads\//, '')) : '';
            typeNameDiv.textContent = types[idx].name || '';
        };
        document.querySelector('#productModal .modal-arrow-right').onclick = function(e) {
            e.stopPropagation();
            idx = (idx - 1 + types.length) % types.length;
            mainImg.src = types[idx].image ? (types[idx].image.startsWith('/uploads/products/') ? types[idx].image : '/uploads/products/' + types[idx].image.replace(/^\/uploads\//, '')) : '';
            typeNameDiv.textContent = types[idx].name || '';
        };
    }
}
function closeProductModal() {
    document.getElementById('productModal')?.remove();
}

// פונקציה לטעינת קטגוריות מהשרת
async function loadCategories() {
    try {
        console.log('Loading categories from server...');
        const response = await fetch('/api/categories');
        const categories = await response.json();
        console.log('Server categories:', categories);
        
        // שמירת הקטגוריות ב-localStorage
        localStorage.setItem('categories', JSON.stringify(categories));
        
        updateCategoryFilter(categories);
    } catch (error) {
        console.error('שגיאה בטעינת קטגוריות:', error);
        
        // fallback: נסה לטעון מה-localStorage
        console.log('Falling back to localStorage categories');
        const localCategories = JSON.parse(localStorage.getItem('categories')) || {};
        updateCategoryFilter(localCategories);
    }
}

// עדכון מסנן הקטגוריות
function updateCategoryFilter(categories) {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    categoryFilter.innerHTML = '<option value="all">כל הקטגוריות</option>';
    
    // בדיקה אם categories הוא מערך או אובייקט
    if (Array.isArray(categories)) {
        // אם זה מערך (מהשרת)
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.code;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    } else {
        // אם זה אובייקט (מה-localStorage)
    Object.entries(categories).forEach(([code, category]) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
    }
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

// פונקציה חדשה: הסרת מוצר מהעגלה לפי sku
function removeFromCartBySku(sku) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemIndex = cart.findIndex(item => item.sku === sku);
    if (itemIndex === -1) {
        showMessage('המוצר אינו נמצא בעגלה', 'error');
        return;
    }
    if (cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity -= 1;
    } else {
        cart.splice(itemIndex, 1);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showMessage('המוצר הוסר מהעגלה', 'success');
}