// משתנים גלובליים
let productTypes = [];
let categories = [];
let currentProduct = null;
let currentImage = null;
let editingProductId = null;

// משתנים לניהול ניתוק אוטומטי
let inactivityTimer = null;
let sessionTimeout = 10 * 60 * 1000; // 10 דקות
let isRememberMeChecked = false;
let lastActivityTime = Date.now();

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('togglePassword');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', togglePasswordVisibility);
    }
  });

// אתחול כל הפונקציונליות

// פונקציה לבדיקת אימות ראשונית
async function checkInitialAuth() {
    if (!isAdminTokenValid()) {
        logout();
        return;
    }
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
            
            // בדיקת "הישאר מחובר"
            const savedRememberMe = localStorage.getItem('rememberMe');
            isRememberMeChecked = savedRememberMe === 'true';
            
            // הגדרת טיימר ניתוק אוטומטי אם לא מסומן "הישאר מחובר"
            if (!isRememberMeChecked) {
                resetInactivityTimer();
                setupActivityListeners();
            }
            
            // סדר טעינה: מוצרים -> קטגוריות
            await loadProducts();
            await loadCategories();
        } else {
            logout();
        }
    } catch (error) {
        console.error('שגיאה בבדיקת הטוקן:', error);
        logout();
    }
}

// פונקציה לבדיקת תוקף טוקן אדמין
function isAdminTokenValid() {
    const token = localStorage.getItem('adminToken');
    const tokenExpiry = localStorage.getItem('adminTokenExpiry');
    if (!token || !tokenExpiry) return false;
    return Date.now() < parseInt(tokenExpiry);
}

// פונקציה לשמירת טוקן אדמין עם תוקף
function saveAdminToken(token) {
    localStorage.setItem('adminToken', token);
    // תוקף של 24 שעות
    localStorage.setItem('adminTokenExpiry', (Date.now() + 24*60*60*1000).toString());
}

// פונקציות לניהול ניתוק אוטומטי
function resetInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    
    if (!isRememberMeChecked) {
        inactivityTimer = setTimeout(() => {
            showAutoLogoutWarning();
        }, sessionTimeout);
    }
    
    lastActivityTime = Date.now();
}

function showAutoLogoutWarning() {
    const warningMessage = 'הסשן יסתיים בעוד 30 שניות עקב חוסר פעילות. לחץ על "המשך" כדי להישאר מחובר.';
    showMessage(warningMessage, 'warning');
    
    // ניתוק אוטומטי אחרי 30 שניות
    setTimeout(() => {
        if (!isRememberMeChecked) {
            logout();
        }
    }, 30000);
}

function setupActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, true);
    });
}

// פונקציה לבדיקת שפה בעברית
function containsHebrewText(text) {
    const hebrewRegex = /[\u0590-\u05FF]/;
    return hebrewRegex.test(text);
}

// פונקציה להצגת/הסתרת סיסמה
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');
    const icon = toggleBtn.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// פונקציה לבדיקת סיסמה בעברית
function validatePasswordLanguage() {
    const passwordInput = document.getElementById('password');
    const passwordError = document.getElementById('passwordError');
    
    if (containsHebrewText(passwordInput.value)) {
        passwordError.style.display = 'flex';
        return false;
    } else {
        passwordError.style.display = 'none';
        return true;
    }
}

// בדיקת חיבור לשרת
async function checkServerConnection() {
    try {
        console.log('Checking server connection...');
        const response = await fetch('/api/categories');
        if (response.ok) {
            console.log('Server connection successful');
            return true;
        } else {
            console.error('Server connection failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Server connection error:', error);
        return false;
    }
}

// פונקציית התחברות
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // הסתרת הודעות שגיאה קודמות
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('passwordError').style.display = 'none';

    if (!username || !password) {
        showLoginError('יש למלא את כל השדות');
        return;
    }

    // בדיקת שפה בעברית
    if (!validatePasswordLanguage()) {
        return;
    }

    try {
        const serverConnected = await checkServerConnection();
        if (!serverConnected) {
            showMessage('אין חיבור לשרת, בדוק שהשרת פועל', 'error');
            return;
        }

        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 429) {
                showMessage('יותר מדי ניסיונות התחברות, נסה שוב בעוד 15 דקות', 'error');
            } else {
                throw new Error(data.message || 'שגיאת התחברות');
            }
            return;
        }

        // אם הצליח
        showLoginError('התחברות הצליחה', data, rememberMe);
        // שמירת הטוקן
        localStorage.setItem('adminToken', data.token);
    } catch (error) {
        console.error('שגיאת התחברות:', error);
        showLoginError(error.message || 'שגיאת התחברות');
        return;
    }
}


