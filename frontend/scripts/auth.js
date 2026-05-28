// Authentication Handlers
import { apiFetch, showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const authForm = document.getElementById('authForm');
  const authSubtitle = document.getElementById('authSubtitle');
  const authToggleBtn = document.getElementById('authToggleBtn');
  const toggleLinkContainer = document.getElementById('toggleLinkContainer');
  const submitBtn = document.getElementById('submitBtn');
  const passwordToggle = document.getElementById('passwordToggle');
  const authFormTitle = document.getElementById('authFormTitle');
  const registerFields = document.getElementById('registerFields');
  const socialGrid = document.getElementById('socialGrid');
  
  // Inputs
  const displayNameInput = document.getElementById('displayName');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  // Errors
  const displayNameError = document.getElementById('displayNameError');
  const usernameError = document.getElementById('usernameError');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');

  let isLoginState = false; // defaults to Register state

  // Check for URL parameters to set initial state
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');

  const clearInputErrors = () => {
    displayNameError.style.display = 'none';
    usernameError.style.display = 'none';
    emailError.style.display = 'none';
    passwordError.style.display = 'none';

    [displayNameInput, usernameInput, emailInput, passwordInput].forEach(inp => {
      inp.style.borderColor = '';
      inp.style.boxShadow = '';
    });
  };

  // Function to set the state
  const setAuthState = (toLogin) => {
    console.log('[Auth]: Transitioning to', toLogin ? 'Login' : 'Register');
    isLoginState = toLogin;
    
    // Clear inputs when toggling
    emailInput.value = '';
    passwordInput.value = '';
    if (displayNameInput) displayNameInput.value = '';
    if (usernameInput) usernameInput.value = '';

    if (isLoginState) {
      if (authFormTitle) authFormTitle.textContent = 'Sign In Account';
      authSubtitle.textContent = 'Enter your credentials to access your account.';
      submitBtn.textContent = 'Log In';
      toggleLinkContainer.innerHTML = `Don't have an account? <span id="authToggleBtn">Sign Up</span>`;
      if (registerFields) registerFields.style.display = 'none';
      
      // Remove required attributes on hidden fields to allow login
      if (displayNameInput) displayNameInput.required = false;
      if (usernameInput) usernameInput.required = false;
    } else {
      if (authFormTitle) authFormTitle.textContent = 'Sign Up Account';
      authSubtitle.textContent = 'Enter your personal data to create your account.';
      submitBtn.textContent = 'Sign Up';
      toggleLinkContainer.innerHTML = `Already have an account? <span id="authToggleBtn">Log in</span>`;
      if (registerFields) registerFields.style.display = 'grid';

      // Restore required attributes for registration
      if (displayNameInput) displayNameInput.required = true;
      if (usernameInput) usernameInput.required = true;
    }
    
    clearInputErrors();
    
    // Re-bind the toggle click event since innerHTML destroys it
    document.getElementById('authToggleBtn').addEventListener('click', () => {
      setAuthState(!isLoginState);
    });
  };

  // Set initial state based on URL
  if (mode === 'login') {
    setAuthState(true);
  } else {
    setAuthState(false);
  }

  // Password Visibility Toggle
  passwordToggle.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    
    // Update icon via innerHTML for the aesthetic eye icon
    passwordToggle.innerHTML = isPassword 
      ? `<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>`
      : `<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>`;
  });

  // Input Blur Validations
  displayNameInput.addEventListener('blur', () => {
    if (isLoginState) return;
    if (!displayNameInput.value.trim()) {
      showInputError(displayNameInput, displayNameError, 'Name is required');
    } else {
      clearInputError(displayNameInput, displayNameError);
    }
  });

  usernameInput.addEventListener('blur', () => {
    if (isLoginState) return;
    const val = usernameInput.value.trim();
    if (!val) {
      showInputError(usernameInput, usernameError, 'Username is required');
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(val)) {
      showInputError(usernameInput, usernameError, 'Username must be 3-20 characters, alphanumeric or underscores');
    } else {
      clearInputError(usernameInput, usernameError);
    }
  });

  emailInput.addEventListener('blur', () => {
    const val = emailInput.value.trim();
    if (!val) {
      showInputError(emailInput, emailError, 'Email address is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      showInputError(emailInput, emailError, 'Please enter a valid email address');
    } else {
      clearInputError(emailInput, emailError);
    }
  });

  passwordInput.addEventListener('blur', () => {
    if (isLoginState) return;
    const val = passwordInput.value;
    if (!val) {
      showInputError(passwordInput, passwordError, 'Password is required');
    } else if (val.length < 8 || !/[A-Z]/.test(val) || !/[0-9]/.test(val)) {
      showInputError(passwordInput, passwordError, 'Must contain at least 8 characters, 1 uppercase, and 1 number');
    } else {
      clearInputError(passwordInput, passwordError);
    }
  });

  const showInputError = (input, errorEl, msg) => {
    input.style.borderColor = '#EF4444';
    input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.2)';
    if (errorEl) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
    }
  };

  const clearInputError = (input, errorEl) => {
    input.style.borderColor = '';
    input.style.boxShadow = '';
    if (errorEl) errorEl.style.display = 'none';
  };

  // Explicit click handler for mobile or edge cases where submit event is finicky
  submitBtn.addEventListener('click', (e) => {
    console.log('[Auth]: Submit button clicked');
  });

  // Submit form trigger
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('[Auth]: Form submitted, isLoginState:', isLoginState);

    // Run custom validations before submitting
    let isValid = true;
    
    if (!isLoginState) {
      if (!displayNameInput.value.trim()) {
        showInputError(displayNameInput, displayNameError, 'Name is required');
        isValid = false;
      }
      const uVal = usernameInput.value.trim();
      if (!uVal) {
        showInputError(usernameInput, usernameError, 'Username is required');
        isValid = false;
      } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(uVal)) {
        showInputError(usernameInput, usernameError, 'Username must be 3-20 characters, alphanumeric or underscores');
        isValid = false;
      }
    }

    const eVal = emailInput.value.trim();
    if (!eVal) {
      showInputError(emailInput, emailError, 'Email address is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eVal)) {
      showInputError(emailInput, emailError, 'Please enter a valid email address');
      isValid = false;
    }

    const pVal = passwordInput.value;
    if (!pVal) {
      showInputError(passwordInput, passwordError, 'Password is required');
      isValid = false;
    } else if (!isLoginState && (pVal.length < 8 || !/[A-Z]/.test(pVal) || !/[0-9]/.test(pVal))) {
      showInputError(passwordInput, passwordError, 'Must contain at least 8 characters, 1 uppercase, and 1 number');
      isValid = false;
    }

    if (!isValid) return;

    // Ready to POST payload
    const endpoint = isLoginState ? '/api/auth/login' : '/api/auth/register';
    const payload = isLoginState 
      ? { email: eVal, password: pVal }
      : { username: usernameInput.value.trim(), email: eVal, password: pVal, displayName: displayNameInput.value.trim() };

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = isLoginState ? 'Logging In...' : 'Signing Up...';

      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!result.success) {
        // Show inline banner or custom messages
        if (result.error === 'EmailTaken') {
          showInputError(emailInput, emailError, result.message);
        } else if (result.error === 'UsernameTaken') {
          showInputError(usernameInput, usernameError, result.message);
        }
        showToast('Authentication Error', result.message || 'Please check your inputs.', 'error');
      } else {
        // Auth Success
        showToast('Success!', isLoginState ? 'Welcome back!' : 'Account registered successfully!', 'success');
        
        // Sync theme preference and redirect
        localStorage.setItem('userSession', JSON.stringify(result.data.user));
        
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      showToast('Network Error', 'Could not establish connection with server.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isLoginState ? 'Log In' : 'Sign Up';
    }
  });
});
