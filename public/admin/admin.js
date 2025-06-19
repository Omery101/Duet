// פרטי התחברות
// משתנים גלובליים
let productTypes = [];
let categories = [];
let currentProduct = null;
let currentImage = null;

// הוספת מאזיני אירועים
document.addEventListener('DOMContentLoaded', function() {
    // טופס התחברות
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            await login(username, password);
        });
    }

    // כפתור התנתקות
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // טופס מוצר
    const productForm = document.getElementById('productFormElement');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveProduct();
        });
    }

    // כפתור טופס מוצר
    const toggleProductFormBtn = document.querySelector('#productForm .toggle-form-btn');
    if (toggleProductFormBtn) {
        toggleProductFormBtn.addEventListener('click', toggleProductForm);
    }

    // טיפול בתמונת מוצר
    const productImage = document.getElementById('productImage');
    if (productImage) {
        productImage.addEventListener('change', function(e) {
            previewImage(this);
        });
    }

    // כפתור הסרת תמונה
    const removeImageBtn = document.querySelector('.remove-image-btn');
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', removeImage);
    }

    // טיפול בסוגי מוצר
    const hasMultipleTypes = document.getElementById('hasMultipleTypes');
    if (hasMultipleTypes) {
        hasMultipleTypes.addEventListener('change', toggleProductTypes);
    }

    // כפתור הוספת סוג מוצר
    const addTypeBtn = document.querySelector('.add-type-btn');
    if (addTypeBtn) {
        addTypeBtn.addEventListener('click', addProductType);
    }

    // טופס קטגוריה
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addCategory();
        });
    }

    // כפתור טופס קטגוריה
    const toggleCategoryFormBtn = document.querySelector('.category-management .toggle-form-btn');
    if (toggleCategoryFormBtn) {
        toggleCategoryFormBtn.addEventListener('click', toggleCategoryForm);
    }

    // טיפול בתפריט המבורגר
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // סגירת התפריט בלחיצה על קישור
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // סגירת התפריט בלחיצה מחוץ לתפריט
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }

    // טעינת נתונים ראשונית
    const token = localStorage.getItem('adminToken');
    if (token) {
        checkInitialAuth();
    }

    // פונקציה לטיפול בניווט בין הלשוניות
    handleNavigation();
});

// פונקציה לבדיקת אימות ראשונית
async function checkInitialAuth() {
    try {
        const response = await fetch('/api/admin/verify', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (response.ok) {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            document.querySelector('.floating-logout').style.display = 'flex';
            
            // טעינת קטגוריות ומוצרים
            await loadCategories();
            await loadProducts();
        } else {
            logout();
        }
    } catch (error) {
        console.error('שגיאה בבדיקת הטוקן:', error);
        logout();
    }
}

async function checkLogin(username, password) {
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'שגיאת התחברות');
        }
        
        if (data.success) {
            localStorage.setItem('adminToken', data.token);
            return true;
        }
        return false;
    } catch (error) {
        console.error('שגיאה בהתחברות:', error);
        throw error;
    }
}

// מבנה קטגוריות
// let categories = []; // הסרת הגדרה כפולה

// שמירת קטגוריות
function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories));
}

// הוספת קטגוריה חדשה
async function addCategory() {
    const categoryName = document.getElementById('newCategoryName').value.trim();
    const categoryCode = document.getElementById('newCategoryCode').value.trim().toLowerCase();
    const editId = document.getElementById('newCategoryCode').dataset.editId;
    
    if (!categoryName || !categoryCode) {
        showMessage('יש למלא את כל השדות!', 'error');
        return;
    }
    
    try {
        // בדיקה אם הקוד כבר קיים
        const existingCategoriesStr = localStorage.getItem('categories');
        console.log('Raw categories from localStorage:', existingCategoriesStr);
        
        let existingCategories = [];
        try {
            existingCategories = existingCategoriesStr ? JSON.parse(existingCategoriesStr) : [];
            console.log('Parsed categories:', existingCategories);
        } catch (parseError) {
            console.error('Error parsing categories:', parseError);
            localStorage.removeItem('categories');
            existingCategories = [];
        }
        
        // וידוא שיש לנו מערך
        if (!Array.isArray(existingCategories)) {
            console.error('Categories is not an array:', existingCategories);
            existingCategories = [];
        }
        
        const codeExists = existingCategories.some(cat => cat.code === categoryCode && cat._id !== editId);
        
        if (codeExists) {
            showMessage('קוד קטגוריה זה כבר קיים במערכת!', 'error');
            return;
        }
        
        const url = editId ? `/api/categories/${editId}` : '/api/categories';
        const method = editId ? 'PUT' : 'POST';
        
        console.log('Sending request to:', url, 'with method:', method);
        const response = await fetchWithAuth(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: categoryName,
                code: categoryCode
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'שגיאה בשמירת הקטגוריה');
        }

        const result = await response.json();
        console.log('Category saved successfully:', result);
        
        // הצגת הודעת הצלחה
        const successMessage = editId ? 
            `הקטגוריה "${categoryName}" עודכנה בהצלחה` : 
            `הקטגוריה "${categoryName}" נוספה בהצלחה`;
        showMessage(successMessage, 'success');
        
        // ניקוי הטופס
        document.getElementById('newCategoryName').value = '';
        document.getElementById('newCategoryCode').value = '';
        delete document.getElementById('newCategoryCode').dataset.editId;
        
        // עדכון רשימת הקטגוריות
        await loadCategories();
        
        // סגירת חלון ניהול הקטגוריות
        toggleCategoryForm();
        
        // איפוס כותרת הכפתור
        const saveButton = document.querySelector('.category-form .save-btn');
        if (saveButton) {
        saveButton.textContent = 'שמור קטגוריה';
        }
        
    } catch (error) {
        console.error('שגיאה בשמירת הקטגוריה:', error);
        showMessage(error.message, 'error');
    }
}

