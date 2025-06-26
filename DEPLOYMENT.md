# הוראות פריסה - Duet Admin Server

## הגדרת סביבות

### סביבת פיתוח
```bash
# הרצה עם nodemon (טעינה מחדש אוטומטית)
npm run dev

# הרצה עם קובץ סביבה ספציפי
npm run dev:env
```

### סביבת פרודקשן
```bash
# הרצה רגילה
npm start

# הרצה עם קובץ סביבה ספציפי
npm run prod:env
```

## קבצי סביבה

### .env.development
```env
MONGODB_URI=mongodb://localhost:27017/duet
ADMIN_USERNAME=duetnihul@gmail.com
ADMIN_PASSWORD=admin123
JWT_SECRET=dev-secret-key-change-in-production
PORT=3000
NODE_ENV=development
```

### .env.production
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/duet
ADMIN_USERNAME=duetnihul@gmail.com
ADMIN_PASSWORD=strong-production-password
JWT_SECRET=super-strong-production-jwt-secret-key-2024
PORT=8080
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_EMAIL_PASSWORD=admin-email-password
```

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
# התקנת Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# התקנת PM2
npm install -g pm2
```

### 2. העתקת הפרויקט
```bash
git clone <repository-url>
cd Duet
npm install
```

### 3. הגדרת משתני סביבה
```bash
# יצירת קובץ סביבה לפרודקשן
cp .env.development .env.production
# עריכת הקובץ עם ערכים נכונים
nano .env.production
```

### 4. הפעלת השרת
```bash
# עם PM2
pm2 start server.js --name "duet-server" --env production

# או עם npm
NODE_ENV=production npm run prod:env
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

### 1. HTTPS
```bash
# התקנת Certbot
sudo apt-get install certbot python3-certbot-nginx

# קבלת אישור SSL
sudo certbot --nginx -d yourdomain.com
```

### 2. Firewall
```bash
# פתיחת פורטים נדרשים
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
# צפייה בלוגים
pm2 logs duet-server

# או
tail -f logs/app.log
```

### 2. ביצועים
```bash
# מעקב אחר ביצועים
pm2 monit
```

### 3. גיבוי
```bash
# גיבוי בסיס נתונים
mongodump --uri="mongodb+srv://..." --out=/backup/$(date +%Y%m%d)
```

## פתרון בעיות

### שגיאת חיבור ל-MongoDB
- וודא שה-URI נכון
- בדוק שהרשת מאפשרת חיבור
- וודא שהמשתמש והסיסמה נכונים

### שגיאת הרשאות
- בדוק הרשאות קבצים
- וודא שהשרת יכול לכתוב לתיקיית uploads

### שגיאת פורט
- וודא שהפורט פנוי
- בדוק הגדרות Firewall 