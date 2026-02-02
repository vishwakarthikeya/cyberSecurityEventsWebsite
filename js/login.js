// Login Page JavaScript
import { loginUser, signInWithGoogle, onAuthChange } from './auth.js';
import { showToast } from './auth.js';

// DOM Elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
const rememberMe = document.getElementById('remember-me');
const loginBtn = document.getElementById('login-btn');
const googleLoginBtn = document.getElementById('google-login-btn');
const loginSpinner = document.getElementById('login-spinner');
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
    passwordError.textContent = '';
    
    // Email validation
    const email = emailInput.value.trim();
    if (!email) {
        emailError.textContent = 'Email is required';
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailError.textContent = 'Please enter a valid email address';
        isValid = false;
    }
    
    // Password validation
    const password = passwordInput.value;
    if (!password) {
        passwordError.textContent = 'Password is required';
        isValid = false;
    } else if (password.length < 6) {
        passwordError.textContent = 'Password must be at least 6 characters';
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
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        try {
            const result = await loginUser(email, password);
            
            if (result.success) {
                // Check if user is admin and redirect accordingly
                const user = result.user;
                
                // Check user role from Firestore
                const { getCurrentUserData } = await import('./auth.js');
                const userData = await getCurrentUserData(user.uid);
                
                if (userData.success) {
                    if (userData.data.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                } else {
                    // Default redirect for users
                    window.location.href = 'index.html';
                }
            }
        } catch (error) {
            console.error('Login error:', error);
        } finally {
            // Reset loading state
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    });
}

// Handle Google login
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        googleLoginBtn.classList.add('loading');
        googleLoginBtn.disabled = true;
        
        try {
            const result = await signInWithGoogle();
            
            if (result.success) {
                // Check user role from Firestore
                const { getCurrentUserData } = await import('./auth.js');
                const userData = await getCurrentUserData(result.user.uid);
                
                if (userData.success) {
                    if (userData.data.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                } else {
                    // Default redirect for users
                    window.location.href = 'index.html';
                }
            }
        } catch (error) {
            console.error('Google login error:', error);
        } finally {
            googleLoginBtn.classList.remove('loading');
            googleLoginBtn.disabled = false;
        }
    });
}

// Check if user is already logged in
onAuthChange(async (authState) => {
    if (authState.loggedIn && authState.user) {
        // User is already logged in, redirect based on role
        const { getCurrentUserData } = await import('./auth.js');
        const userData = await getCurrentUserData(authState.user.uid);
        
        if (userData.success) {
            if (userData.data.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }
        }
    }
});

// Mobile menu toggle
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.querySelector('.nav-links');

if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
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
});

passwordInput.addEventListener('input', () => {
    passwordError.textContent = '';
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl + Enter to submit form
    if (e.ctrlKey && e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
    }
    
    // Escape to clear form
    if (e.key === 'Escape') {
        loginForm.reset();
        emailError.textContent = '';
        passwordError.textContent = '';
    }
});

// Add form auto-save for better UX
let formData = {
    email: '',
    password: ''
};

// Save form data on input
emailInput.addEventListener('input', (e) => {
    formData.email = e.target.value;
    sessionStorage.setItem('loginFormData', JSON.stringify(formData));
});

passwordInput.addEventListener('input', (e) => {
    formData.password = e.target.value;
    sessionStorage.setItem('loginFormData', JSON.stringify(formData));
});

// Load form data on page load
window.addEventListener('load', () => {
    const savedData = sessionStorage.getItem('loginFormData');
    if (savedData) {
        formData = JSON.parse(savedData);
        emailInput.value = formData.email;
        passwordInput.value = formData.password;
    }
});

// Clear form data on successful login
loginForm.addEventListener('submit', () => {
    sessionStorage.removeItem('loginFormData');
});