// פונקציה להצגת שגיאות התחברות
async function showLoginError(message, data = {}, rememberMe = false) {
    const loginError = document.getElementById('loginError');
    const errorSpan = loginError.querySelector('span');
    errorSpan.textContent = message;
    loginError.style.display = 'flex';

    try {
        if (data.token) {
            saveAdminToken(data.token);
            
            // שמירת מצב "הישאר מחובר"
            isRememberMeChecked = rememberMe;
            localStorage.setItem('rememberMe', rememberMe.toString());

            // הגדרת טיימר ניתוק אוטומטי
            if (!rememberMe) {
                resetInactivityTimer();
                setupActivityListeners();
            }

            // מעבר לממשק ניהול
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            document.querySelector('.floating-logout').style.display = 'flex';

            // טעינת מוצרים וקטגוריות
            await loadProducts();
            await loadCategories();

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
    // ניקוי טיימרים
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
    
    // ניקוי מאזיני אירועים
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
    });
    
    // ניקוי localStorage
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminTokenExpiry');
    localStorage.removeItem('rememberMe');
    
    // איפוס משתנים
    isRememberMeChecked = false;
    lastActivityTime = Date.now();
    
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    document.querySelector('.floating-logout').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showMessage('התנתקת בהצלחה', 'success');
}
// מאזין התנתקות
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout(); // תנתק מיד, בלי לבדוק שום תנאי
      showMessage('התנתקת בהצלחה', 'success');
    });
  }
});

// מבנה קטגוריות
// let categories = []; // הסרת הגדרה כפולה

// שמירת קטגוריות
function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories));
}

// הוספת קטגוריה חדשה
async function addCategory() {
    console.log('Adding category...');
    const categoryName = document.getElementById('newCategoryName').value.trim();
    const categoryCode = document.getElementById('newCategoryCode').value.trim().toLowerCase();
    const editId = document.getElementById('newCategoryCode').dataset.editId;
    
    console.log('Category data:', { categoryName, categoryCode, editId });
    
    if (!categoryName || !categoryCode) {
        showMessage('יש למלא את כל השדות!', 'error');
        return;
    }
    
    try {
        // בדיקה אם הקוד כבר קיים (למעט אם עורכים את אותה קטגוריה)
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
        
        const codeExists = existingCategories.some(cat => cat.code === categoryCode && cat.code !== editId);
        
        if (codeExists) {
            showMessage('קוד קטגוריה זה כבר קיים במערכת!', 'error');
            return;
        }
        
        const url = editId ? `/api/categories/${editId}` : '/api/categories';
        const method = editId ? 'PUT' : 'POST';
        
        console.log('Sending request to:', url, 'with method:', method);
async function fetchWithAuth(url, options = {}) {
    showLoading(true);

    try {
        const headers = {
            ...options.headers,
        };

        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                ...headers
            }
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
    } finally {
        showLoading(false);
    }
}

        
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
        
        // רענון רשימת הקטגוריות בדף
        displayCategories(categories);
        
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
        // תמיכה במערך
        if (Array.isArray(categories)) {
            const category = categories.find(cat => cat && cat.code === categoryCode);
        return category ? category.name : categoryCode;
        }
        // תמיכה באובייקט (למקרה ישן)
        if (typeof categories === 'object') {
            const category = categories[categoryCode];
            return category ? category.name : categoryCode;
        }
        return categoryCode;
    } catch (error) {
        console.error('שגיאה בפענוח קטגוריות:', error);
        return categoryCode;
    }
}

// אלמנטים
const elements = {
    loginForm: document.getElementById('loginForm'),
    adminPanel: document.getElementById('adminPanel'),
    productForm: document.getElementById('productForm'),
    productsTable: document.getElementById('productsTable'),
    imagePreview: document.getElementById('imagePreview'),
    previewImg: document.getElementById('previewImg'),
    logoutBtn: document.getElementById('logoutBtn'),
    categoryForm: document.getElementById('categoryForm'),
    categoriesList: document.getElementById('categoriesList'),
};

