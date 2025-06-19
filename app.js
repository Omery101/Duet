const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// חיבור ל-MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('מחובר ל-MongoDB'))
.catch(err => console.error('שגיאה בחיבור ל-MongoDB:', err));

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/contact', require('./routes/contact'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));

// טיפול בשגיאות
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'שגיאת שרת',
        error: process.env.NODE_ENV === 'development' ? err.message : 'שגיאה פנימית'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`השרת פועל על פורט ${PORT}`);
}); 