// עדכון רשימות הקטגוריות
async function updateCategorySelects(categories = null) {
    try {
        // אם לא התקבלו קטגוריות, נטען אותן מהשרת
        if (!categories) {
            const response = await fetchWithAuth('/api/categories');
            if (!response.ok) {
                throw new Error('שגיאה בטעינת קטגוריות');
            }
            categories = await response.json();
        }

        // עדכון רשימת הקטגוריות בטופס מוצר
        const productCategorySelect = document.getElementById('productCategory');
        if (productCategorySelect) {
            productCategorySelect.innerHTML = '<option value="">בחר קטגוריה</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.code;
                option.textContent = category.name;
                productCategorySelect.appendChild(option);
            });
        }

        // עדכון רשימת הקטגוריות בקטלוג
        const catalogCategoryFilter = document.querySelector('#categoryFilter');
        if (catalogCategoryFilter) {
            catalogCategoryFilter.innerHTML = '<option value="all">כל הקטגוריות</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.code;
                option.textContent = category.name;
                catalogCategoryFilter.appendChild(option);
            });
        }

        return categories;
    } catch (error) {
        console.error('שגיאה בעדכון רשימות הקטגוריות:', error);
        showMessage(error.message, 'error');
        return [];
    }
}

function getCategoryName(categoryCode) {
    if (!categoryCode) return 'ללא קטגוריה';
    
    const categoriesStr = localStorage.getItem('categories');
    if (!categoriesStr) return categoryCode;
    
    try {
        const categories = JSON.parse(categoriesStr);
        // הקטגוריות נשמרות כמערך
        const category = Array.isArray(categories) ? 
            categories.find(cat => cat && cat.code === categoryCode) :
            null;
            
        return category ? category.name : categoryCode;
    } catch (error) {
        console.error('שגיאה בפענוח קטגוריות:', error);
        return categoryCode;
    }
}

// אלמנטים
const loginForm = document.getElementById('loginForm');
const adminPanel = document.getElementById('adminPanel');
const productForm = document.getElementById('productForm');
const productsTable = document.getElementById('productsTable');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const logoutBtn = document.getElementById('logoutBtn');

// הצגת תמונה מקדימה
function previewImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
            imagePreview.querySelector('.no-image').style.display = 'none';
            currentImage = file;
        };
        reader.readAsDataURL(file);
    }
}

// הסרת תמונה
function removeImage() {
    previewImg.src = '';
    previewImg.style.display = 'none';
    imagePreview.querySelector('.no-image').style.display = 'block';
    document.getElementById('productImage').value = '';
    currentImage = null;
}

// פונקציית התחברות
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'שגיאת התחברות');
        }

        if (data.token) {
            localStorage.setItem('adminToken', data.token);
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            document.querySelector('.floating-logout').style.display = 'flex';
            
            // טעינת קטגוריות ומוצרים
            console.log('Loading categories and products after login...'); // Debug log
            await loadCategories();
            await loadProducts();
            
            showMessage('התחברת בהצלחה', 'success');
        } else {
            throw new Error('לא התקבל טוקן מהשרת');
        }
    } catch (error) {
        console.error('שגיאה בהתחברות:', error);
        showMessage(error.message, 'error');
    }
}

// פונקציית התנתקות
function logout() {
    localStorage.removeItem('adminToken');
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    document.querySelector('.floating-logout').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showMessage('התנתקת בהצלחה', 'success');
}

// הצגת טופס הוספת מוצר
function showAddProductForm() {
    productForm.style.display = 'block';
    currentProduct = null;
    document.getElementById('productName').value = '';
    document.getElementById('productDesc').value = '';
    document.getElementById('productCategory').value = '';
    document.getElementById('productSku').value = '';
    removeImage();
}

