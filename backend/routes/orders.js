const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// קבלת כל ההזמנות
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'שגיאה בקבלת ההזמנות', error: err.message });
    }
});

// יצירת הזמנה חדשה
router.post('/', async (req, res) => {
    try {
        const order = new Order(req.body);
        await order.save();
        res.status(201).json(order);
    } catch (err) {
        res.status(400).json({ message: 'שגיאה ביצירת ההזמנה', error: err.message });
    }
});

// קבלת הזמנה ספציפית
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'ההזמנה לא נמצאה' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'שגיאה בקבלת ההזמנה', error: err.message });
    }
});

// עדכון הזמנה
router.put('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!order) {
            return res.status(404).json({ message: 'ההזמנה לא נמצאה' });
        }
        res.json(order);
    } catch (err) {
        res.status(400).json({ message: 'שגיאה בעדכון ההזמנה', error: err.message });
    }
});

// עדכון סטטוס הזמנה
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: Date.now() },
            { new: true }
        );
        if (!order) {
            return res.status(404).json({ message: 'ההזמנה לא נמצאה' });
        }
        res.json(order);
    } catch (err) {
        res.status(400).json({ message: 'שגיאה בעדכון סטטוס ההזמנה', error: err.message });
    }
});

// מחיקת הזמנה
router.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'ההזמנה לא נמצאה' });
        }
        res.json({ message: 'ההזמנה נמחקה בהצלחה' });
    } catch (err) {
        res.status(500).json({ message: 'שגיאה במחיקת ההזמנה', error: err.message });
    }
});

module.exports = router; 