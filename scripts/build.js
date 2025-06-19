const fs = require('fs-extra');
const path = require('path');

// הגדרת נתיבים
const sourceDir = path.join(__dirname, '..', 'Duet');
const targetDir = path.join(__dirname, '..', 'public');

// פונקציה להעתקת תיקייה
async function copyDirectory(src, dest) {
    try {
        await fs.copy(src, dest, {
            filter: (src) => {
                // התעלם מתיקיית .git
                return !src.includes('.git');
            }
        });
        console.log(`✅ העתקה מ-${src} ל-${dest} הושלמה בהצלחה`);
    } catch (err) {
        console.error(`❌ שגיאה בהעתקה מ-${src} ל-${dest}:`, err);
        process.exit(1);
    }
}

// פונקציה ראשית
async function build() {
    console.log('🚀 מתחיל תהליך בנייה...');
    
    try {
        // בדיקה שהתיקייה המקורית קיימת
        if (!fs.existsSync(sourceDir)) {
            throw new Error(`התיקייה המקורית ${sourceDir} לא קיימת`);
        }

        // יצירת תיקיית public אם לא קיימת
        if (!fs.existsSync(targetDir)) {
            await fs.mkdir(targetDir);
            console.log(`📁 נוצרה תיקיית ${targetDir}`);
        }

        // העתקת הקבצים
        await copyDirectory(sourceDir, targetDir);
        
        console.log('✨ תהליך הבנייה הושלם בהצלחה!');
    } catch (err) {
        console.error('❌ שגיאה בתהליך הבנייה:', err);
        process.exit(1);
    }
}

// הרצת הפונקציה הראשית
build(); 