// פונקציה לשליחת בקשות מאומתות
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        showMessage('לא מחובר למערכת', 'error');
        throw new Error('לא מחובר למערכת');
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {})
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
    
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            showMessage('הסשן פג תוקף, יש להתחבר מחדש', 'error');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            throw new Error('הסשן פג תוקף');
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'שגיאה בבקשה');
        }

        return response;
    } catch (error) {
        console.error('שגיאה בבקשה:', error);
        showMessage(error.message, 'error');
        throw error;
    }
}

// טעינת מוצרים
async function loadProducts() {
    try {
        // קודם נטען את הקטגוריות
        const categories = await loadCategories();
        if (!categories || categories.length === 0) {
            console.warn('לא נמצאו קטגוריות');
        }

        const response = await fetchWithAuth('/api/products');
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'שגיאה בטעינת מוצרים');
        }
        
        const products = await response.json();
        const tbody = productsTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        if (!products || products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">אין מוצרים להצגה</td></tr>';
            return;
        }
        
        products.forEach((product) => {
            if (!product) return;
            
            const categoryName = getCategoryName(product.category);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name || ''}</td>
                <td>${product.desc || ''}</td>
                <td>${categoryName}</td>
                <td>${product.sku || ''}</td>
                <td>
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name || ''}" style="max-width: 50px; height: auto;">` : 
                        'אין תמונה'}
                </td>
                <td>${product.onSale ? 'כן' : 'לא'}</td>
                <td>
                    <button onclick="editProduct('${product.sku}')" class="edit-btn">
                        <i class="fas fa-edit"></i> עריכה
                    </button>
                    <button onclick="confirmDelete('${product.sku}')" class="delete-btn">
                        <i class="fas fa-trash"></i> מחיקה
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('שגיאה בטעינת המוצרים:', error);
        showMessage(error.message || 'שגיאה בטעינת המוצרים', 'error');
    }
}

// פונקצייה לאישור מחיקה
function confirmDelete(id) {
    if (!id) {
        showMessage('מזהה מוצר לא תקין', 'error');
        return;
    }
    
    if (confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) {
        deleteProduct(id);
    }
}

// הצגת הודעות
function showMessage(message, type) {
    // הסר הודעות קודמות
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    // הסר את ההודעה אחרי 3 שניות
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// התחברות מנהל
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    login();
});

// יציאה מהמערכת
document.getElementById('logoutBtn').addEventListener('click', logout);

// אתחול הדף
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded - Initializing...'); // Debug log
    
    const token = localStorage.getItem('adminToken');
    if (token) {
        try {
            console.log('Token found, verifying...'); // Debug log
            
            const response = await fetch('/api/admin/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                console.log('Token verified, showing admin panel...'); // Debug log
                
                // הסתרת טופס התחברות והצגת פאנל הניהול
                const loginForm = document.getElementById('loginForm');
                const adminPanel = document.getElementById('adminPanel');
                const logoutBtn = document.querySelector('.floating-logout');
                
                if (loginForm) loginForm.style.display = 'none';
                if (adminPanel) adminPanel.style.display = 'block';
                if (logoutBtn) logoutBtn.style.display = 'flex';
                
                // טעינת קטגוריות ומוצרים
                console.log('Loading initial data...'); // Debug log
                try {
                    // קודם נטען את הקטגוריות
                    const categories = await loadCategories();
                    console.log('Categories loaded:', categories.length);
                    
                    // רק אחרי שהקטגוריות נטענו, נטען את המוצרים
                await loadProducts();
                    console.log('Initial data loaded successfully');
                } catch (error) {
                    console.error('Error loading initial data:', error);
                    showMessage('שגיאה בטעינת נתונים', 'error');
                }
            } else {
                console.log('Token invalid, logging out...'); // Debug log
                logout();
            }
        } catch (error) {
            console.error('Error verifying token:', error);
            logout();
        }
    } else {
        console.log('No token found, showing login form...'); // Debug log
        const loginForm = document.getElementById('loginForm');
        const adminPanel = document.getElementById('adminPanel');
        const logoutBtn = document.querySelector('.floating-logout');
        
        if (loginForm) loginForm.style.display = 'block';
        if (adminPanel) adminPanel.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
});

// טיפול בהעלאת תמונה
document.getElementById('imageUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('imagePreview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// הסרת תמונה
document.getElementById('removeImage').addEventListener('click', function() {
    document.getElementById('imagePreview').src = '';
    document.getElementById('imageUpload').value = '';
});

// פונקציה להצגת/הסתרת אזור ניהול קטגוריות
function toggleCategoryManagement() {
    const categoryForm = document.querySelector('.category-form');
    const addCategoryBtn = document.querySelector('.add-category-btn');
    
    if (categoryForm.style.display === 'none') {
        categoryForm.style.display = 'block';
        addCategoryBtn.style.display = 'none';
    } else {
        categoryForm.style.display = 'none';
        addCategoryBtn.style.display = 'flex';
    }
}

// הוספת מאזיני אירועים
document.addEventListener('DOMContentLoaded', function() {
    // מאזין לכפתור הוספת קטגוריה
    const addCategoryBtn = document.querySelector('.add-category-btn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', toggleCategoryManagement);
    }

    // מאזין לכפתור סגירת אזור ניהול קטגוריות
    const closeCategoryBtn = document.querySelector('.close-category-btn');
    if (closeCategoryBtn) {
        closeCategoryBtn.addEventListener('click', toggleCategoryManagement);
    }
});

