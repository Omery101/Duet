# Duet Backend

זהו השרת האחורי של מערכת Duet לניהול חנות מקוונת.

## מבנה התיקייה

```
backend/
├── server.js           # קובץ השרת הראשי
├── routes/             # נתיבי API
│   ├── products.js     # ניהול מוצרים
│   ├── orders.js       # ניהול הזמנות
│   ├── categories.js   # ניהול קטגוריות
│   ├── contact.js      # ניהול יצירת קשר
│   └── admin.js        # נתיבי ניהול מאובטחים
├── models/             # מודלים של MongoDB
│   ├── Product.js      # מודל מוצר
│   ├── Order.js        # מודל הזמנה
│   ├── Category.js     # מודל קטגוריה
│   └── Contact.js      # מודל יצירת קשר
├── .env.example        # דוגמה למשתני סביבה
├── package.json        # תלויות הפרויקט
└── DEPLOYMENT.md       # הוראות פריסה
```

## התקנה והפעלה

1. התקנת תלויות:
```bash
npm install
```

2. הגדרת משתני סביבה:
- העתק את `.env.example` ל-`.env` ומלא את הערכים הנדרשים
- לפיתוח: `npm run dev`
- לייצור: `npm start`

3. הפעלת השרת:
```bash
# לפיתוח
npm run dev

# לייצור
npm start
```

## קבצי סביבה
- `.env.example` מכיל את כל המשתנים הנדרשים (MONGODB_URI, ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET, PORT, NODE_ENV)
- אין לשים קבצי סביבה ב-git

## ניהול קבצים (Multer)
- העלאת תמונות נשמרת אוטומטית ל-`public/uploads/products/`
- אין צורך להגדיר ידנית את התיקיות

## API Endpoints

### מוצרים
- `GET /api/products` - קבלת כל המוצרים
- `POST /api/products` - הוספת מוצר חדש (דורש JWT)
- `PUT /api/products/:id` - עדכון מוצר (דורש JWT)
- `DELETE /api/products/:id` - מחיקת מוצר (דורש JWT)

### הזמנות
- `GET /api/orders` - קבלת כל ההזמנות
- `POST /api/orders` - יצירת הזמנה חדשה
- `PUT /api/orders/:id` - עדכון הזמנה
- `DELETE /api/orders/:id` - מחיקת הזמנה

### קטגוריות
- `GET /api/categories` - קבלת כל הקטגוריות
- `POST /api/categories` - הוספת קטגוריה חדשה (דורש JWT)
- `PUT /api/categories/:id` - עדכון קטגוריה (דורש JWT)
- `DELETE /api/categories/:id` - מחיקת קטגוריה (דורש JWT)

### ניהול
- `POST /api/admin/login` - התחברות מנהל
- `GET /api/admin/verify` - בדיקת תקינות טוקן

### יצירת קשר
- `POST /api/contact` - שליחת הודעת יצירת קשר

## אבטחה
- אימות JWT לכל פעולות ניהול
- Rate limiting למניעת התקפות
- הצפנת סיסמאות עם bcrypt
- אימות קלט בכל הנתיבים
- אין קוד legacy או db.json

## טכנולוגיות
- **Node.js** - סביבת ריצה
- **Express** - מסגרת עבודה
- **MongoDB** - בסיס נתונים
- **Mongoose** - ODM
- **JWT** - אימות משתמשים
- **bcrypt** - הצפנת סיסמאות
- **multer** - ניהול קבצים

## פריסה
- ראה קובץ DEPLOYMENT.md להוראות מלאות לפריסה ואבטחה 