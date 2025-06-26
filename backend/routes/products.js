const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');

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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false,
            message: 'טוקן לא תקין או פג תוקף' 
        });
    }
};

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // שמירת תמונות מוצרים בתיקיית products
        const productsDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'uploads', 'products');
        if (!fs.existsSync(productsDir)) {
            fs.mkdirSync(productsDir, { recursive: true });
        }
        cb(null, productsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// קבלת כל המוצרים
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'שגיאה בקבלת המוצרים', error: err.message });
    }
});

// קבלת מוצר ספציפי
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'המוצר לא נמצא' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: 'שגיאה בקבלת המוצר', error: err.message });
    }
});

// הוספת מוצר חדש
router.post('/', authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
        const productData = {
            ...req.body,
            image: req.file ? `/uploads/products/${req.file.filename}` : null
        };

        // טיפול בסוגי מוצרים מרובים
        if (req.body.hasMultipleTypes === 'true' && req.body.productTypes) {
            try {
                productData.productTypes = JSON.parse(req.body.productTypes);
                // וידוא שיש תמונה ברירת מחדל
                if (productData.productTypes.length > 0) {
                    const hasDefault = productData.productTypes.some(type => type.isDefault);
                    if (!hasDefault) {
                        productData.productTypes[0].isDefault = true;
                    }
                }
            } catch (parseError) {
                return res.status(400).json({ message: 'שגיאה בפענוח סוגי מוצרים' });
            }
        }

        const product = new Product(productData);
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ message: 'שגיאה ביצירת המוצר', error: err.message });
    }
});

// עדכון מוצר
router.put('/:id', authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
        const updateData = { ...req.body };
        
        if (req.file) {
            updateData.image = `/uploads/products/${req.file.filename}`;
        }

        // טיפול בסוגי מוצרים מרובים
        if (req.body.hasMultipleTypes === 'true' && req.body.productTypes) {
            try {
                updateData.productTypes = JSON.parse(req.body.productTypes);
                // וידוא שיש תמונה ברירת מחדל
                if (updateData.productTypes.length > 0) {
                    const hasDefault = updateData.productTypes.some(type => type.isDefault);
                    if (!hasDefault) {
                        updateData.productTypes[0].isDefault = true;
                    }
                }
            } catch (parseError) {
                return res.status(400).json({ message: 'שגיאה בפענוח סוגי מוצרים' });
            }
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'המוצר לא נמצא' });
        }
        
        res.json(product);
    } catch (err) {
        res.status(400).json({ message: 'שגיאה בעדכון המוצר', error: err.message });
    }
});

// מחיקת מוצר
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'המוצר לא נמצא' });
        }
        res.json({ message: 'המוצר נמחק בהצלחה' });
    } catch (err) {
        res.status(500).json({ message: 'שגיאה במחיקת המוצר', error: err.message });
    }
});

module.exports = router; 