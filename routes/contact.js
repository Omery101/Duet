const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const Contact = require('../models/contact');

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
router.post('/send', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        
        // שמירת ההודעה במסד הנתונים
        const contact = new Contact({
            name,
            email,
            phone,
            message,
            status: 'new'
        });
        await contact.save();

        // שליחת מייל למנהל
        const adminMailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: 'הודעה חדשה - יצירת קשר',
            html: `
                <h2>הודעה חדשה מאתר Duet</h2>
                <p><strong>שם:</strong> ${name}</p>
                <p><strong>אימייל:</strong> ${email}</p>
                <p><strong>טלפון:</strong> ${phone}</p>
                <p><strong>הודעה:</strong></p>
                <p>${message}</p>
            `
        };

        // שליחת מייל למשתמש
        const userMailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'קבלת הודעתך - Duet',
            html: `
                <h2>שלום ${name},</h2>
                <p>תודה שפנית אלינו. הודעתך התקבלה ותטופל בהקדם.</p>
                <p>פרטי ההודעה ששלחת:</p>
                <p><strong>הודעה:</strong></p>
                <p>${message}</p>
                <br>
                <p>בברכה,</p>
                <p>צוות Duet</p>
            `
        };

        // שליחת שני המיילים במקביל
        await Promise.all([
            transporter.sendMail(adminMailOptions),
            transporter.sendMail(userMailOptions)
        ]);

        res.json({ success: true, message: 'ההודעה נשלחה בהצלחה' });
    } catch (error) {
        console.error('שגיאה בשליחת הודעת יצירת קשר:', error);
        res.status(500).json({ 
            success: false, 
            message: 'שגיאה בשליחת ההודעה. אנא נסה שוב מאוחר יותר.' 
        });
    }
});

// קבלת כל הודעות יצירת הקשר
router.get('/', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        console.error('שגיאה בקבלת הודעות יצירת קשר:', error);
        res.status(500).json({ 
            success: false, 
            message: 'שגיאה בקבלת הודעות יצירת הקשר' 
        });
    }
});

// עדכון סטטוס הודעה
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!contact) {
            return res.status(404).json({ 
                success: false, 
                message: 'ההודעה לא נמצאה' 
            });
        }

        res.json({ 
            success: true, 
            message: 'סטטוס ההודעה עודכן בהצלחה',
            contact 
        });
    } catch (error) {
        console.error('שגיאה בעדכון סטטוס הודעה:', error);
        res.status(500).json({ 
            success: false, 
            message: 'שגיאה בעדכון סטטוס ההודעה' 
        });
    }
});

module.exports = router; 