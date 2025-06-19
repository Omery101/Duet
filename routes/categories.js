const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        const categoriesMap = {};
        categories.forEach(category => {
            categoriesMap[category.code] = {
                name: category.name,
                subcategories: category.subcategories
            };
        });
        res.json(categoriesMap);
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
            code,
            subcategories: []
        });

        await category.save();
        res.status(201).json(category);
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ error: 'שגיאה בהוספת הקטגוריה' });
    }
});

// Add subcategory
router.post('/:categoryCode/subcategories', async (req, res) => {
    try {
        const { name, code } = req.body;
        
        if (!name || !code) {
            return res.status(400).json({ error: 'שם וקוד תת-קטגוריה הם שדות חובה' });
        }

        const category = await Category.findOne({ code: req.params.categoryCode });
        if (!category) {
            return res.status(404).json({ error: 'הקטגוריה לא נמצאה' });
        }

        const existingSubcategory = category.subcategories.find(sub => sub.code === code);
        if (existingSubcategory) {
            return res.status(400).json({ error: 'קוד תת-קטגוריה כבר קיים בקטגוריה זו' });
        }

        category.subcategories.push({ name, code });
        await category.save();
        res.status(201).json(category);
    } catch (error) {
        console.error('Error adding subcategory:', error);
        res.status(500).json({ error: 'שגיאה בהוספת תת-קטגוריה' });
    }
});

// Update category
router.put('/:categoryCode', async (req, res) => {
    try {
        const { name, subcategories } = req.body;
        const category = await Category.findOne({ code: req.params.categoryCode });
        
        if (!category) {
            return res.status(404).json({ error: 'הקטגוריה לא נמצאה' });
        }

        if (name) category.name = name;
        if (subcategories) category.subcategories = subcategories;

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