// הצגת תמונה מקדימה
function previewImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
            previewImg.style.width = '80px';
            previewImg.style.height = '80px';
            previewImg.style.objectFit = 'cover';
            imagePreview.querySelector('.no-image').style.display = 'none';
            currentImage = file;
        };
        reader.readAsDataURL(file);
    } else {
        // אם אין קובץ, לאפס תצוגה
        previewImg.src = '';
        previewImg.style.display = 'none';
        imagePreview.querySelector('.no-image').style.display = 'block';
        currentImage = null;
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
    showLoading(true);

    try {
        console.log('Token:', localStorage.getItem('adminToken'));
        const response = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                 ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
                ...options.headers
            }
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
    } finally {
        showLoading(false);
    }
}


// טעינת מוצרים
async function loadProducts() {
    try {
        console.log('Loading products...');
        const response = await fetchWithAuth('/api/products');
        if (!response.ok) {
            throw new Error('שגיאה בטעינת מוצרים');
        }
        const products = await response.json();
        window.allProducts = products; // שמירה גלובלית
        console.log('Products loaded:', products);
        displayProducts(products);
    } catch (error) {
        console.error('שגיאה בטעינת מוצרים:', error);
        showMessage(error.message, 'error');
    }
}

// הצגת מוצרים בטבלה
function displayProducts(products) {
    const tbody = document.querySelector('#productsTable tbody');
    if (!tbody) return;
        if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">לא נמצאו מוצרים</td></tr>';
            return;
        }
    tbody.innerHTML = products.map(product => {
        // קביעת נתיב תמונה נכון
        let imagePath = '';
        if (product.image) {
            imagePath = product.image.startsWith('/uploads/products/') ? product.image : '/uploads/products/' + product.image.replace(/^\/uploads\//, '');
        }
        if (editingProductId === product._id) {
            // מצב עריכה
            return `
            <tr class="editing-row">
                <td><input type="text" value="${product.name || ''}" id="editName"></td>
                <td><input type="text" value="${product.description || product.desc || ''}" id="editDesc"></td>
                <td><select id="editCategory">${(categories||[]).map(cat => `<option value="${cat.code}" ${cat.code===product.category?'selected':''}>${cat.name}</option>`).join('')}</select></td>
                <td><input type="text" value="${product.sku || ''}" id="editSku"></td>
                <td>
                    ${product.image ? `<img src="${imagePath}" alt="${product.name}" style="width:50px;height:50px;object-fit:cover;display:block;margin-bottom:4px;">` : 'אין תמונה'}
                    <input type="file" id="editImage" accept="image/*">
                </td>
                <td><input type="checkbox" id="editOnSale" ${product.onSale ? 'checked' : ''}></td>
                <td>
                    <button class="save-btn" onclick="saveProductEdit('${product._id}')">שמור</button>
                    <button class="cancel-btn" onclick="cancelProductEdit()">ביטול</button>
                </td>
            </tr>
            `;
            } else {
            return `
            <tr>
                <td>${product.name || ''}</td>
                <td>${product.description || product.desc || ''}</td>
                <td>${getCategoryName(product.category) || ''}</td>
                <td>${product.sku || ''}</td>
                <td>${product.image ? `<img src="${imagePath}" alt="${product.name}" style="width:50px;height:50px;object-fit:cover;">` : 'אין תמונה'}</td>
                <td>${product.onSale ? 'כן' : 'לא'}</td>
                <td>
                    <button class="edit-btn" onclick="editProduct('${product._id}')">ערוך</button>
                    <button class="delete-btn" onclick="confirmDelete('${product._id}')">מחק</button>
                </td>
            </tr>
            `;
        }
    }).join('');
}

// פונקציות חיפוש ודפדוף (placeholder)
function setupAdvancedSearch() {
    // TODO: להוסיף חיפוש מתקדם
    console.log('Advanced search setup - to be implemented');
}

function setupPagination(products) {
    // TODO: להוסיף דפדוף
    console.log('Pagination setup - to be implemented');
}

