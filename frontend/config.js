// config.js - קובץ קונפיגורציה ל-frontend
// קונפיגורציה דינמית מהשרת עם ערכי ברירת מחדל

// ערכי ברירת מחדל
const DEFAULT_CONFIG = {
  API_BASE_URL: 'http://localhost:3000/api',
  UPLOADS_PATH: '/uploads/',
  NODE_ENV: 'development'
};

// פונקציה לטעינת קונפיגורציה מהשרת
async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const serverConfig = await response.json();
      return { ...DEFAULT_CONFIG, ...serverConfig };
    }
  } catch (error) {
    console.warn('לא ניתן לטעון קונפיגורציה מהשרת, משתמש בערכי ברירת מחדל:', error);
  }
  return DEFAULT_CONFIG;
}

// ייצוא הקונפיגורציה
export { loadConfig, DEFAULT_CONFIG };
export default DEFAULT_CONFIG; 