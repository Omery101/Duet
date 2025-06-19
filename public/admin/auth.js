// מודול אימות מנהלים
const auth = {
    isLoggedIn: false,
    currentUser: null,

    async login(username, password) {
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error('שם משתמש או סיסמה שגויים');
            }

            const data = await response.json();
            this.isLoggedIn = true;
            this.currentUser = data.user;
            localStorage.setItem('adminToken', data.token);
            return true;
        } catch (error) {
            console.error('שגיאת התחברות:', error);
            throw error;
        }
    },

    logout() {
        this.isLoggedIn = false;
        this.currentUser = null;
        localStorage.removeItem('adminToken');
        window.location.href = '/admin.html';
    },

    checkAuth() {
        const token = localStorage.getItem('adminToken');
        if (token) {
            this.isLoggedIn = true;
            return true;
        }
        return false;
    }
};

export default auth; 