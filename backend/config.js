// config.js - קובץ קונפיגורציה ל-backend
// מרכז את כל משתני הסביבה הדרושים לשרת

module.exports = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/duet', // URI של MongoDB
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin', // שם משתמש מנהל
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin', // סיסמת מנהל
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret', // סוד ליצירת JWT
  PORT: process.env.PORT || 3000, // פורט להרצת השרת
  NODE_ENV: process.env.NODE_ENV || 'development', // סביבת הרצה
}; 