const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const fs = require('fs');

// נתיב לקובץ ה-JSON
const DB_FILE = 'db.json';

// פונקציות עזר לקריאה וכתיבה ל-JSON
function readDB() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { products: [], categories: [], orders: [] };
    }
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// הגדרת שולח המייל
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.ADMIN_EMAIL, // כתובת המייל של האדמין
        pass: process.env.ADMIN_EMAIL_PASSWORD // סיסמת המייל של האדמין
    }
});

// קבלת הזמנה חדשה
router.post('/', async (req, res) => {
    try {
        const order = req.body;
        
        // בדיקת שדות חובה
        if (!order.customerName || !order.email || !order.phone || !order.address) {
            return res.status(400).json({ 
                message: 'כל השדות חובה למעט הערות' 
            });
        }

        // שמירת ההזמנה בדאטהבייס
        const db = readDB();
        if (!db.orders) {
            db.orders = [];
        }
        db.orders.push(order);
        writeDB(db);

        // יצירת תוכן המייל
        const emailContent = `
            <h2>הזמנה חדשה</h2>
            <p><strong>מספר הזמנה:</strong> ${order.id}</p>
            <p><strong>תאריך:</strong> ${new Date(order.date).toLocaleString('he-IL')}</p>
            <h3>פרטי לקוח:</h3>
            <p><strong>שם:</strong> ${order.customerName}</p>
            <p><strong>דוא"ל:</strong> ${order.email}</p>
            <p><strong>טלפון:</strong> ${order.phone}</p>
            <p><strong>כתובת:</strong> ${order.address}</p>
            ${order.notes ? `<p><strong>הערות:</strong> ${order.notes}</p>` : ''}
            <h3>פריטים בהזמנה:</h3>
            <ul>
                ${order.items.map(item => `
                    <li>
                        ${item.name} - כמות: ${item.quantity}
                    </li>
                `).join('')}
            </ul>
        `;

        // שליחת המייל לאדמין
        await transporter.sendMail({
            from: process.env.ADMIN_EMAIL,
            to: process.env.ADMIN_EMAIL,
            subject: `הזמנה חדשה - ${order.id}`,
            html: emailContent
        });

        // שליחת מייל אישור ללקוח
        await transporter.sendMail({
            from: process.env.ADMIN_EMAIL,
            to: order.email,
            subject: 'אישור הזמנה - Duet',
            html: `
                <h2>תודה על הזמנתך!</h2>
                <p>ההזמנה שלך התקבלה בהצלחה.</p>
                <p>מספר ההזמנה שלך הוא: ${order.id}</p>
                <p>נציג שלנו יצור איתך קשר בהקדם.</p>
            `
        });

        res.status(201).json({
            message: 'ההזמנה נשלחה בהצלחה',
            orderId: order.id
        });

    } catch (error) {
        console.error('שגיאה בשליחת ההזמנה:', error);
        res.status(500).json({ 
            message: 'שגיאה בשליחת ההזמנה',
            error: error.message 
        });
    }
});

module.exports = router; 