const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const Contact = require('../models/Contact');

// הגדרת סכמת MongoDB
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' }
});

// הגדרת שולח המייל
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// שליחת הודעת יצירת קשר
router.post('/', async (req, res) => {
    try {
        const contact = new Contact(req.body);
        await contact.save();
        res.status(201).json({ message: 'ההודעה נשלחה בהצלחה', contact });
    } catch (err) {
        res.status(400).json({ message: 'שגיאה בשליחת ההודעה', error: err.message });
    }
});

// קבלת כל ההודעות (למנהל)
router.get('/', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ message: 'שגיאה בקבלת ההודעות', error: err.message });
    }
});

// עדכון סטטוס הודעה
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: Date.now() },
            { new: true }
        );
        if (!contact) {
            return res.status(404).json({ message: 'ההודעה לא נמצאה' });
        }
        res.json(contact);
    } catch (err) {
        res.status(400).json({ message: 'שגיאה בעדכון סטטוס ההודעה', error: err.message });
    }
});

// מחיקת הודעה
router.delete('/:id', async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        if (!contact) {
            return res.status(404).json({ message: 'ההודעה לא נמצאה' });
        }
        res.json({ message: 'ההודעה נמחקה בהצלחה' });
    } catch (err) {
        res.status(500).json({ message: 'שגיאה במחיקת ההודעה', error: err.message });
    }
});

module.exports = router; 