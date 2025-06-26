const mongoose = require('mongoose');

const productTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    desc: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    sku: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    onSale: {
        type: Boolean,
        default: false
    },
    hasMultipleTypes: {
        type: Boolean,
        default: false
    },
    productTypes: [productTypeSchema],
    image: {
        type: String,
        default: null
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
productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // וידוא שיש תמונה ברירת מחדל אם יש סוגי מוצרים
    if (this.hasMultipleTypes && this.productTypes.length > 0) {
        const hasDefault = this.productTypes.some(type => type.isDefault);
        if (!hasDefault) {
            this.productTypes[0].isDefault = true;
        }
        // עדכון תמונת המוצר הראשית לתמונת ברירת המחדל
        const defaultType = this.productTypes.find(type => type.isDefault);
        if (defaultType) {
            this.image = defaultType.image;
        }
    }
    
    // וידוא שיש תיאור (desc או description)
    if (!this.desc && this.description) {
        this.desc = this.description;
    }
    if (!this.description && this.desc) {
        this.description = this.desc;
    }
    
    next();
});

// וירטואל פילד לקבלת התיאור
productSchema.virtual('displayDescription').get(function() {
    return this.desc || this.description || '';
});

const Product = mongoose.model('Product', productSchema, 'products');

module.exports = Product; 