# הוראות פריסה - Duet Admin Server

## הגדרת סביבות

### סביבת פיתוח
```bash
cd backend
npm install
npm run dev
```

### סביבת פרודקשן
```bash
cd backend
npm install --production
npm start
```

## קבצי סביבה
- יש להשתמש רק בקובץ `.env` (העתק מ-`.env.example` ומלא ערכים מתאימים)
- אין קבצי סביבה כפולים
- אין להעלות קבצי סביבה ל-git

### דוגמה ל-.env.example
```env
MONGODB_URI=mongodb://localhost:27017/duet
ADMIN_USERNAME=admin@email.com
ADMIN_PASSWORD=your-strong-password
JWT_SECRET=your-very-strong-secret
PORT=3000
NODE_ENV=development
```

## ניהול קבצים (Multer)
- כל התמונות נשמרות אוטומטית ל-`public/uploads/products/` //Development
- כל התמונות עולות לענן Cloudinary // Production
- אין צורך להגדיר ידנית את התיקיות
- ודא שלשרת יכול לכתוב לתיקיית uploads

## הבדלים בין סביבות
| הגדרה | פיתוח | פרודקשן |
|--------|--------|----------|
| MongoDB | מקומי | Atlas/Cloud |
| פורט | 3000 | 8080 |
| JWT תוקף | 24 שעות | 1 שעה |
| הצגת שגיאות | כן | לא |
| Rate Limiting | לא | כן |
| Logging | Debug | Error |

## פריסה לשרת

### 1. הכנת השרת
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2
```

### 2. העתקת הפרויקט
```bash
git clone <repository-url>
cd Duet/backend
npm install
```

### 3. הגדרת משתני סביבה
```bash
cp .env.example .env
nano .env
```

### 4. הפעלת השרת
```bash
pm2 start server.js --name "duet-server" --env production
# או
NODE_ENV=production npm start
```

### 5. הגדרת Nginx (אופציונלי)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## אבטחה
- אין סיסמאות ברירת מחדל
- אין קוד legacy או db.json
- אימות JWT לכל פעולות ניהול
- Rate limiting למניעת התקפות
- הצפנת סיסמאות עם bcrypt
- ודא הרשאות כתיבה ל-uploads

### 1. HTTPS
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 2. Firewall
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 3. עדכון סיסמאות
- שנה את `ADMIN_PASSWORD` לסיסמה חזקה
- שנה את `JWT_SECRET` למפתח מורכב
- השתמש בסיסמאות שונות לכל שירות

## מעקב וניטור

### 1. לוגים
```bash
pm2 logs duet-server
```

### 2. ביצועים
```bash
pm2 monit
```

### 3. גיבוי
```bash
mongodump --uri="mongodb+srv://..." --out=/backup/$(date +%Y%m%d)
```

## פתרון בעיות

### שגיאת חיבור ל-MongoDB
- וודא שה-URI נכון
- בדוק שהרשת מאפשרת חיבור
- וודא שהמשתמש והסיסמה נכונים

### שגיאת הרשאות
- בדוק הרשאות קבצים
- ודא שהשרת יכול לכתוב לתיקיית uploads

### שגיאת פורט
- וודא שהפורט פנוי
- בדוק הגדרות Firewall

---
למידע נוסף ראה README.md הראשי של הפרויקט. 