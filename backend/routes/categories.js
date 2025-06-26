const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'שגיאה בטעינת הקטגוריות' });
    }
});

// Add new category
router.post('/', async (req, res) => {
    try {
        const { name, code } = req.body;
        
        if (!name || !code) {
            return res.status(400).json({ error: 'שם וקוד קטגוריה הם שדות חובה' });
        }

        const existingCategory = await Category.findOne({ code });
        if (existingCategory) {
            return res.status(400).json({ error: 'קוד קטגוריה כבר קיים במערכת' });
        }

        const category = new Category({
            name,
            code
        });

        await category.save();
        res.status(201).json(category);
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ error: 'שגיאה בהוספת הקטגוריה' });
    }
});

// Update category
router.put('/:categoryCode', async (req, res) => {
    try {
        const { name, code } = req.body;
        const category = await Category.findOne({ code: req.params.categoryCode });
        
        if (!category) {
            return res.status(404).json({ error: 'הקטגוריה לא נמצאה' });
        }

        // בדיקה אם קוד חדש כבר קיים בקטגוריה אחרת
        if (code && code !== category.code) {
            const existing = await Category.findOne({ code });
            if (existing) {
                return res.status(400).json({ error: 'קוד קטגוריה כבר קיים במערכת' });
            }
            category.code = code;
        }

        if (name) category.name = name;

        await category.save();
        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'שגיאה בעדכון הקטגוריה' });
    }
});

// Delete category
router.delete('/:categoryCode', async (req, res) => {
    try {
        const category = await Category.findOne({ code: req.params.categoryCode });
        if (!category) {
            return res.status(404).json({ error: 'הקטגוריה לא נמצאה' });
        }

        await Category.deleteOne({ code: req.params.categoryCode });
        res.json({ message: 'הקטגוריה נמחקה בהצלחה' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'שגיאה במחיקת הקטגוריה' });
    }
});

// Get category by code
router.get('/:categoryCode', async (req, res) => {
    try {
        const category = await Category.findOne({ code: req.params.categoryCode });
        if (!category) {
            return res.status(404).json({ error: 'הקטגוריה לא נמצאה' });
        }
        res.json(category);
    } catch (error) {
        console.error('Error getting category:', error);
        res.status(500).json({ error: 'שגיאה בטעינת הקטגוריה' });
    }
});

module.exports = router; 