// API Configuration
const API_URL = 'http://localhost:3000/api';

// עריכת מוצר
async function editProduct(id) {
    try {
        // שימוש ב-SKU במקום _id
        const response = await fetchWithAuth(`/api/products/${id}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'שגיאה בטעינת פרטי המוצר');
        }
        
        const product = await response.json();
        if (!product) {
            throw new Error('המוצר לא נמצא');
        }
        
        currentProduct = product;
        
        // עדכון הטופס עם פרטי המוצר
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productDesc').value = product.desc || '';
        
        // עדכון בחירת הקטגוריה
        const categorySelect = document.getElementById('productCategory');
        if (categorySelect) {
            // וידוא שהקטגוריה קיימת ברשימה
            const categoryExists = Array.from(categorySelect.options).some(option => option.value === product.category);
            if (categoryExists) {
                categorySelect.value = product.category;
            } else {
                console.warn('קטגוריה לא נמצאה ברשימה:', product.category);
                categorySelect.value = ''; // איפוס הבחירה אם הקטגוריה לא קיימת
            }
        }
        
        document.getElementById('productSku').value = product.sku || '';
        document.getElementById('productOnSale').checked = product.onSale || false;
        document.getElementById('hasMultipleTypes').checked = product.hasMultipleTypes || false;

        // טיפול בתמונה
        if (product.image) {
            previewImg.src = product.image;
            previewImg.style.display = 'block';
            imagePreview.querySelector('.no-image').style.display = 'none';
            currentImage = null; // מאפס את התמונה הנוכחית כי יש תמונה קיימת
        } else {
            previewImg.src = '';
            previewImg.style.display = 'none';
            imagePreview.querySelector('.no-image').style.display = 'block';
            currentImage = null;
        }

        // טיפול בסוגי מוצר
        if (product.hasMultipleTypes && product.productTypes && product.productTypes.length > 0) {
            productTypes = product.productTypes.map((type, index) => ({
                id: type._id || Date.now().toString() + index,
                name: type.name,
                image: type.image,
                isDefault: type.isDefault
            }));

            // הצגת אזור סוגי המוצר
            document.getElementById('hasMultipleTypes').checked = true;
            toggleProductTypes();

            // ניקוי רשימת הסוגים הקיימת
            const typesList = document.getElementById('productTypesList');
            if (typesList) {
                typesList.innerHTML = '';

                // הוספת כל סוג מוצר
                productTypes.forEach(type => {
                    const typeItem = document.createElement('div');
                    typeItem.className = 'product-type-item';
                    typeItem.id = `type-${type.id}`;
                    
                    typeItem.innerHTML = `
                        <div class="product-type-content">
                            <div class="form-group">
                                <label>שם הסוג</label>
                                <input type="text" class="type-name" value="${type.name}" placeholder="לדוגמה: אדום, כחול, וכו'">
                            </div>
                            <div class="form-group">
                                <label>תמונה</label>
                                <input type="file" class="type-image" accept="image/*" onchange="previewTypeImage(this, '${type.id}')">
                                <div class="image-preview">
                                    ${type.image ? 
                                        `<img class="preview-img" src="/uploads/${type.image}" style="display: block;">` :
                                        `<div class="no-image">אין תמונה</div>`
                                    }
                                </div>
                            </div>
                        </div>
                        <div class="product-type-actions">
                            <button type="button" class="set-default-btn ${type.isDefault ? 'active' : ''}" onclick="setDefaultType('${type.id}')">
                                <i class="fas fa-star"></i> ברירת מחדל
                            </button>
                            <button type="button" class="remove-type-btn" onclick="removeProductType('${type.id}')">
                                <i class="fas fa-trash"></i> הסר
                            </button>
                        </div>
                    `;
                    
                    typesList.appendChild(typeItem);
                });
            }
        } else {
            // איפוס סוגי המוצר אם אין
            productTypes = [];
            document.getElementById('hasMultipleTypes').checked = false;
            toggleProductTypes();
        }

        // הצגת הטופס
        const form = document.querySelector('#productForm form');
        if (form) {
        form.style.display = 'block';
        }
        
        // עדכון כפתור הטופס
        const button = document.querySelector('#productForm .toggle-form-btn');
        if (button) {
        button.classList.add('active');
        button.textContent = 'סגור';
        }
        
        // גלילה לטופס
        productForm.scrollIntoView({ behavior: 'smooth' });
        
        showMessage('טעינת פרטי המוצר הושלמה בהצלחה', 'success');
    } catch (error) {
        console.error('שגיאה בטעינת פרטי המוצר:', error);
        showMessage(error.message || 'שגיאה בטעינת פרטי המוצר', 'error');
    }
}

// עריכת מוצר
async function saveProduct() {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            throw new Error('לא מחובר למערכת');
        }

        // בדיקת שדות חובה
        const name = document.getElementById('productName').value.trim();
        const desc = document.getElementById('productDesc').value.trim();
        const categorySelect = document.getElementById('productCategory');
        const category = categorySelect.value;
        const sku = document.getElementById('productSku').value.trim();
        const hasMultipleTypes = document.getElementById('hasMultipleTypes').checked;

        if (!name || !desc || !category || !sku) {
            showMessage('יש למלא את כל השדות החובה', 'error');
            return;
        }

        if (hasMultipleTypes && productTypes.length === 0) {
            showMessage('יש להוסיף לפחות סוג מוצר אחד', 'error');
            return;
        }

        // בדיקת גודל תמונה
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        if (!hasMultipleTypes && currentImage instanceof File && currentImage.size > MAX_FILE_SIZE) {
            showMessage('גודל התמונה חייב להיות קטן מ-5MB', 'error');
            return;
        }

        if (hasMultipleTypes) {
            for (const type of productTypes) {
                if (type.image instanceof File && type.image.size > MAX_FILE_SIZE) {
                    showMessage(`גודל התמונה של סוג המוצר "${type.name}" חייב להיות קטן מ-5MB`, 'error');
                    return;
                }
            }
        }

        // יצירת אובייקט FormData
        const formData = new FormData();
        formData.append('name', name);
        formData.append('desc', desc);
        formData.append('category', category);
        formData.append('sku', sku);
        formData.append('onSale', document.getElementById('productOnSale').checked);
        formData.append('hasMultipleTypes', hasMultipleTypes);

        // הוספת סוגי המוצר
        if (hasMultipleTypes) {
            // עדכון שמות הסוגים מהטופס
            productTypes.forEach((type, index) => {
                const typeItem = document.getElementById(`type-${type.id}`);
                if (typeItem) {
                    const nameInput = typeItem.querySelector('.type-name');
                    type.name = nameInput.value.trim();
                }
            });

            // בדיקה שכל הסוגים מלאים
            const invalidTypes = productTypes.filter(type => !type.name || !type.image);
            if (invalidTypes.length > 0) {
                showMessage('יש למלא את כל פרטי סוגי המוצר', 'error');
                return;
            }

            formData.append('productTypes', JSON.stringify(productTypes.map(t => ({
                name: t.name,
                isDefault: t.isDefault
            }))));

            // הוספת תמונות הסוגים
            productTypes.forEach((type, index) => {
                if (type.image instanceof File) {
                    formData.append('typeImages', type.image);
                }
            });
        } else if (currentImage instanceof File) {
            formData.append('image', currentImage);
        }

        // קביעת כתובת ה-API ושיטת הבקשה
        let url;
        let method;
        
        if (currentProduct && currentProduct._id) {
            url = `/api/products/${currentProduct._id}`;
            method = 'PUT';
        } else {
            url = '/api/products';
            method = 'POST';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'שגיאה בשמירת המוצר');
        }

        const data = await response.json();
        showMessage(currentProduct ? 'המוצר עודכן בהצלחה!' : 'המוצר נוסף בהצלחה!', 'success');
        await loadProducts();
        
        // ניקוי הטופס
        document.getElementById('productName').value = '';
        document.getElementById('productDesc').value = '';
        document.getElementById('productCategory').value = '';
        document.getElementById('productSku').value = '';
        document.getElementById('productOnSale').checked = false;
        document.getElementById('hasMultipleTypes').checked = false;
        removeImage();
        productTypes = [];
        document.getElementById('productTypesList').innerHTML = '';
        toggleProductTypes();
        
        // סגירת הטופס
        toggleProductForm();
        currentProduct = null;
        
    } catch (error) {
        console.error('שגיאה בשמירת המוצר:', error);
        showMessage(error.message || 'שגיאה בשמירת המוצר', 'error');
    }
}

// מחיקת מוצר
async function deleteProduct(id) {
    if (!id) {
        showMessage('מזהה מוצר לא תקין', 'error');
        return;
    }

    try {
        // קודם נקבל את המוצר לפי ה-SKU כדי לקבל את ה-_id
        const productResponse = await fetchWithAuth(`/api/products/${id}`);
        if (!productResponse.ok) {
            throw new Error('שגיאה בטעינת פרטי המוצר');
        }
        const product = await productResponse.json();
        
        if (!product || !product._id) {
            throw new Error('לא נמצא מזהה מוצר תקין');
        }

        // עכשיו נמחק את המוצר לפי ה-_id
        const response = await fetchWithAuth(`/api/products/${product._id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'שגיאה במחיקת המוצר');
        }
        
        showMessage('המוצר נמחק בהצלחה!', 'success');
        await loadProducts(); // טוען מחדש את רשימת המוצרים
    } catch (error) {
        console.error('שגיאה במחיקת המוצר:', error);
        showMessage(error.message, 'error');
    }
}

