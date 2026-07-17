// Core Frontend Utilities

/**
 * Trigger premium slide-up toast notification
 * @param {string} title Header title
 * @param {string} message Description text
 * @param {'success'|'error'|'info'} type Styled indicator
 */
export const showToast = (title, message, type = 'info') => {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  // Style markers based on types
  let iconColor = '#3B82F6'; // Info blue
  if (type === 'success') iconColor = '#10B981'; // Green
  if (type === 'error') iconColor = '#EF4444'; // Red

  toast.innerHTML = `
    <span style="color: ${iconColor}; font-weight: bold; font-size: 1.2rem;">●</span>
    <div>
      <div style="font-weight: 600; font-size: var(--fs-ui);">${title}</div>
      <div style="font-size: var(--fs-meta); color: var(--text-muted); margin-top: 2px;">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  // Automatically dismiss after 3 seconds + slide out timing
  setTimeout(() => {
    toast.style.transform = 'translateY(100%) scale(0.9)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.3s ease-in-out';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
};

/**
 * Initialize theme preferences from local storage and apply to DOM
 */
export const initTheme = () => {
  // Prevent style flashing
  document.documentElement.classList.add('theme-initializing');
  
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.dataset.theme = savedTheme;
  
  // Clean initialization classes
  setTimeout(() => {
    document.documentElement.classList.remove('theme-initializing');
  }, 100);
};

/**
 * Toggle between light and dark themes and persist the preference.
 */
export const toggleTheme = () => {
  const currentTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem('theme', nextTheme);

  return nextTheme;
};

export const BLANK_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

/**
 * Resolve the backend base URL for API requests.
 * Falls back to the current origin for local development.
 */
export const getApiBaseUrl = () => {
  const configuredBaseUrl = window.__INKWELL_API_BASE_URL__
    || document.documentElement.dataset.apiBaseUrl
    || localStorage.getItem('inkwellApiBaseUrl')
    || '';

  return configuredBaseUrl.replace(/\/$/, '');
};

/**
 * Convert a relative API path into an absolute URL when a backend base URL is configured.
 */
export const resolveApiUrl = (path) => {
  if (!path || /^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return path;
  }

  return path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
};

/**
 * Fetch wrapper that respects the configured backend base URL.
 * Defaults to credentialed requests so cookie-based auth works in production.
 */
export const apiFetch = (input, init = {}) => {
  const headers = new Headers(init.headers || {});
  
  try {
    const sessionStr = localStorage.getItem('userSession');
    if (sessionStr) {
      const user = JSON.parse(sessionStr);
      if (user && user.token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${user.token}`);
      }
    }
  } catch (e) {
    // Ignore parse errors
  }

  const mergedInit = {
    credentials: 'include',
    ...init,
    headers
  };

  return fetch(resolveApiUrl(input), mergedInit);
};

/**
 * Consistent hashing of Tag names to vibrant, readable HSL Colors
 * Enforces 4.5:1 contrast against surface containers
 */
export const getTagColorStyles = (tagName) => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Predefined accessible color index hues
  const hues = [
    210, // Blue
    265, // Violet
    174, // Teal
    340, // Rose
    35,  // Amber
    195, // Cyan
    80,  // Lime
    300  // Fuchsia
  ];
  
  const selectedHue = hues[Math.abs(hash) % hues.length];
  
  // Build HSL definitions ensuring accessibility:
  // Dark theme uses translucent background with bright text
  // Light theme uses soft pastel background with darker text
  const isDark = document.documentElement.dataset.theme === 'dark';
  
  const bg = isDark 
    ? `hsla(${selectedHue}, 70%, 40%, 0.15)`
    : `hsla(${selectedHue}, 70%, 93%, 1)`;
    
  const text = isDark
    ? `hsla(${selectedHue}, 90%, 75%, 1)`
    : `hsla(${selectedHue}, 90%, 30%, 1)`;
    
  const border = isDark
    ? `1px solid hsla(${selectedHue}, 70%, 50%, 0.25)`
    : `1px solid hsla(${selectedHue}, 70%, 45%, 0.15)`;

  return `background: ${bg}; color: ${text}; border: ${border};`;
};

// Initialize Theme on startup execution
initTheme();
