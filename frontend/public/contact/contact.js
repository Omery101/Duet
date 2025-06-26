// Constants
// API_BASE_URL הוסר - משתמשים בנתיבים יחסיים ישירות

    // פונקציה להצגת הודעות
    function showMessage(message, type = 'info') {
        // אם זו הודעת החלפת שיר
        if (type === 'track') {
            const existingMessage = document.querySelector('.track-message');
            if (existingMessage) {
                existingMessage.remove();
            }

            const messageDiv = document.createElement('div');
            messageDiv.className = 'track-message';
            messageDiv.innerHTML = `
                <i class="fas fa-music"></i>
                <span>${message}</span>
            `;
            document.body.appendChild(messageDiv);

            // הפעלת האנימציה
            setTimeout(() => messageDiv.classList.add('show'), 10);

            // הסרת ההודעה אחרי 3 שניות
            setTimeout(() => {
                messageDiv.classList.remove('show');
                setTimeout(() => messageDiv.remove(), 300);
            }, 3000);
            return;
        }

        // הודעות רגילות (שגיאה, הצלחה וכו')
        const messageDiv = document.getElementById('messageDiv');
        if (!messageDiv) return;
        
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';

    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// שליחת טופס יצירת קשר
async function sendContactMessage(event) {
    event.preventDefault();
    
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    
    // בדיקת תקינות השדות
    if (!name || !email || !message) {
        showMessage('נא למלא את כל השדות החובה', 'error');
        return;
    }
    
    // בדיקת תקינות האימייל
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('נא להזין כתובת אימייל תקינה', 'error');
        return;
    }

            try {
        const response = await fetch('/api/contact/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
            body: JSON.stringify({ name, email, phone, message })
                });

                const data = await response.json();

        if (response.ok && data.success) {
            showMessage('ההודעה נשלחה בהצלחה', 'success');
            // ניקוי הטופס
            document.getElementById('contactForm').reset();
                } else {
                    throw new Error(data.message || 'שגיאה בשליחת ההודעה');
                }
            } catch (error) {
        console.error('שגיאה בשליחת ההודעה:', error);
        showMessage(error.message || 'שגיאה בשליחת ההודעה. אנא נסה שוב מאוחר יותר.', 'error');
            }
}