// טעינת קטגוריות
async function loadCategories() {
    try {
        console.log('Starting to load categories...'); // Debug log
        
        // בדיקה שהאלמנטים קיימים
        const categoriesList = document.getElementById('categoriesList');
        const productCategorySelect = document.getElementById('productCategory');
        
        if (!categoriesList) {
            console.error('Categories list element not found!');
            return [];
        }
        
        if (!productCategorySelect) {
            console.error('Product category select element not found!');
        }
        
        // טעינת קטגוריות ומוצרים במקביל
        const [categoriesResponse, productsResponse] = await Promise.all([
            fetchWithAuth('/api/categories'),
            fetchWithAuth('/api/products')
        ]);

        if (!categoriesResponse.ok) {
            throw new Error('שגיאה בטעינת קטגוריות');
        }
        
        if (!productsResponse.ok) {
            throw new Error('שגיאה בטעינת מוצרים');
        }
        
        const categoriesObj = await categoriesResponse.json();
        const products = await productsResponse.json();
        
        console.log('Raw categories from server:', categoriesObj); // Debug log
        
        // המרת האובייקט למערך של קטגוריות
        const categories = Object.entries(categoriesObj).map(([code, data]) => {
            // ספירת מוצרים בקטגוריה
            const productCount = products.filter(product => product.category === code).length;
            
            return {
                code,
                name: data.name,
                subcategories: data.subcategories || [],
                productCount
            };
        });
        
        console.log('Processed categories array:', categories); // Debug log
        
        // עדכון תפריט הקטגוריות בטופס מוצר
        if (productCategorySelect) {
            productCategorySelect.innerHTML = '<option value="">בחר קטגוריה</option>';
            
            if (categories && categories.length > 0) {
            categories.forEach(category => {
                    if (category && category.code && category.name) {
                const option = document.createElement('option');
                option.value = category.code;
                option.textContent = category.name;
                productCategorySelect.appendChild(option);
                        console.log('Added category to select:', category.name);
                    }
            });
            }
        }
        
        // עדכון רשימת הקטגוריות בתצוגה המפורטת
        categoriesList.innerHTML = ''; // ניקוי הרשימה
            
        if (!categories || categories.length === 0) {
                categoriesList.innerHTML = '<div class="no-data">אין קטגוריות להצגה</div>';
            console.log('No categories to display');
        } else {
            // יצירת רשת של קטגוריות
            const categoriesGrid = document.createElement('div');
            categoriesGrid.className = 'categories-grid';
            
            categories.forEach(category => {
                if (category && category.code && category.name) {
                const categoryCard = document.createElement('div');
                categoryCard.className = 'category-card';
                categoryCard.innerHTML = `
                    <div class="category-info">
                        <h4>${category.name}</h4>
                        <p>קוד: ${category.code}</p>
                            <p>כמות מוצרים: ${category.productCount}</p>
                            ${category.subcategories && category.subcategories.length > 0 ? 
                                `<p>תתי-קטגוריות: ${category.subcategories.length}</p>` : ''}
                    </div>
                    <div class="category-actions">
                        <button onclick="editCategory('${category.code}')" class="edit-btn">
                            <i class="fas fa-edit"></i> עריכה
                        </button>
                        <button onclick="deleteCategory('${category.code}')" class="delete-btn">
                            <i class="fas fa-trash"></i> מחיקה
                        </button>
                    </div>
                `;
                    categoriesGrid.appendChild(categoryCard);
                    console.log('Added category card:', category.name);
                }
            });
            
            // הוספת הרשת לאלמנט הרשימה
            categoriesList.appendChild(categoriesGrid);
            console.log('Categories grid added to list');
        }
        
        // שמירת הקטגוריות ב-localStorage
        localStorage.setItem('categories', JSON.stringify(categories));
        console.log('Categories saved to localStorage');
        
        return categories;
    } catch (error) {
        console.error('Error in loadCategories:', error);
        showMessage(error.message, 'error');
        return [];
    }
}

