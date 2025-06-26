const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'כתובת אימייל לא תקינה']
    },
    customerPhone: {
        type: String,
        required: true,
        trim: true
    },
    items: [{
        productId: {
            type: String,
            required: true
        },
        sku: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['new', 'processing', 'completed', 'cancelled'],
        default: 'new'
    },
    address: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// עדכון תאריך העדכון בכל שינוי
orderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// וידוא שהמודל משתמש בשם הקולקציה הנכון
const Order = mongoose.model('Order', orderSchema, 'orders');

module.exports = Order; 