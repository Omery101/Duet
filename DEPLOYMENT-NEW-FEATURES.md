# הוראות פריסה לפיצ'רים החדשים - Duet Admin

## פיצ'רים חדשים שנוספו

### 1. ניתוק אוטומטי לאחר 10 דקות של חוסר פעילות
### 2. שגיאה לאינדיקציה על הקלדה בעברית
### 3. אפשרות להצגת סיסמה
### 4. צ'ק בוקס "הישאר מחובר"

## קבצים שעודכנו

### Frontend (קבצים סטטיים)
```
frontend/public/admin/
├── admin.html          # טופס התחברות מעודכן
├── admin.css           # עיצוב חדש
├── admin.js            # לוגיקה חדשה
└── test-features.html  # קובץ בדיקה
```

### Backend (שרת)
```
backend/
├── server.js           # CORS מעודכן + נקודות קצה חדשות
└── config.js           # קונפיגורציה (לא השתנה)
```

## הוראות פריסה

### שלב 1: העתקת קבצים לשרת הפרודקשן

```bash
# העתקת קבצי frontend
scp -r frontend/public/admin/* user@your-server:/path/to/Duet/frontend/public/admin/

# או אם אתה משתמש ב-Git
git add .
git commit -m "Add new admin features: auto-logout, password visibility, hebrew validation, remember me"
git push origin main
```

### שלב 2: עדכון השרת

```bash
# התחברות לשרת
ssh user@your-server

# מעבר לתיקיית הפרויקט
cd /path/to/Duet

# משיכת השינויים
git pull origin main

# התקנת תלויות (אם יש)
npm install

# הפעלה מחדש של השרת
pm2 restart duet-server
```

### שלב 3: בדיקת הפיצ'רים

```bash
# בדיקת גרסה
curl https://yourdomain.com/api/version

# בדיקת קונפיגורציה
curl https://yourdomain.com/api/config
```

## בדיקות בסביבת הפרודקשן

### 1. בדיקת ניתוק אוטומטי
- התחבר למערכת
- אל תבצע פעולות במשך 10 דקות
- וודא שמופיעה אזהרה אחרי 10 דקות
- וודא שהמערכת מתנתקת אחרי 30 שניות נוספות

### 2. בדיקת ולידציה עברית
- נסה להקליד סיסמה בעברית
- וודא שמופיעה הודעת שגיאה
- וודא שהטופס לא נשלח

### 3. בדיקת הצגת סיסמה
- לחץ על כפתור העין
- וודא שהסיסמה מוצגת/מוסתרת
- וודא שהאייקון משתנה

### 4. בדיקת "הישאר מחובר"
- סמן את הצ'ק בוקס
- התחבר למערכת
- וודא שהטיימר לא פועל
- וודא שההעדפה נשמרת

## פתרון בעיות

### בעיה: הפיצ'רים לא עובדים
**פתרון:**
1. בדוק שהקבצים הועתקו נכון
2. בדוק שהשרת הופעל מחדש
3. בדוק את ה-console בדפדפן לשגיאות JavaScript

### בעיה: CORS errors
**פתרון:**
1. וודא שה-domain נכון ב-CORS
2. בדוק את קובץ `server.js`
3. וודא שה-Origin נכון

### בעיה: localStorage לא עובד
**פתרון:**
1. בדוק שהדפדפן תומך ב-localStorage
2. וודא שאין בעיות HTTPS
3. בדוק הגדרות פרטיות בדפדפן

## הגדרות סביבה

### .env.production
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/duet
ADMIN_USERNAME=admin@yourdomain.com
ADMIN_PASSWORD=strong-password
JWT_SECRET=super-strong-jwt-secret
PORT=8080
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

## מעקב וניטור

### לוגים
```bash
# צפייה בלוגים
pm2 logs duet-server

# מעקב אחר שגיאות
pm2 logs duet-server --err
```

### בדיקת זיכרון
```bash
# בדיקת שימוש בזיכרון
pm2 monit
```

## גיבוי

### גיבוי קבצים
```bash
# גיבוי קבצי admin
tar -czf admin-backup-$(date +%Y%m%d).tar.gz frontend/public/admin/
```

### גיבוי הגדרות
```bash
# גיבוי קבצי סביבה
cp .env.production .env.production.backup
```

## אבטחה

### בדיקות אבטחה
1. וודא שה-JWT_SECRET חזק
2. בדוק שה-ADMIN_PASSWORD חזק
3. וודא שה-CORS מוגדר נכון
4. בדוק שה-HTTPS מופעל

### עדכונים
- עקוב אחר עדכוני אבטחה
- עדכן תלויות באופן קבוע
- בדוק לוגים לשגיאות אבטחה 