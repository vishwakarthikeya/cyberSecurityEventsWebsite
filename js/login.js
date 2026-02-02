// Login Page JavaScript
import { loginUser, signInWithGoogle, onAuthChange, isUserAdmin } from './auth.js';

// DOM Elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
const rememberMe = document.getElementById('remember-me');
const loginBtn = document.getElementById('login-btn');
const googleLoginBtn = document.getElementById('google-login-btn');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');

// Toggle password visibility
if (togglePassword) {
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
}

// Form validation
function validateForm() {
    let isValid = true;
    
    // Reset errors
    emailError.textContent = '';
    emailError.classList.remove('show');
    passwordError.textContent = '';
    passwordError.classList.remove('show');
    
    // Email validation
    const email = emailInput.value.trim();
    if (!email) {
        emailError.textContent = 'Email is required';
        emailError.classList.add('show');
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailError.textContent = 'Please enter a valid email address';
        emailError.classList.add('show');
        isValid = false;
    }
    
    // Password validation
    const password = passwordInput.value;
    if (!password) {
        passwordError.textContent = 'Password is required';
        passwordError.classList.add('show');
        isValid = false;
    } else if (password.length < 6) {
        passwordError.textContent = 'Password must be at least 6 characters';
        passwordError.classList.add('show');
        isValid = false;
    }
    
    return isValid;
}

// Handle form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Show loading state
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        loginBtn.disabled = true;
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        try {
            const result = await loginUser(email, password);
            
            if (result.success) {
                // Check if user is admin and redirect accordingly
                const isAdmin = await isUserAdmin(result.user.uid);
                
                if (isAdmin) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            }
        } catch (error) {
            console.error('Login error:', error);
        } finally {
            // Reset button state
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    });
}

// Handle Google login
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        const originalText = googleLoginBtn.innerHTML;
        googleLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        googleLoginBtn.disabled = true;
        
        try {
            const result = await signInWithGoogle();
            
            if (result.success) {
                // Check if user is admin
                const isAdmin = await isUserAdmin(result.user.uid);
                
                if (isAdmin) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            }
        } catch (error) {
            console.error('Google login error:', error);
        } finally {
            googleLoginBtn.innerHTML = originalText;
            googleLoginBtn.disabled = false;
        }
    });
}

// Check if user is already logged in
onAuthChange(async (authState) => {
    if (authState.loggedIn && authState.user) {
        // User is already logged in, redirect based on role
        const isAdmin = await isUserAdmin(authState.user.uid);
        
        if (isAdmin) {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'index.html';
        }
    }
});

// Mobile menu toggle
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.querySelector('.nav-links');

if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('show');
    });
}

// Handle "Remember me" functionality
if (rememberMe) {
    // Check if there are saved credentials
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberMe.checked = true;
    }
    
    // Save credentials when form is submitted
    loginForm.addEventListener('submit', () => {
        if (rememberMe.checked) {
            localStorage.setItem('rememberedEmail', emailInput.value.trim());
        } else {
            localStorage.removeItem('rememberedEmail');
        }
    });
}

// Input validation on blur
emailInput.addEventListener('blur', validateForm);
passwordInput.addEventListener('blur', validateForm);

// Clear errors on input
emailInput.addEventListener('input', () => {
    emailError.textContent = '';
    emailError.classList.remove('show');
});

passwordInput.addEventListener('input', () => {
    passwordError.textContent = '';
    passwordError.classList.remove('show');
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Enter to submit form
    if (e.key === 'Enter' && (e.target === emailInput || e.target === passwordInput)) {
        loginForm.dispatchEvent(new Event('submit'));
    }
    
    // Escape to clear form
    if (e.key === 'Escape') {
        loginForm.reset();
        emailError.textContent = '';
        emailError.classList.remove('show');
        passwordError.textContent = '';
        passwordError.classList.remove('show');
    }
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-menu') && navLinks.classList.contains('show')) {
        navLinks.classList.remove('show');
    }
});