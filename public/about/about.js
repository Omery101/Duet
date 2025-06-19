// טיפול בתפריט המבורגר
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // סגירת התפריט בלחיצה על קישור
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // סגירת התפריט בלחיצה מחוץ לתפריט
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }

    // טיפול בלחיצות על כותרות
    const sections = document.querySelectorAll('.about-section');
    sections.forEach(section => {
        section.addEventListener('click', () => {
            // סגירת כל הסקציות האחרות
            sections.forEach(otherSection => {
                if (otherSection !== section) {
                    otherSection.classList.remove('active');
                }
            });
            // פתיחת/סגירת הסקציה הנוכחית
            section.classList.toggle('active');
        });
    });
});