const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');

// הגדרת multer לטיפול בהעלאת תמונות
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/uploads/products');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('רק קבצי תמונה מותרים!'), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'שגיאה בטעינת המוצרים' });
    }
});

// הוספת מוצר חדש
router.post('/', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'typeImages', maxCount: 10 }
]), async (req, res) => {
    try {
        console.log('Received product data:', req.body);
        console.log('Received files:', req.files);

        // בדיקת שדות חובה
        const { name, desc, category, sku, onSale, hasMultipleTypes, productTypes } = req.body;
        
        if (!name || !desc || !category || !sku) {
            return res.status(400).json({
                message: 'יש למלא את כל השדות החובה'
            });
        }

        // בדיקה אם המק"ט כבר קיים
        const existingProduct = await Product.findOne({ sku });
        if (existingProduct) {
            return res.status(400).json({
                message: 'מק"ט זה כבר קיים במערכת'
            });
        }

        // טיפול בסוגי המוצר
        let productTypesArray = [];
        if (hasMultipleTypes === 'true' && productTypes) {
            try {
                const typesData = JSON.parse(productTypes);
                if (!Array.isArray(typesData) || typesData.length === 0) {
                    throw new Error('פורמט סוגי המוצר לא תקין');
                }

                // מיפוי התמונות לסוגי המוצר
                const typeImages = req.files?.typeImages || [];
                productTypesArray = typesData.map((type, index) => {
                    const typeImage = typeImages[index];
                    return {
                        name: type.name,
                        image: typeImage ? `/uploads/products/${typeImage.filename}` : null,
                        isDefault: type.isDefault
                    };
                });

                // וידוא שיש לפחות סוג אחד מסומן כברירת מחדל
                if (!productTypesArray.some(type => type.isDefault)) {
                    productTypesArray[0].isDefault = true;
                }

                // וידוא שכל הסוגים מלאים
                const invalidTypes = productTypesArray.filter(type => !type.name || !type.image);
                if (invalidTypes.length > 0) {
                    throw new Error('יש למלא את כל פרטי סוגי המוצר');
                }
            } catch (error) {
                return res.status(400).json({
                    message: error.message || 'שגיאה בעיבוד סוגי המוצר'
                });
            }
        }

        // יצירת המוצר החדש
        const productData = {
            name,
            desc,
            category,
            sku,
            onSale: onSale === 'true',
            hasMultipleTypes: hasMultipleTypes === 'true',
            productTypes: productTypesArray
        };

        // אם אין סוגי מוצר, נשתמש בתמונה הראשית
        if (!hasMultipleTypes && req.files?.image?.[0]) {
            productData.image = `/uploads/products/${req.files.image[0].filename}`;
        } else if (productTypesArray.length > 0) {
            // אם יש סוגי מוצר, נשתמש בתמונה של ברירת המחדל
            const defaultType = productTypesArray.find(type => type.isDefault);
            if (defaultType) {
                productData.image = defaultType.image;
            }
        }

        console.log('Creating product with data:', productData);
        const product = new Product(productData);
        await product.save();

        res.status(201).json({
            message: 'המוצר נוסף בהצלחה',
            product
        });

    } catch (error) {
        console.error('Error details:', error);
        console.error('Error adding product:', error);
        
        // טיפול בשגיאות ספציפיות
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'שגיאת אימות',
                details: Object.values(error.errors).map(err => err.message)
            });
        }
        
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'מק"ט זה כבר קיים במערכת'
            });
        }

        res.status(500).json({
            message: 'שגיאה בהוספת המוצר',
            error: error.message
        });
    }
});

// עדכון מוצר קיים
router.put('/:id', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'typeImages', maxCount: 10 }
]), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, desc, category, sku, onSale, hasMultipleTypes, productTypes } = req.body;

        // בדיקת שדות חובה
        if (!name || !desc || !category || !sku) {
            return res.status(400).json({
                message: 'יש למלא את כל השדות החובה'
            });
        }

        // בדיקה אם המק"ט כבר קיים (חוץ מהמוצר הנוכחי)
        const existingProduct = await Product.findOne({ sku, _id: { $ne: id } });
        if (existingProduct) {
            return res.status(400).json({
                message: 'מק"ט זה כבר קיים במערכת'
            });
        }

        // טיפול בסוגי המוצר
        let productTypesArray = [];
        if (hasMultipleTypes === 'true' && productTypes) {
            try {
                const typesData = JSON.parse(productTypes);
                if (!Array.isArray(typesData) || typesData.length === 0) {
                    throw new Error('פורמט סוגי המוצר לא תקין');
                }

                // מיפוי התמונות לסוגי המוצר
                const typeImages = req.files?.typeImages || [];
                productTypesArray = typesData.map((type, index) => {
                    const typeImage = typeImages[index];
                    return {
                        name: type.name,
                        image: typeImage ? `/uploads/products/${typeImage.filename}` : type.image,
                        isDefault: type.isDefault
                    };
                });

                // וידוא שיש לפחות סוג אחד מסומן כברירת מחדל
                if (!productTypesArray.some(type => type.isDefault)) {
                    productTypesArray[0].isDefault = true;
                }

                // וידוא שכל הסוגים מלאים
                const invalidTypes = productTypesArray.filter(type => !type.name || !type.image);
                if (invalidTypes.length > 0) {
                    throw new Error('יש למלא את כל פרטי סוגי המוצר');
                }
            } catch (error) {
                return res.status(400).json({
                    message: error.message || 'שגיאה בעיבוד סוגי המוצר'
                });
            }
        }

        // עדכון המוצר
        const updateData = {
            name,
            desc,
            category,
            sku,
            onSale: onSale === 'true',
            hasMultipleTypes: hasMultipleTypes === 'true',
            productTypes: productTypesArray
        };

        // אם אין סוגי מוצר, נשתמש בתמונה הראשית
        if (!hasMultipleTypes && req.files?.image?.[0]) {
            updateData.image = `/uploads/products/${req.files.image[0].filename}`;
        } else if (productTypesArray.length > 0) {
            // אם יש סוגי מוצר, נשתמש בתמונה של ברירת המחדל
            const defaultType = productTypesArray.find(type => type.isDefault);
            if (defaultType) {
                updateData.image = defaultType.image;
            }
        }

        const product = await Product.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                message: 'המוצר לא נמצא'
            });
        }

        res.json({
            message: 'המוצר עודכן בהצלחה',
            product
        });

    } catch (error) {
        console.error('Error updating product:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'שגיאת אימות',
                details: Object.values(error.errors).map(err => err.message)
            });
        }
        
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'מק"ט זה כבר קיים במערכת'
            });
        }

        res.status(500).json({
            message: 'שגיאה בעדכון המוצר',
            error: error.message
        });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'המוצר לא נמצא' });
        }
        
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'המוצר נמחק בהצלחה' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'שגיאה במחיקת המוצר' });
    }
});

// Get product by SKU
router.get('/:sku', async (req, res) => {
    try {
        const product = await Product.findOne({ sku: req.params.sku });
        if (!product) {
            return res.status(404).json({ error: 'המוצר לא נמצא' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'שגיאה בטעינת המוצר' });
    }
});

module.exports = router; 