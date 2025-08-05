const nodemailer = require("nodemailer");
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const contactRouter = require('./routes/contact');
const categoriesRouter = require('./routes/categories');
const config = require('./config');

// בדיקת משתני סביבה נדרשים
const requiredEnvVars = [
    'MONGODB_URI',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
    'JWT_SECRET',
    'PORT'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !config[envVar]);
if (missingEnvVars.length > 0) {
    console.error('❌ חסרים משתני סביבה נדרשים:', missingEnvVars.join(', '));
    console.error('אנא הוסף אותם לקובץ .env או config.js');
    process.exit(1);
}

const app = express();

// CORS settings for cross-origin requests 
app.use(cors({
    origin: config.NODE_ENV === 'production' 
        ? ['https://duet-frontend.onrender.com'] 
        : 'http://localhost:3000',
    credentials: true
})); 

// MongoDB connection
const MONGODB_URI = config.MONGODB_URI;

// Configure mongoose
mongoose.set('strictQuery', false);

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ התחברות ל-MongoDB הצליחה');
})
.catch(err => {
    console.error('❌ שגיאת התחברות ל-MongoDB:', err.message);
    console.error('אנא וודא ש-MongoDB פועל על פורט 27017');
    process.exit(1);
});

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
    console.error('❌ שגיאת התחברות ל-MongoDB:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('ℹ️ התנתקות מ-MongoDB');
});

mongoose.connection.on('reconnected', () => {
    console.log('✅ התחברות מחדש ל-MongoDB');
});

// Middleware 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'frontend', 'public', 'uploads')));
app.use('/src', express.static(path.join(__dirname, '..', 'frontend', 'src')));

// וידוא שתיקיית uploads קיימת
const uploadsDir = path.join(__dirname, '..', 'frontend', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// וידוא שתיקיית products קיימת
const productsDir = path.join(uploadsDir, 'products');
if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true });
}

// וידוא שתיקיית logo קיימת
const logoDir = path.join(uploadsDir, 'logo');
if (!fs.existsSync(logoDir)) {
    fs.mkdirSync(logoDir, { recursive: true });
}

// Multer configuration for file uploads
// const { storage } = require('./config/cloudinary');
// const upload = multer({ storage });


// const upload = multer({ storage });
// const cpUpload = upload.fields([
//   { name: 'image', maxCount: 1 },              // תמונה ראשית של המוצר
//   { name: 'variantImages', maxCount: 10 }      // תמונות של גרסאות/וריאציות
// ]);

// app.post('/api/products', cpUpload, (req, res) => {
//   const mainImage = req.files['image']?.[0];
//   const variantImages = req.files['variantImages'] || [];

//   // ... המשך טיפול
// });


// נקודת קצה להתחברות מנהל
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'נדרשים שם משתמש וסיסמה' 
        });
    }

    // בדיקת פרטי התחברות
    if (username === config.ADMIN_USERNAME && 
        password === config.ADMIN_PASSWORD) {
        const token = jwt.sign(
            { username }, 
            config.JWT_SECRET, 
            { expiresIn: '24h' }
        );
        res.json({ 
            success: true, 
            token, 
            message: 'התחברת בהצלחה' 
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'שם משתמש או סיסמה שגויים' 
        });
    }
});

// Middleware לאימות מנהל
const authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'אין הרשאה - נדרש טוקן' 
        });
    }
    
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false,
            message: 'טוקן לא תקין או פג תוקף' 
        });
    }
};

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));

// נקודת קצה לקבלת קונפיגורציה לפרונטאנד
app.get('/api/config', (req, res) => {
    res.json({
        API_BASE_URL: `${req.protocol}://${req.get('host')}/api`,
        UPLOADS_PATH: '/uploads/',
        NODE_ENV: config.NODE_ENV,
        FEATURES: {
            AUTO_LOGOUT: true,
            PASSWORD_VISIBILITY: true,
            HEBREW_VALIDATION: true,
            REMEMBER_ME: true
        }
    });
});

// בדיקת תקינות טוקן מנהל
app.get('/api/admin/verify', authenticateAdmin, (req, res) => {
    res.json({ success: true, message: 'הטוקן תקין' });
});

// נקודת קצה לבדיקת גרסה ופיצ'רים
app.get('/api/version', (req, res) => {
    res.json({
        version: '2.0.0',
        features: {
            autoLogout: true,
            passwordVisibility: true,
            hebrewValidation: true,
            rememberMe: true
        },
        environment: config.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// הוספת נקודת קצה לאיפוס סיסמה (פשוטה, ללא bcrypt)
app.post('/api/admin/reset-password', (req, res) => {
    const { email } = req.body;
    if (email !== config.ADMIN_USERNAME) {
        return res.status(404).json({ error: 'כתובת אימייל לא נמצאה במערכת' });
    }
    // כאן אפשר להחזיר טוקן איפוס או הודעה (לפי הצורך)
    res.json({ message: 'הוראות שחזור סיסמה נשלחו לאימייל' });
});

// הוספת נקודת קצה לעדכון סיסמה (פשוטה, ללא bcrypt)
app.post('/api/admin/update-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (currentPassword !== config.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'סיסמה נוכחית שגויה' });
    }
    // עדכון סיסמה בקובץ env או config לא נתמך דינמית, רק דמו
    res.json({ message: 'הסיסמה עודכנה (דמו בלבד, יש לעדכן ידנית בקובץ .env/config.js)' });
});

// טיפול בשגיאות
app.use((err, req, res, next) => {
    console.error('❌ שגיאת שרת:', err.message);
    res.status(500).json({ 
        message: 'שגיאת שרת',
        error: config.NODE_ENV === 'development' ? err.message : 'שגיאה פנימית'
    });
});

// נתיב ברירת מחדל
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'home-page', 'home-page.html'));
});

// הפעלת השרת
const PORT = config.PORT;
app.listen(PORT, () => {
    console.log(`🚀 השרת פועל על פורט ${PORT}`);
}); 

  