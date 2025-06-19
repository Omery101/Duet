require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const mongoose = require('mongoose');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const contactRouter = require('./routes/contact');
const categoriesRouter = require('./routes/categories');
console.log('ADMIN_USERNAME:', process.env.ADMIN_USERNAME);
console.log('MONGODB_URI:', process.env.MONGODB_URI);

const app = express();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/duet';

// Configure mongoose
mongoose.set('strictQuery', false);

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('Successfully connected to MongoDB.');
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('Please make sure MongoDB is running on port 27017');
    console.error('You can start MongoDB by running: mongod --dbpath="C:\\data\\db"');
    process.exit(1);
});

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// קבועים
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'duetnihul@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// נקודת קצה להתחברות מנהל
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'נדרשים שם משתמש וסיסמה' });
    }

    // בדיקת פרטי התחברות
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token, message: 'התחברת בהצלחה' });
    } else {
        res.status(401).json({ success: false, message: 'שם משתמש או סיסמה שגויים' });
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
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false,
            message: 'טוקן לא תקין או פג תוקף' 
        });
    }
};

// וידוא שתיקיית uploads קיימת
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// נתיב לקובץ ה-JSON
const DB_FILE = 'db.json';

// פונקציות עזר לקריאה וכתיבה ל-JSON
function readDB() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { products: [], categories: [], contacts: [] };
    }
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));

app.post('/api/products', authenticateAdmin, upload.single('image'), (req, res) => {
    const db = readDB();
    const product = {
        id: Date.now().toString(),
            ...req.body,
        image: req.file ? `/uploads/${req.file.filename}` : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
        };
        console.log("vsdjkvbshvbsdhvjsd");
    db.products.push(product);
    writeDB(db);
        res.status(201).json(product);
});

app.put('/api/products/:id', authenticateAdmin, upload.single('image'), (req, res) => {
    const db = readDB();
    const index = db.products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ message: 'מוצר לא נמצא' });
    }
    const product = {
        ...db.products[index],
            ...req.body,
        updatedAt: new Date().toISOString()
        };
        if (req.file) {
        product.image = `/uploads/${req.file.filename}`;
        }
    db.products[index] = product;
    writeDB(db);
        res.json(product);
});

app.delete('/api/products/:id', authenticateAdmin, (req, res) => {
    const db = readDB();
    const index = db.products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
            return res.status(404).json({ message: 'מוצר לא נמצא' });
        }
    db.products.splice(index, 1);
    writeDB(db);
        res.json({ message: 'המוצר נמחק בהצלחה' });
});

// Contact
app.post('/api/contact', (req, res) => {
    const db = readDB();
    const contact = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString(),
        status: 'new'
    };
    db.contacts.push(contact);
    writeDB(db);
    res.status(201).json(contact);
});

// בדיקת תקינות טוקן מנהל
app.get('/api/admin/verify', authenticateAdmin, (req, res) => {
    res.json({ success: true, message: 'הטוקן תקין' });
});

// הוספת middleware לטיפול בשגיאות
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'שגיאת שרת',
        error: err.message 
    });
});

// נתיב ברירת מחדל
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home-page', 'home-page.html'));
});

// הפעלת השרת
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Attempting to connect to MongoDB...');
})
.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port or close the application using this port.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
}); 
