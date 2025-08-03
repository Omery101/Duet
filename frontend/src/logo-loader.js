document.addEventListener('DOMContentLoaded', () => {
  const logo = document.getElementById('logo');
  if (logo) {
    const API_BASE_URL = window.location.hostname.includes('localhost')
      ? 'http://localhost:3000'
      : 'https://duet-backend-peac.onrender.com';

    logo.src = `${API_BASE_URL}/uploads/logo/Logo-Duet.jpg`;
  }
});