// פונקציה לעריכת מוצר
function editProduct(productId) {
    editingProductId = productId;
    displayProducts(window.allProducts || []);
}
// פונקציה ביטול עריכת מוצר
function cancelProductEdit() {
    editingProductId = null;
    displayProducts(window.allProducts || []);
}
// פונצקיה שמירת עריכת מוצר
async function saveProductEdit(productId) {
    const name = document.getElementById('editName').value.trim();
    const desc = document.getElementById('editDesc').value.trim();
    const category = document.getElementById('editCategory').value;
    const sku = document.getElementById('editSku').value.trim();
    const onSale = document.getElementById('editOnSale').checked;
    const imageInput = document.getElementById('editImage');
    const imageFile = imageInput.files[0];
        if (!name || !desc || !category || !sku) {
            showMessage('יש למלא את כל השדות החובה', 'error');
            return;
        }
        const formData = new FormData();
        formData.append('name', name);
        formData.append('desc', desc);
        formData.append('category', category);
        formData.append('sku', sku);
    formData.append('onSale', onSale);
    if (imageFile) formData.append('image', imageFile);
    try {
        const response = await fetchWithAuth(`/api/products/${productId}`, {
            method: 'PUT',
            body: formData
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'שגיאה בעדכון המוצר');
        }
        showMessage('המוצר עודכן בהצלחה', 'success');
        editingProductId = null;
        await loadProducts();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// סינון מוצרים בטבלה לפי כותרות
function setupProductTableFilters() {
    const table = document.getElementById('productsTable');
    if (!table) return;
    let filterRow = table.querySelector('.filter-row');
    if (!filterRow) {
        filterRow = document.createElement('tr');
        filterRow.className = 'filter-row';
        // קבלת קטגוריות
        let cats = [];
        try {
            cats = categories && categories.length ? categories : JSON.parse(localStorage.getItem('categories')) || [];
        } catch (e) { cats = []; }
        filterRow.innerHTML = `
            <td><input type="text" id="filterName" placeholder="חפש שם"></td>
            <td><input type="text" id="filterDesc" placeholder="חפש תיאור"></td>
            <td><select id="filterCategory"><option value="">כל הקטגוריות</option>${cats.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('')}</select></td>
            <td><input type="text" id="filterSku" placeholder="חפש מק''ט"></td>
            <td></td>
            <td><select id="filterOnSale"><option value="">הכל</option><option value="כן">כן</option><option value="לא">לא</option></select></td>
            <td></td>
        `;
        table.querySelector('thead').appendChild(filterRow);
        // מאזינים
        document.getElementById('filterName').addEventListener('input', filterProductTable);
        document.getElementById('filterDesc').addEventListener('input', filterProductTable);
        document.getElementById('filterCategory').addEventListener('change', filterProductTable);
        document.getElementById('filterSku').addEventListener('input', filterProductTable);
        document.getElementById('filterOnSale').addEventListener('change', filterProductTable);
    } else {
        // עדכון רשימת הקטגוריות אם צריך (למשל אחרי הוספה/מחיקה)
        const filterCategory = filterRow.querySelector('#filterCategory');
        if (filterCategory) {
            let cats = [];
            try {
                cats = categories && categories.length ? categories : JSON.parse(localStorage.getItem('categories')) || [];
            } catch (e) { cats = []; }
            const currentVal = filterCategory.value;
            filterCategory.innerHTML = `<option value="">כל הקטגוריות</option>${cats.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('')}`;
            filterCategory.value = currentVal;
        }
    }
}

function filterProductTable() {
    const nameVal = document.getElementById('filterName').value.toLowerCase();
    const descVal = document.getElementById('filterDesc').value.toLowerCase();
    const catVal = document.getElementById('filterCategory').value;
    const skuVal = document.getElementById('filterSku').value.toLowerCase();
    const onSaleVal = document.getElementById('filterOnSale').value;
    const rows = document.querySelectorAll('#productsTable tbody tr');
    rows.forEach(row => {
        const tds = row.querySelectorAll('td');
        const name = tds[0]?.textContent?.toLowerCase() || '';
        const desc = tds[1]?.textContent?.toLowerCase() || '';
        const cat = tds[2]?.textContent || '';
        const sku = tds[3]?.textContent?.toLowerCase() || '';
        const onSale = tds[5]?.textContent?.trim() || '';
        let show = true;
        if (nameVal && !name.includes(nameVal)) show = false;
        if (descVal && !desc.includes(descVal)) show = false;
        if (catVal && cat !== catVal && catVal !== '') show = false;
        if (skuVal && !sku.includes(skuVal)) show = false;
        if (onSaleVal && onSale !== onSaleVal) show = false;
        row.style.display = show ? '' : 'none';
    });
}

// פונקציה למחיקת מוצר
async function deleteProduct(productId) {
    try {
        const response = await fetchWithAuth(`/api/products/${productId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'שגיאה במחיקת המוצר');
        }
        
        showMessage('המוצר נמחק בהצלחה', 'success');
        await loadProducts(); // רענון הטבלה
    } catch (error) {
        console.error('שגיאה במחיקת מוצר:', error);
        showMessage(error.message, 'error');
    }
}

// פונקציה לאישור מחיקה
function confirmDelete(id) {
    if (!id) {
        showMessage('מזהה מוצר לא תקין', 'error');
        return;
    }
    
    if (confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) {
        deleteProduct(id);
    }
}

// פונקציית הודעות
function showMessage(message, type) {
    // הסר הודעות קודמות (למעט אזהרות ניתוק אוטומטי)
    const existingMessages = document.querySelectorAll('.message:not(.warning)');
    existingMessages.forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    // הוספת אייקון להודעות
    let icon = '';
    switch(type) {
        case 'error':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    messageDiv.innerHTML = `${icon} <span>${message}</span>`;
    document.body.appendChild(messageDiv);

    // הסר את ההודעה אחרי זמן מתאים
    const timeout = type === 'warning' ? 30000 : 3000; // 30 שניות לאזהרות, 3 שניות לשאר
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, timeout);
}

// טעינת קטגוריות מהשרת ועדכון הרשימות
async function loadCategories() {
    try {
        console.log('Loading categories...');
        const response = await fetchWithAuth('/api/categories');
        if (!response.ok) {
            throw new Error('שגיאה בטעינת קטגוריות');
        }
        categories = await response.json();
        console.log('Categories loaded:', categories);
        localStorage.setItem('categories', JSON.stringify(categories));
        await updateCategorySelects(categories);
        
        // הצגת רשימת הקטגוריות בדף
        displayCategories(categories);
        
    } catch (error) {
        console.error('שגיאה בטעינת קטגוריות:', error);
        showMessage(error.message, 'error');
    }
}

// הצגת קטגוריות ברשימה
function displayCategories(categories) {
    console.log('Displaying categories:', categories);
    const categoriesList = document.getElementById('categoriesList');
    console.log('Categories list element:', categoriesList);
    if (!categoriesList) {
        console.error('Categories list element not found!');
        return;
    }
        if (!categories || categories.length === 0) {
            console.log('No categories to display');
        categoriesList.innerHTML = '<div class="no-data">לא נמצאו קטגוריות</div>';
        return;
    }
    console.log('Rendering', categories.length, 'categories');
    categoriesList.innerHTML = categories.map(category => {
        // חישוב מספר מוצרים בקטגוריה
        const products = window.allProducts || [];
        const numProducts = products.filter(p => p.category === category.code).length;
        return `
        <div class="category-item">
                    <div class="category-info">
                        <h4>${category.name}</h4>
                        <p>קוד: ${category.code}</p>
                <p>מספר מוצרים: <span class="category-product-count">${numProducts}</span></p>
                    </div>
                    <div class="category-actions">
                <button class="edit-btn" onclick="editCategory('${category.code}')">ערוך</button>
                <button class="delete-btn" onclick="confirmDeleteCategory('${category.code}')">מחק</button>
            </div>
                    </div>
                `;
    }).join('');
    console.log('Categories rendered successfully');
}

// פונקציה לעריכת קטגוריה
function editCategory(categoryCode) {
    const category = categories.find(cat => cat.code === categoryCode);
    if (!category) {
        showMessage('קטגוריה לא נמצאה', 'error');
        return;
    }
    
    // מילוי הטופס עם נתוני הקטגוריה
    document.getElementById('newCategoryName').value = category.name;
    document.getElementById('newCategoryCode').value = category.code;
    document.getElementById('newCategoryCode').dataset.editId = category.code;
    
    // שינוי כותרת הכפתור
    const saveButton = document.querySelector('.category-form .save-btn');
    if (saveButton) {
        saveButton.textContent = 'עדכן קטגוריה';
    }
    
    // הצגת הטופס
        const categoryForm = document.querySelector('.category-form');
    if (categoryForm) {
        categoryForm.style.display = 'block';
    }
    
    showMessage('טופס עריכת קטגוריה נפתח', 'info');
}

// פונקציה לאישור מחיקת קטגוריה
function confirmDeleteCategory(categoryCode) {
    if (!categoryCode) {
        showMessage('קוד קטגוריה לא תקין', 'error');
        return;
    }

    if (confirm('האם אתה בטוח שברצונך למחוק קטגוריה זו?')) {
        deleteCategory(categoryCode);
    }
}

// פונקציה למחיקת קטגוריה
async function deleteCategory(categoryCode) {
    // בדיקה אם יש מוצרים בקטגוריה
    const products = window.allProducts || [];
    const numProducts = products.filter(p => p.category === categoryCode).length;
    if (numProducts > 0) {
        showMessage(`בקטגוריה זו קיימים ${numProducts} מוצרים`, 'error');
            return;
        }
    try {
        const response = await fetchWithAuth(`/api/categories/${categoryCode}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'שגיאה במחיקת הקטגוריה');
        }
        showMessage('הקטגוריה נמחקה בהצלחה', 'success');
        await loadCategories(); // רענון הרשימה
    } catch (error) {
        console.error('שגיאה במחיקת קטגוריה:', error);
        showMessage(error.message, 'error');
    }
}

// מעבר בין לשוניות מוצרים/קטגוריות
function toggleCategoryManagement() {
    const categoriesSection = document.getElementById('categories-section');
    const productsSection = document.getElementById('products-section');
    if (categoriesSection && productsSection) {
        const isCategoriesActive = categoriesSection.classList.contains('active-section');
        if (isCategoriesActive) {
            categoriesSection.classList.remove('active-section');
            categoriesSection.style.display = 'none';
            productsSection.classList.add('active-section');
            productsSection.style.display = 'block';
    } else {
            categoriesSection.classList.add('active-section');
            categoriesSection.style.display = 'block';
            productsSection.classList.remove('active-section');
            productsSection.style.display = 'none';
        }
    }
}

// הצגת/הסתרת טעינה
function showLoading(isLoading) {
    let loader = document.getElementById('globalLoader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.style.position = 'fixed';
        loader.style.top = '0';
        loader.style.left = '0';
        loader.style.width = '100vw';
        loader.style.height = '100vh';
        loader.style.background = 'rgba(255,255,255,0.6)';
        loader.style.display = 'flex';
        loader.style.alignItems = 'center';
        loader.style.justifyContent = 'center';
        loader.style.zIndex = '9999';
        loader.innerHTML = '<div style="padding:30px 50px;background:#fff;border-radius:12px;box-shadow:0 2px 12px #aaa;font-size:1.5em;font-weight:bold;">טוען...</div>';
        document.body.appendChild(loader);
    }
    loader.style.display = isLoading ? 'flex' : 'none';
}

// פונקציה גנרית להצגת/הסתרת טופס
function toggleForm(btn, formSelector, defaultText) {
    let form = btn.closest('.form-container').querySelector(formSelector);
    if (form) {
        const isOpen = form.style.display === 'block';
        form.style.display = isOpen ? 'none' : 'block';
        // שינוי עיצוב הכפתור
        if (!isOpen) {
            btn.classList.add('active');
            btn.style.background = 'linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)';
            btn.textContent = 'סגור';
        } else {
            btn.classList.remove('active');
            btn.style.background = '';
            btn.textContent = defaultText;
        }
    }
}

// פונקציה ליצירת HTML של סוגי מוצר
function renderProductTypes() {
    const list = document.getElementById('productTypesList');
    if (!list) return;
    if (!Array.isArray(productTypes) || productTypes.length === 0) {
        list.innerHTML = '<div style="color:#888;font-size:0.95em;">לא הוגדרו סוגי מוצר</div>';
        return;
    }
    list.innerHTML = productTypes.map((type, idx) => `
        <div class="product-type-item">
        <div class="product-type-content">
            <div class="form-group">
                    <label>שם סוג</label>
                    <input type="text" value="${type.name || ''}" data-idx="${idx}" class="type-name-input">
            </div>
            <div class="form-group">
                <label>תמונה</label>
                    <input type="file" data-idx="${idx}" class="type-image-input" accept="image/*">
                    <div class="image-preview" style="width:60px;height:60px;">
                        ${type.image ? `<img src="${type.image}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;">` : '<div class="no-image">אין תמונה</div>'}
                </div>
            </div>
        </div>
        <div class="product-type-actions">
                <button type="button" class="remove-type-btn" data-idx="${idx}">הסר</button>
        </div>
        </div>
    `).join('');

    // מאזינים לשדות שם
    list.querySelectorAll('.type-name-input').forEach(input => {
        input.addEventListener('input', function() {
            const idx = +this.dataset.idx;
            productTypes[idx].name = this.value;
        });
    });
    // מאזינים לקבצי תמונה
    list.querySelectorAll('.type-image-input').forEach(input => {
        input.addEventListener('change', function() {
            const idx = +this.dataset.idx;
            const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
                    productTypes[idx].image = e.target.result;
                    renderProductTypes();
        };
        reader.readAsDataURL(file);
    }
        });
    });
    // מאזינים לכפתור הסרה
    list.querySelectorAll('.remove-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = +this.dataset.idx;
            productTypes.splice(idx, 1);
            renderProductTypes();
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // בדיקת חיבור לשרת
    checkServerConnection().then(connected => {
        if (!connected) {
            showMessage('אין חיבור לשרת, בדוק שהשרת פועל', 'error');
        }
    });
    
    // התחברות מנהל
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            login();
        });
    }

    // האזנה לטופס הוספת קטגוריה
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addCategory();
        });
    }

    // טיפול בהעלאת תמונה
    const productImageInput = document.getElementById('productImage');
    if (productImageInput) {
        productImageInput.addEventListener('change', function(e) {
            previewImage(productImageInput);
        });
    }

    // כפתור הסר תמונה
    const removeImageBtn = document.querySelector('.remove-image-btn');
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            removeImage();
        });
    }

    // האזנה לכפתורי ניווט בין לשוניות
    const navBtns = document.querySelectorAll('.admin-navigation .nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
            const section = btn.getAttribute('data-section');
            document.querySelectorAll('.management-section').forEach(sec => {
                sec.classList.remove('active-section');
                sec.style.display = 'none';
            });
            const target = document.getElementById(section);
            if (target) {
                target.classList.add('active-section');
                target.style.display = 'block';
            }
        });
    });

    // האזנה לכל כפתורי הוספת טופס (מוצר/קטגוריה)
    document.querySelectorAll('.toggle-form-btn').forEach(btn => {
        if (btn.closest('.form-container').querySelector('#productFormElement')) {
            btn.addEventListener('click', function() {
                toggleForm(btn, '#productFormElement', 'הוסף מוצר');
            });
        } else if (btn.closest('.form-container').querySelector('.category-form')) {
            btn.addEventListener('click', function() {
                toggleForm(btn, '.category-form', 'הוסף קטגוריה');
            });
        }
    });

    // פונקציה להצגת/הסתרת אזור ניהול קטגוריות (אם יש צורך)
    const addCategoryBtn = document.querySelector('.add-category-btn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', toggleCategoryManagement);
    }
    const closeCategoryBtn = document.querySelector('.close-category-btn');
    if (closeCategoryBtn) {
        closeCategoryBtn.addEventListener('click', toggleCategoryManagement);
    }

    // פתיחה/סגירה של שאלון סוגי מוצר
    const hasMultipleTypesCheckbox = document.getElementById('hasMultipleTypes');
    const productTypesContainer = document.getElementById('productTypesContainer');
    if (hasMultipleTypesCheckbox && productTypesContainer) {
        hasMultipleTypesCheckbox.addEventListener('change', function() {
            if (hasMultipleTypesCheckbox.checked) {
                productTypesContainer.style.display = 'block';
            } else {
                productTypesContainer.style.display = 'none';
            }
        });
    }

    // כפתור הוספת סוג מוצר
    const addTypeBtn = document.querySelector('.add-type-btn');
    if (addTypeBtn) {
        addTypeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            productTypes.push({ name: '', image: '', isDefault: productTypes.length === 0 });
            renderProductTypes();
        });
    }
    // רנדר ראשוני לסוגי מוצר
    renderProductTypes();

    // האזנה לשמירת מוצר
    const productForm = document.getElementById('productFormElement');
    if (productForm) {
        productForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            // איסוף נתונים
            const name = document.getElementById('productName').value.trim();
            const desc = document.getElementById('productDesc').value.trim();
            const category = document.getElementById('productCategory').value;
            const sku = document.getElementById('productSku').value.trim();
            const onSale = document.getElementById('productOnSale').checked;
            const hasMultipleTypes = document.getElementById('hasMultipleTypes').checked;
            const imageInput = document.getElementById('productImage');
            const imageFile = imageInput.files[0];
            // ולידציה בסיסית
            if (!name || !desc || !category || !sku) {
                showMessage('יש למלא את כל השדות החובה', 'error');
                return;
            }
            // הכנת formData
            const formData = new FormData();
            formData.append('name', name);
            formData.append('desc', desc);
            formData.append('category', category);
            formData.append('sku', sku);
            formData.append('onSale', onSale);
            formData.append('hasMultipleTypes', hasMultipleTypes);
            if (imageFile) formData.append('image', imageFile);
            if (hasMultipleTypes) {
                // ניקוי תמונות base64, רק שמות ותמונות יועברו
                const typesToSend = productTypes.map(t => ({ name: t.name, isDefault: t.isDefault, image: t.image }));
                formData.append('productTypes', JSON.stringify(typesToSend));
                // TODO: שליחת קבצי תמונה אמיתיים לסוגים (אם נדרש)
            }
            try {
                const response = await fetchWithAuth('/api/products', {
                    method: 'POST',
                    body: formData
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'שגיאה בשמירת המוצר');
                }
                showMessage('המוצר נשמר בהצלחה', 'success');
                productForm.reset();
                productTypes = [];
                renderProductTypes();
                removeImage();
                await loadProducts();
            } catch (error) {
                showMessage(error.message, 'error');
            }
        });
    }

    // יצירת מזהה ייחודי במונגו למוצר שהתווסף
    // function generateCustomId(categoryName, productName, sku, version = '') {
    // const categoryLetter = categoryName.trim()[0].toUpperCase();
    // const cleanProductName = productName.trim().replace(/\s+/g, '-').toLowerCase();
    // const versionSuffix = version ? `-${version.toUpperCase()}` : '';
    // return `${categoryLetter}-${cleanProductName}-${sku}${versionSuffix}`;
    // }


    // קריאה ב-DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupProductTableFilters);
    } else {
        setupProductTableFilters();
    }
    
    // אתחול פונקציונליות חדשה
    initializeNewFeatures();
});