// פונקציה להצגת הסקשנים באנימציה
function animateSections() {
    const sections = document.querySelectorAll('.section-content');
    
    // הסרת האפשרות ללחיצה על הסקשנים
    document.querySelectorAll('.section-header').forEach(header => {
        header.style.cursor = 'default';
        header.onclick = null;
    });

    // הסתרת החצים
    document.querySelectorAll('.section-header i.fa-chevron-down').forEach(icon => {
        icon.style.display = 'none';
    });

    // הצגת כל הסקשנים באנימציה
    sections.forEach((section, index) => {
        // הסרת המאפיינים שמסתירים את התוכן
        section.style.maxHeight = 'none';
        section.style.overflow = 'visible';
        section.style.display = 'block';
        
        // הוספת אנימציה
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        // הפעלת האנימציה עם השהייה
        setTimeout(() => {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, index * 300); // השהייה של 300ms בין כל סקשן
    });
}

// אתחול כל הפונקציונליות
document.addEventListener('DOMContentLoaded', function() {
    // Navigation elements
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const mainNav = document.getElementById('mainNav');

    // Music player elements
    const musicToggle = document.getElementById('musicToggle');
    const backgroundMusic = document.getElementById('backgroundMusic');
    const musicIcon = musicToggle?.querySelector('i');

    // State variables
    let isMusicPlaying = false;
    let currentTrackIndex = 0;
    const tracks = [
        '/music/חנן בן ארי - בשורות טובות.mp3',
        '/music/בלדה לגמל.mp3',
        '/music/גלי עטרי - דרך ארוכה.mp3',
        '/music/כמעט כבר נוגע - יהודה פוליקר.mp3',
        '/music/אפרים ואסתר שמיר - ערב של יום בהיר.mp3',
        '/music/אריק סיני - דרך הכורכר.mp3'
    ];

    // Music Player Functions
    function updateMusicIcon() {
        if (musicIcon) {
            musicIcon.className = isMusicPlaying ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        }
    }

    function playNextTrack() {
        if (!backgroundMusic) return;
        
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        backgroundMusic.src = tracks[currentTrackIndex];
        
        if (isMusicPlaying) {
            backgroundMusic.play().catch(error => {
                console.error('שגיאה בהשמעת השיר:', error);
                showMessage('לא ניתן להפעיל את המוזיקה', 'error');
            });
        }
        
        // שמירת האינדקס הנוכחי
        localStorage.setItem('currentTrackIndex', currentTrackIndex);
        
        // הצגת הודעת החלפת שיר
        const trackName = tracks[currentTrackIndex].split('/').pop().replace('.mp3', '');
        showMessage(`מנגן: ${trackName}`, 'track');
    }

    function initializeMusicPlayer() {
        if (!backgroundMusic || !musicToggle) return;
        
        // Load saved state
        const savedTrackIndex = localStorage.getItem('currentTrackIndex');
        const savedMusicState = localStorage.getItem('musicPlaying');
        const savedTime = localStorage.getItem('currentTime');

        if (savedTrackIndex) {
            currentTrackIndex = parseInt(savedTrackIndex);
            backgroundMusic.src = tracks[currentTrackIndex];
        }

        if (savedTime) {
            backgroundMusic.currentTime = parseFloat(savedTime);
        }

        if (savedMusicState !== null) {
            isMusicPlaying = savedMusicState === 'true';
        }

        // Initial music state
        updateMusicIcon();
        if (isMusicPlaying) {
            const playPromise = backgroundMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Cannot autoplay music:', error);
                    isMusicPlaying = false;
                    updateMusicIcon();
                });
            }
        }

        // Next track handling
        backgroundMusic.addEventListener('ended', playNextTrack);

        // Toggle music
        musicToggle.addEventListener('click', function() {
            if (isMusicPlaying) {
                backgroundMusic.pause();
                isMusicPlaying = false;
            } else {
                backgroundMusic.play().catch(error => {
                    console.log('אין אפשרות להפעיל את המוזיקה:', error);
                });
                isMusicPlaying = true;
            }
            updateMusicIcon();
            localStorage.setItem('musicPlaying', isMusicPlaying);
        });

        // Next track button
        const nextTrackButton = document.getElementById('nextTrack');
        if (nextTrackButton) {
            nextTrackButton.addEventListener('click', function() {
                // אם המוזיקה לא מנגנת, נפעיל אותה
                if (!isMusicPlaying) {
                    isMusicPlaying = true;
                    updateMusicIcon();
                    localStorage.setItem('musicPlaying', true);
                }
                playNextTrack();
            });
        }

        // Save state before leaving
        window.addEventListener('beforeunload', function() {
            localStorage.setItem('musicPlaying', isMusicPlaying);
            localStorage.setItem('currentTrackIndex', currentTrackIndex);
            localStorage.setItem('currentTime', backgroundMusic.currentTime);
        });
    }

    // טיפול בתפריט המבורגר
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

        // סימון הקישור הנוכחי בתפריט
        const currentPage = window.location.pathname;
        document.querySelectorAll('.nav-links a').forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });
    }

    // טיפול בסקציות
    const sections = document.querySelectorAll('.section-content');
    const sectionHeaders = document.querySelectorAll('.section-header');
    
    // Initialize all sections as collapsed
    sections.forEach(section => {
        section.style.maxHeight = '0';
    });

    // Add click handlers to all section headers
    sectionHeaders.forEach(header => {
        header.addEventListener('click', function(e) {
            e.stopPropagation();
            const section = this.parentElement;
            const content = section.querySelector('.section-content');
            const icon = this.querySelector('i');

            // Toggle the active class
            content.classList.toggle('active');
            
            // Rotate the icon
            if (icon) {
                icon.style.transform = content.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
            }
            
            // Set max-height
            content.style.maxHeight = content.classList.contains('active') ? content.scrollHeight + 'px' : '0';
        });
    });

    // טיפול בטופס יצירת קשר
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', sendContactMessage);
    }

    // Initialize all functionality
    function initialize() {
        initializeMusicPlayer();
        animateSections();
    }

    // Start initialization
    initialize();
});