// עריכת קטגוריה
async function editCategory(code) {
    try {
        console.log('Fetching category:', code); // Debug log
        
        // בדיקת תקינות הקוד
        if (!code) {
            throw new Error('קוד קטגוריה לא תקין');
        }

        // בדיקת טוקן
        const token = localStorage.getItem('adminToken');
        if (!token) {
            showMessage('לא מחובר למערכת', 'error');
            throw new Error('לא מחובר למערכת');
        }

        const response = await fetchWithAuth(`/api/categories/${code}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        // בדיקת סוג התשובה
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Invalid response type:', contentType);
            throw new Error('השרת החזיר תשובה לא תקינה');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'שגיאה בטעינת הקטגוריה');
        }
        
        const category = await response.json();
        console.log('Category data:', category); // Debug log
        
        if (!category || !category.name || !category.code) {
            throw new Error('נתוני הקטגוריה לא תקינים');
        }
        
        // מילוי הטופס בנתוני הקטגוריה
        const categoryNameInput = document.getElementById('newCategoryName');
        const categoryCodeInput = document.getElementById('newCategoryCode');
        const toggleBtn = document.querySelector('.category-management .toggle-form-btn');
        const categoryForm = document.querySelector('.category-form');
        
        if (!categoryNameInput || !categoryCodeInput || !toggleBtn || !categoryForm) {
            throw new Error('לא נמצאו שדות הטופס');
        }

        // ניקוי הטופס לפני מילוי הנתונים
        categoryNameInput.value = '';
        categoryCodeInput.value = '';
        delete categoryCodeInput.dataset.editId;

        // מילוי הנתונים
        categoryNameInput.value = category.name;
        categoryCodeInput.value = category.code;
        categoryCodeInput.dataset.editId = category.code;
        
        // הצגת הטופס וגלילה אליו
        categoryForm.style.display = 'block';
        toggleBtn.classList.add('active');
        toggleBtn.textContent = 'סגור';
        categoryForm.scrollIntoView({ behavior: 'smooth' });
        
        // עדכון מטפל שליחת הטופס
        const form = document.getElementById('categoryForm');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                await addCategory();
            };
        }
        
        // עדכון טקסט הכפתור
        const saveButton = document.querySelector('.category-form .save-btn');
        if (saveButton) {
        saveButton.textContent = 'עדכן קטגוריה';
        }

        // הצגת הודעת הצלחה
        showMessage(`טעינת פרטי הקטגוריה "${category.name}" הושלמה בהצלחה`, 'success');
        
    } catch (error) {
        console.error('Error editing category:', error);
        showMessage(error.message || 'שגיאה בטעינת הקטגוריה', 'error');
    }
}

// מחיקת קטגוריה
async function deleteCategory(code) {
    if (!code) {
        showMessage('קוד קטגוריה לא תקין', 'error');
        return;
    }

    if (!confirm('האם אתה בטוח שברצונך למחוק קטגוריה זו?')) {
        return;
    }

    try {
        // בדיקה אם יש מוצרים בקטגוריה
        const productsResponse = await fetchWithAuth('/api/products', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!productsResponse.ok) {
            throw new Error('שגיאה בטעינת מוצרים');
        }
        
        const products = await productsResponse.json();
        const productsInCategory = products.filter(product => product.category === code);
        
        if (productsInCategory.length > 0) {
            showMessage(`קיימים ${productsInCategory.length} מוצרים המשוייכים לקטגוריה זו.`, 'error');
            return;
        }

        // מחיקת הקטגוריה
        const response = await fetchWithAuth(`/api/categories/${code}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'שגיאה במחיקת הקטגוריה' }));
            throw new Error(errorData.message || 'שגיאה במחיקת הקטגוריה');
        }

        showMessage('הקטגוריה נמחקה בהצלחה', 'success');
        
        // עדכון רשימת הקטגוריות
        await loadCategories();
        
    } catch (error) {
        console.error('שגיאה במחיקת קטגוריה:', error);
        showMessage(error.message || 'שגיאה במחיקת הקטגוריה', 'error');
        }
}