// פונקציה לאתחול הפונקציונליות החדשות
function initializeNewFeatures() {
    // אתחול כפתור הצגת/הסתרת סיסמה
    const togglePasswordBtn = document.getElementById('togglePassword');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }
    
    // אתחול בדיקת שפה בעברית בשדה סיסמה
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', validatePasswordLanguage);
    }
    
    // אתחול צ'ק בוקס "הישאר מחובר"
    const rememberMeCheckbox = document.getElementById('rememberMe');
    if (rememberMeCheckbox) {
        // טעינת העדפה קודמת
        const savedRememberMe = localStorage.getItem('rememberMe');
        if (savedRememberMe === 'true') {
            rememberMeCheckbox.checked = true;
            isRememberMeChecked = true;
        }
        
        rememberMeCheckbox.addEventListener('change', function() {
            isRememberMeChecked = this.checked;
            localStorage.setItem('rememberMe', this.checked.toString());
            
            if (this.checked) {
                // ביטול טיימר ניתוק אוטומטי
                if (inactivityTimer) {
                    clearTimeout(inactivityTimer);
                    inactivityTimer = null;
                }
            } else {
                // הפעלת טיימר ניתוק אוטומטי
                resetInactivityTimer();
            }
        });
    }
    
    // אתחול טופס התחברות
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await login();
        });
    }
    
    // בדיקת אימות ראשונית
    checkInitialAuth();
}