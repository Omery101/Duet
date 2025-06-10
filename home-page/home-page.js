// Constants
const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Navigation elements
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const mainNav = document.getElementById('mainNav');

    // Music player elements
    const musicToggle = document.getElementById('musicToggle');
    const backgroundMusic = document.getElementById('backgroundMusic');
    const musicIcon = musicToggle.querySelector('i');

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

    // Navigation Functions
    function initializeNavigation() {
        if (hamburger && navLinks) {
            // Toggle menu on hamburger click
            hamburger.addEventListener('click', function() {
                hamburger.classList.toggle('active');
                navLinks.classList.toggle('active');
            });

            // Close menu when clicking a link
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                }
            });

            // Mark active page
            const currentPage = window.location.pathname;
            document.querySelectorAll('.nav-links a').forEach(link => {
                if (link.getAttribute('href') === currentPage) {
                    link.classList.add('active');
                }
            });
        }
    }

    // Music Player Functions
    function updateMusicIcon() {
        musicIcon.className = isMusicPlaying ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    }

    function playNextTrack() {
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        const audio = document.getElementById('backgroundMusic');
        audio.src = tracks[currentTrackIndex];
        
        if (isMusicPlaying) {
            audio.play().catch(error => {
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
        nextTrackButton.addEventListener('click', function() {
            // אם המוזיקה לא מנגנת, נפעיל אותה
            if (!isMusicPlaying) {
                isMusicPlaying = true;
                updateMusicIcon();
                localStorage.setItem('musicPlaying', true);
            }
            playNextTrack();
            // הצגת הודעה על השיר הנוכחי
            const currentTrack = tracks[currentTrackIndex].split('/').pop().replace('.mp3', '');
            showMessage(`מנגן: ${currentTrack}`, 'info');
        });

        // Save state before leaving
        window.addEventListener('beforeunload', function() {
            localStorage.setItem('musicPlaying', isMusicPlaying);
            localStorage.setItem('currentTrackIndex', currentTrackIndex);
            localStorage.setItem('currentTime', backgroundMusic.currentTime);
        });
    }

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

    // Server Connection Functions
    async function checkServerConnection() {
        try {
            const response = await fetch(`${API_BASE_URL}/products`);
            if (!response.ok) {
                throw new Error('Server connection failed');
            }
            console.log('Server connection successful');
            return true;
        } catch (error) {
            console.error('Server connection error:', error);
            return false;
        }
    }

    // Initialize all functionality
    function initialize() {
        initializeNavigation();
        initializeMusicPlayer();
        checkServerConnection();
    }

    // Start initialization
    initialize();
}); 