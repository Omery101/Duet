# Duet - מערכת ניהול חנות מקוונת

## מבנה הפרויקט

```
Duet/
├── backend/            # שרת אחורי (Node.js + Express + MongoDB)
│   ├── server.js       # קובץ השרת הראשי
│   ├── routes/         # נתיבי API (products, orders, categories, contact, admin)
│   ├── models/         # מודלים של MongoDB (Product, Order, Category, Contact)
│   ├── .env.example    # דוגמה למשתני סביבה
│   └── DEPLOYMENT.md   # הוראות פריסה
│
├── frontend/           # צד לקוח (Frontend)
│   ├── public/         # תוכן סטטי קבוע (תמונות, מוזיקה, uploads)
│   ├── src/            # קבצי הפיתוח (HTML, JS, CSS)
│   ├── dist/           # תוצרי build
│   ├── scripts/        # סקריפטים לבנייה
│   ├── config.js       # קובץ קונפיגורציה ל-frontend
│   └── package.json    # קובץ הגדרות npm ל-frontend (אם יש)
│
├── package.json        # תלויות הפרויקט הראשי
├── DEPLOYMENT.md       # הוראות פריסה
└── .gitignore          # הגדרות גיט
```

## התקנה והפעלה

### Backend
1. כניסה לתיקיית backend:
```bash
cd backend
npm install
```
2. הגדרת משתני סביבה:
- העתק את `.env.example` ל-`.env` ומלא את הערכים הנדרשים
3. הפעלת השרת:
```bash
# לפיתוח
npm run dev
# לייצור
npm start
```

### Frontend
- קבצי הפיתוח נמצאים תחת `frontend/src/`
- קבצים סטטיים (תמונות, מוזיקה, uploads) תחת `frontend/public/`
- תוצרי build יופיעו תחת `frontend/dist/`
- הקבצים הסטטיים מוגשים אוטומטית מהשרת (אין צורך ב-build נפרד)

## קבצי סביבה
- `.env.example` מכיל את כל המשתנים הנדרשים (MONGODB_URI, ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET, PORT, NODE_ENV)
- אין לשים קבצי סביבה ב-git

## ניהול קבצים (Multer)
- העלאת תמונות נשמרת אוטומטית ל-`frontend/public/uploads/products/`
- אין צורך להגדיר ידנית את התיקיות

## אבטחה
- אימות JWT לכל פעולות ניהול
- Rate limiting למניעת התקפות
- הצפנת סיסמאות עם bcrypt
- אימות קלט בכל הנתיבים
- אין קוד legacy או db.json

## פריסה
- ראה קובץ DEPLOYMENT.md להוראות מלאות לפריסה ואבטחה

## טכנולוגיות
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **אבטחה**: JWT, bcrypt, rate-limiting, express-validator
- **ניהול קבצים**: multer
- **UI**: Font Awesome, Custom CSS
- **ניהול סביבות**: dotenv
- **בסיס נתונים**: MongoDB Atlas/Local 