const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
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

// Update the updatedAt timestamp before saving
categorySchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// וידוא שהמודל משתמש בשם הקולקציה הנכון
const Category = mongoose.model('Category', categorySchema, 'categories');

module.exports = Category; 