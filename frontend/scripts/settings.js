import { showToast, toggleTheme } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  const sessionStr = localStorage.getItem('userSession');
  if (!sessionStr) {
    window.location.href = '/auth';
    return;
  }
  const user = JSON.parse(sessionStr);

  // DOM Elements
  const displayNameInput = document.getElementById('displayName');
  const bioInput = document.getElementById('bio');
  const avatarUploadBtn = document.getElementById('avatarUploadBtn');
  const avatarFileInput = document.getElementById('avatarFileInput');
  const avatarPreview = document.getElementById('avatarPreview');
  const avatarUploadMeta = document.getElementById('avatarUploadMeta');
  const accountEmail = document.getElementById('accountEmail');
  const profileSettingsForm = document.getElementById('profileSettingsForm');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  let avatarDataUrl = '';

  // New standardized nav elements
  const navHome = document.getElementById('navHome');
  const navProfileLink = document.getElementById('navProfileLink');
  const navSettings = document.getElementById('navSettings');
  const navBookmarks = document.getElementById('navBookmarks');
  const navThemeToggle = document.getElementById('navThemeToggle');
  const createBlogBtnNav = document.getElementById('createBlogBtnNav');

  navHome?.addEventListener('click', () => window.location.href = '/dashboard');
  navBookmarks?.addEventListener('click', () => window.location.href = '/dashboard#bookmarks');
  navProfileLink?.addEventListener('click', () => window.location.href = `/profile/${user.username}`);
  navSettings?.addEventListener('click', () => window.location.href = '/settings');
  navThemeToggle?.addEventListener('click', () => toggleTheme());
  createBlogBtnNav?.addEventListener('click', () => window.location.href = '/dashboard#create');

  // Load current values
  const loadUserSettings = async () => {
    try {
      const response = await fetch(`/api/users/${user.username}`);
      const result = await response.json();
      
      if (result.success) {
        const profile = result.data;
        displayNameInput.value = profile.displayName || '';
        bioInput.value = profile.bio || '';
        avatarDataUrl = profile.avatarUrl || '';

        if (avatarDataUrl) {
          avatarPreview.src = avatarDataUrl;
          avatarPreview.style.display = 'block';
          avatarUploadMeta.textContent = 'Current avatar loaded';
        }
        
        // Use user object email if stored (since public profile hides email for security)
        accountEmail.textContent = user.email || 'Registered account';
      }
    } catch (err) {
      console.warn('Failed to fetch full user profile updates', err);
    }
  };

  avatarUploadBtn?.addEventListener('click', () => avatarFileInput?.click());

  avatarFileInput?.addEventListener('change', () => {
    const file = avatarFileInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please choose an image file.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File Too Large', 'Avatar images must be 5MB or smaller.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      avatarDataUrl = String(reader.result || '');
      avatarPreview.src = avatarDataUrl;
      avatarPreview.style.display = 'block';
      avatarUploadMeta.textContent = file.name;
    };
    reader.readAsDataURL(file);
  });

  // Submit Profile Modifications
  profileSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      displayName: displayNameInput.value.trim(),
      bio: bioInput.value.trim(),
      avatarUrl: avatarDataUrl || null
    };

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.success) {
        // Update local session
        const updated = result.data.user;
        user.displayName = updated.displayName;
        user.avatarUrl = updated.avatarUrl;
        localStorage.setItem('userSession', JSON.stringify(user));
        
        showToast('Settings Saved', 'Your profile details have been successfully updated.', 'success');
      } else {
        showToast('Error', result.message || 'Failed to save settings.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network Error', 'Connection timed out while saving settings.', 'error');
    }
  });

  // Theme configuration toggle
  themeToggleBtn.addEventListener('click', () => {
    const nextTheme = toggleTheme();

    // Sync theme configuration with server account
    fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: nextTheme })
    }).catch(err => console.warn(err));

    showToast('Theme Changed', `Swapped to ${nextTheme} mode.`, 'info');
  });

  // Logout trigger
  logoutBtn.addEventListener('click', async () => {
    const confirmed = confirm('Are you sure you want to log out of your session?');
    if (!confirmed) return;

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        localStorage.removeItem('userSession');
        showToast('Logged Out', 'Successfully logged out.', 'info');
        setTimeout(() => {
          window.location.href = '/';
        }, 800);
      } else {
        showToast('Logout Error', result.message || 'Error occurred clearing cookies.', 'error');
      }
    } catch (err) {
      console.error(err);
      // Hard logout fallback anyway
      localStorage.removeItem('userSession');
      window.location.href = '/';
    }
  });

  await loadUserSettings();
});