// החלפת מצב טופס מוצר
async function toggleProductForm() {
    const form = document.querySelector('#productForm form');
    const button = document.querySelector('#productForm .toggle-form-btn');
    
    if (form.style.display === 'none') {
        try {
        // אם אין מוצר נוכחי, נקה את הטופס
        if (!currentProduct) {
            document.getElementById('productName').value = '';
            document.getElementById('productDesc').value = '';
            document.getElementById('productCategory').value = '';
            document.getElementById('productSku').value = '';
            document.getElementById('productOnSale').checked = false;
                document.getElementById('hasMultipleTypes').checked = false;
            removeImage();
                productTypes = [];
                document.getElementById('productTypesList').innerHTML = '';
                toggleProductTypes();
            }
            
            await loadCategories(); // טעינת קטגוריות לפני הצגת הטופס
            form.style.display = 'block';
            button.classList.add('active');
            button.textContent = 'סגור';
            
            // גלילה לטופס
            form.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error loading categories:', error);
            showMessage('שגיאה בטעינת קטגוריות', 'error');
        }
    } else {
        form.style.display = 'none';
        button.classList.remove('active');
        button.textContent = 'הוסף מוצר';
        currentProduct = null;
    }
}

// החלפת מצב טופס קטגוריה
function toggleCategoryForm() {
    const form = document.querySelector('.category-form');
    const button = document.querySelector('.category-management .toggle-form-btn');
    
    if (form.style.display === 'none') {
        form.style.display = 'block';
        button.classList.add('active');
        button.textContent = 'סגור';
    } else {
        form.style.display = 'none';
        button.classList.remove('active');
        button.textContent = 'הוסף קטגוריה';
        
        // ניקוי הטופס
        document.getElementById('newCategoryName').value = '';
        document.getElementById('newCategoryCode').value = '';
        delete document.getElementById('newCategoryCode').dataset.editId;
        
        // איפוס כותרת הכפתור
        const saveButton = document.querySelector('.category-form .save-btn');
        saveButton.textContent = 'שמור קטגוריה';
    }
}

