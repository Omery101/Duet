// טיפול בתפריט המבורגר וסקציות + נגן מוזיקה
document.addEventListener('DOMContentLoaded', function() {
    // --- Music Player ---
    const musicToggle = document.getElementById('musicToggle');
    const backgroundMusic = document.getElementById('backgroundMusic');
    const nextTrackButton = document.getElementById('nextTrack');
    const musicIcon = musicToggle?.querySelector('i');
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

    function showMessage(message, type = 'track') {
        if (type === 'track') {
            const existingMessage = document.querySelector('.track-message');
            if (existingMessage) existingMessage.remove();
            const messageDiv = document.createElement('div');
            messageDiv.className = 'track-message';
            messageDiv.innerHTML = `<i class="fas fa-music"></i><span>${message}</span>`;
            document.body.appendChild(messageDiv);
            setTimeout(() => messageDiv.classList.add('show'), 10);
            setTimeout(() => {
                messageDiv.classList.remove('show');
                setTimeout(() => messageDiv.remove(), 300);
            }, 3000);
            return;
        }
    }

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
                showMessage('לא ניתן להפעיל את המוזיקה', 'error');
            });
        }
        localStorage.setItem('currentTrackIndex', currentTrackIndex);
        const trackName = tracks[currentTrackIndex].split('/').pop().replace('.mp3', '');
        showMessage(`מנגן: ${trackName}`, 'track');
    }

    function initializeMusicPlayer() {
        if (!backgroundMusic || !musicToggle) return;
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
        updateMusicIcon();
        if (isMusicPlaying) {
            const playPromise = backgroundMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    isMusicPlaying = false;
                    updateMusicIcon();
                });
            }
        }
        backgroundMusic.addEventListener('ended', playNextTrack);
        musicToggle.addEventListener('click', function() {
            if (isMusicPlaying) {
                backgroundMusic.pause();
                isMusicPlaying = false;
            } else {
                backgroundMusic.play().catch(() => {});
                isMusicPlaying = true;
            }
            updateMusicIcon();
            localStorage.setItem('musicPlaying', isMusicPlaying);
        });
        if (nextTrackButton) {
            nextTrackButton.addEventListener('click', function() {
                if (!isMusicPlaying) {
                    isMusicPlaying = true;
                    updateMusicIcon();
                    localStorage.setItem('musicPlaying', true);
                }
                playNextTrack();
            });
        }
        window.addEventListener('beforeunload', function() {
            localStorage.setItem('musicPlaying', isMusicPlaying);
            localStorage.setItem('currentTrackIndex', currentTrackIndex);
            localStorage.setItem('currentTime', backgroundMusic.currentTime);
        });
    }
    initializeMusicPlayer();

    // --- Existing Hamburger & Section Code ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const mainNav = document.getElementById('mainNav');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
        const currentPage = window.location.pathname;
        document.querySelectorAll('.nav-links a').forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });
    }
    // טיפול בלחיצות על כותרות סקציות
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