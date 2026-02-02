// Register Page JavaScript
import { registerUser, signInWithGoogle, showToast } from './auth.js';

// DOM Elements
const registerForm = document.getElementById('register-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const togglePassword = document.getElementById('togglePassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const termsCheckbox = document.getElementById('terms');
const registerBtn = document.getElementById('register-btn');
const googleRegisterBtn = document.getElementById('google-register-btn');
const registerSpinner = document.getElementById('register-spinner');
const nameError = document.getElementById('name-error');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const confirmPasswordError = document.getElementById('confirm-password-error');
const strengthFill = document.getElementById('strength-fill');
const strengthText = document.getElementById('strength-text');

// Toggle password visibility
if (togglePassword) {
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
}

if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener('click', () => {
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);
        toggleConfirmPassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
}

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
}

function updatePasswordStrength(password) {
    const strength = checkPasswordStrength(password);
    
    // Update visual indicator
    strengthFill.className = 'strength-fill';
    let strengthClass = 'weak';
    let text = 'Weak';
    
    if (strength >= 4) {
        strengthClass = 'strong';
        text = 'Strong';
    } else if (strength >= 3) {
        strengthClass = 'good';
        text = 'Good';
    } else if (strength >= 2) {
        strengthClass = 'fair';
        text = 'Fair';
    }
    
    strengthFill.classList.add(strengthClass);
    strengthText.textContent = text;
    strengthText.style.color = getComputedStyle(document.documentElement)
        .getPropertyValue(`--${strength === 5 ? 'success' : strength >= 3 ? 'accent' : 'danger'}`);
}

// Form validation
function validateForm() {
    let isValid = true;
    
    // Reset errors
    nameError.textContent = '';
    emailError.textContent = '';
    passwordError.textContent = '';
    confirmPasswordError.textContent = '';
    
    // Name validation
    const name = nameInput.value.trim();
    if (!name) {
        nameError.textContent = 'Full name is required';
        isValid = false;
    } else if (name.length < 2) {
        nameError.textContent = 'Name must be at least 2 characters';
        isValid = false;
    }
    
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
    
    // Confirm password validation
    const confirmPassword = confirmPasswordInput.value;
    if (!confirmPassword) {
        confirmPasswordError.textContent = 'Please confirm your password';
        isValid = false;
    } else if (password !== confirmPassword) {
        confirmPasswordError.textContent = 'Passwords do not match';
        isValid = false;
    }
    
    // Terms validation
    if (!termsCheckbox.checked) {
        showToast('Please accept the terms and conditions', 'error');
        isValid = false;
    }
    
    return isValid;
}

// Handle form submission
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Show loading state
        registerBtn.classList.add('loading');
        registerBtn.disabled = true;
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        try {
            const result = await registerUser(name, email, password);
            
            if (result.success) {
                showToast('Registration successful! Redirecting...', 'success');
                
                // Redirect to login page after successful registration
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        } catch (error) {
            console.error('Registration error:', error);
        } finally {
            // Reset loading state
            registerBtn.classList.remove('loading');
            registerBtn.disabled = false;
        }
    });
}

// Handle Google registration
if (googleRegisterBtn) {
    googleRegisterBtn.addEventListener('click', async () => {
        googleRegisterBtn.classList.add('loading');
        googleRegisterBtn.disabled = true;
        
        try {
            const result = await signInWithGoogle();
            
            if (result.success) {
                showToast('Registration successful! Redirecting...', 'success');
                
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
        } catch (error) {
            console.error('Google registration error:', error);
        } finally {
            googleRegisterBtn.classList.remove('loading');
            googleRegisterBtn.disabled = false;
        }
    });
}

// Real-time password strength update
passwordInput.addEventListener('input', (e) => {
    const password = e.target.value;
    if (password) {
        updatePasswordStrength(password);
    } else {
        strengthFill.className = 'strength-fill';
        strengthText.textContent = 'Weak';
        strengthText.style.color = '';
    }
});

// Real-time confirm password validation
confirmPasswordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword && password !== confirmPassword) {
        confirmPasswordError.textContent = 'Passwords do not match';
    } else {
        confirmPasswordError.textContent = '';
    }
});

// Input validation on blur
nameInput.addEventListener('blur', validateForm);
emailInput.addEventListener('blur', validateForm);
passwordInput.addEventListener('blur', validateForm);
confirmPasswordInput.addEventListener('blur', validateForm);

// Clear errors on input
nameInput.addEventListener('input', () => {
    nameError.textContent = '';
});

emailInput.addEventListener('input', () => {
    emailError.textContent = '';
});

passwordInput.addEventListener('input', () => {
    passwordError.textContent = '';
});

confirmPasswordInput.addEventListener('input', () => {
    confirmPasswordError.textContent = '';
});

// Mobile menu toggle
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.querySelector('.nav-links');

if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    });
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl + Enter to submit form
    if (e.ctrlKey && e.key === 'Enter') {
        registerForm.dispatchEvent(new Event('submit'));
    }
    
    // Escape to clear form
    if (e.key === 'Escape') {
        registerForm.reset();
        nameError.textContent = '';
        emailError.textContent = '';
        passwordError.textContent = '';
        confirmPasswordError.textContent = '';
        strengthFill.className = 'strength-fill';
        strengthText.textContent = 'Weak';
    }
});

// Auto-capitalize name input
nameInput.addEventListener('input', (e) => {
    const value = e.target.value;
    if (value.length === 1) {
        e.target.value = value.toUpperCase();
    }
});

// Email domain suggestion
emailInput.addEventListener('blur', () => {
    const email = emailInput.value.trim();
    if (email && !email.includes('@')) {
        // Don't suggest if user is typing
        return;
    }
    
    if (email && !/@.*\./.test(email)) {
        const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'srinidhi.edu'];
        // You could implement a domain suggestion feature here
    }
});

// Password visibility timeout for security
let passwordTimeout;
passwordInput.addEventListener('blur', () => {
    if (passwordInput.type === 'text') {
        passwordTimeout = setTimeout(() => {
            passwordInput.type = 'password';
            if (togglePassword) {
                togglePassword.innerHTML = '<i class="fas fa-eye"></i>';
            }
        }, 3000);
    }
});

passwordInput.addEventListener('focus', () => {
    if (passwordTimeout) {
        clearTimeout(passwordTimeout);
    }
});

// Form auto-save for better UX
let formData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
};

// Save form data on input
[nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
    input.addEventListener('input', (e) => {
        formData[e.target.id] = e.target.value;
        sessionStorage.setItem('registerFormData', JSON.stringify(formData));
    });
});

// Load form data on page load
window.addEventListener('load', () => {
    const savedData = sessionStorage.getItem('registerFormData');
    if (savedData) {
        formData = JSON.parse(savedData);
        nameInput.value = formData.name;
        emailInput.value = formData.email;
        passwordInput.value = formData.password;
        confirmPasswordInput.value = formData.confirmPassword;
        
        if (passwordInput.value) {
            updatePasswordStrength(passwordInput.value);
        }
    }
});

// Clear form data on successful registration
registerForm.addEventListener('submit', () => {
    sessionStorage.removeItem('registerFormData');
});