// ניהול סוגי מוצרים
// let productTypes = []; // הסרת הגדרה כפולה

function toggleProductTypes() {
    const container = document.getElementById('productTypesContainer');
    const hasMultipleTypes = document.getElementById('hasMultipleTypes').checked;
    container.style.display = hasMultipleTypes ? 'block' : 'none';
    
    if (!hasMultipleTypes) {
        productTypes = [];
        document.getElementById('productTypesList').innerHTML = '';
    }
}

function addProductType() {
    const typeId = Date.now().toString();
    const typeItem = document.createElement('div');
    typeItem.className = 'product-type-item';
    typeItem.id = `type-${typeId}`;
    
    typeItem.innerHTML = `
        <div class="product-type-content">
            <div class="form-group">
                <label>שם הסוג</label>
                <input type="text" class="type-name" placeholder="לדוגמה: אדום, כחול, וכו'">
            </div>
            <div class="form-group">
                <label>תמונה</label>
                <input type="file" class="type-image" accept="image/*" onchange="previewTypeImage(this, '${typeId}')">
                <div class="image-preview">
                    <img class="preview-img" style="display: none;">
                    <div class="no-image">אין תמונה</div>
                </div>
            </div>
        </div>
        <div class="product-type-actions">
            <button type="button" class="set-default-btn" onclick="setDefaultType('${typeId}')">
                <i class="fas fa-star"></i> ברירת מחדל
            </button>
            <button type="button" class="remove-type-btn" onclick="removeProductType('${typeId}')">
                <i class="fas fa-trash"></i> הסר
            </button>
        </div>
    `;
    
    document.getElementById('productTypesList').appendChild(typeItem);
    productTypes.push({
        id: typeId,
        name: '',
        image: null,
        isDefault: productTypes.length === 0
    });
    
    if (productTypes.length === 1) {
        updateDefaultType(typeId);
    }
}

function previewTypeImage(input, typeId) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        const typeItem = document.getElementById(`type-${typeId}`);
        const previewImg = typeItem.querySelector('.preview-img');
        const noImage = typeItem.querySelector('.no-image');
        
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
            noImage.style.display = 'none';
            
            // עדכון המידע במערך
            const typeIndex = productTypes.findIndex(t => t.id === typeId);
            if (typeIndex !== -1) {
                productTypes[typeIndex].image = file;
            }
        };
        reader.readAsDataURL(file);
    }
}

function removeProductType(typeId) {
    const typeItem = document.getElementById(`type-${typeId}`);
    if (typeItem) {
        typeItem.remove();
        productTypes = productTypes.filter(t => t.id !== typeId);
        
        // אם הסרנו את ברירת המחדל, נקבע את הראשון כברירת מחדל
        if (productTypes.length > 0 && !productTypes.some(t => t.isDefault)) {
            updateDefaultType(productTypes[0].id);
        }
    }
}

function setDefaultType(typeId) {
    updateDefaultType(typeId);
}

function updateDefaultType(typeId) {
    // עדכון כפתורי ברירת המחדל
    document.querySelectorAll('.set-default-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const typeItem = document.getElementById(`type-${typeId}`);
    if (typeItem) {
        const btn = typeItem.querySelector('.set-default-btn');
        btn.classList.add('active');
    }
    
    // עדכון המערך
    productTypes.forEach(type => {
        type.isDefault = type.id === typeId;
    });
}

// פונקציה לטיפול בניווט בין הלשוניות
function handleNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // הסרת מצב פעיל מכל הכפתורים
            navButtons.forEach(btn => btn.classList.remove('active'));
            // הוספת מצב פעיל לכפתור הנוכחי
            button.classList.add('active');

            // הסתרת כל הסקציות
            const sections = document.querySelectorAll('.management-section');
            sections.forEach(section => section.style.display = 'none');

            // הצגת הסקציה המתאימה
            const targetSection = button.dataset.section;
            const activeSection = document.getElementById(targetSection);
            if (activeSection) {
                activeSection.style.display = 'block';
            }

            // טעינת נתונים בהתאם לסקציה
            if (targetSection === 'products-section') {
                loadProducts();
            } else if (targetSection === 'categories-section') {
                loadCategories();
            }
        });
    });
} 