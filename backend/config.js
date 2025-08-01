// config.js - קובץ קונפיגורציה ל-backend
// מרכז את כל משתני הסביבה הדרושים לשרת

module.exports = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://duet-user:sTrongDuet888@cluster0.mongodb.net/duet?retryWrites=true&w=majority', // URI של MongoDB
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin', // שם משתמש מנהל
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin', // סיסמת מנהל
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret', // סוד ליצירת JWT
  PORT: process.env.PORT || 3000, // פורט להרצת השרת
  NODE_ENV: process.env.NODE_ENV || 'development', // סביבת הרצה
}; 