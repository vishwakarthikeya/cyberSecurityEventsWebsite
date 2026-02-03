// Register Page JavaScript
import { registerUser, signInWithGoogle } from './auth.js';

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
    
    // Reset classes
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
}

// Form validation
function validateForm() {
    let isValid = true;
    
    // Reset errors
    nameError.textContent = '';
    nameError.classList.remove('show');
    emailError.textContent = '';
    emailError.classList.remove('show');
    passwordError.textContent = '';
    passwordError.classList.remove('show');
    confirmPasswordError.textContent = '';
    confirmPasswordError.classList.remove('show');
    
    // Name validation
    const name = nameInput.value.trim();
    if (!name) {
        nameError.textContent = 'Full name is required';
        nameError.classList.add('show');
        isValid = false;
    } else if (name.length < 2) {
        nameError.textContent = 'Name must be at least 2 characters';
        nameError.classList.add('show');
        isValid = false;
    }
    
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
    
    // Confirm password validation
    const confirmPassword = confirmPasswordInput.value;
    if (!confirmPassword) {
        confirmPasswordError.textContent = 'Please confirm your password';
        confirmPasswordError.classList.add('show');
        isValid = false;
    } else if (password !== confirmPassword) {
        confirmPasswordError.textContent = 'Passwords do not match';
        confirmPasswordError.classList.add('show');
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
        const originalText = registerBtn.innerHTML;
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        registerBtn.disabled = true;
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        try {
            const result = await registerUser(name, email, password);
            
            if (result.success) {
                // Redirect to login page after successful registration
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            }
        } catch (error) {
            console.error('Registration error:', error);
        } finally {
            // Reset button state
            registerBtn.innerHTML = originalText;
            registerBtn.disabled = false;
        }
    });
}

// Handle Google registration
if (googleRegisterBtn) {
    googleRegisterBtn.addEventListener('click', async () => {
        const originalText = googleRegisterBtn.innerHTML;
        googleRegisterBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing up...';
        googleRegisterBtn.disabled = true;
        
        try {
            const result = await signInWithGoogle();
            
            if (result.success) {
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
        } catch (error) {
            console.error('Google registration error:', error);
        } finally {
            googleRegisterBtn.innerHTML = originalText;
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
    }
});

// Real-time confirm password validation
confirmPasswordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword && password !== confirmPassword) {
        confirmPasswordError.textContent = 'Passwords do not match';
        confirmPasswordError.classList.add('show');
    } else {
        confirmPasswordError.textContent = '';
        confirmPasswordError.classList.remove('show');
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
    nameError.classList.remove('show');
});

emailInput.addEventListener('input', () => {
    emailError.textContent = '';
    emailError.classList.remove('show');
});

passwordInput.addEventListener('input', () => {
    passwordError.textContent = '';
    passwordError.classList.remove('show');
});

confirmPasswordInput.addEventListener('input', () => {
    confirmPasswordError.textContent = '';
    confirmPasswordError.classList.remove('show');
});

// Mobile menu toggle
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.querySelector('.nav-links');

if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('show');
    });
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Enter to submit form
    if (e.key === 'Enter' && (e.target === nameInput || e.target === emailInput || 
        e.target === passwordInput || e.target === confirmPasswordInput)) {
        registerForm.dispatchEvent(new Event('submit'));
    }
    
    // Escape to clear form
    if (e.key === 'Escape') {
        registerForm.reset();
        nameError.textContent = '';
        nameError.classList.remove('show');
        emailError.textContent = '';
        emailError.classList.remove('show');
        passwordError.textContent = '';
        passwordError.classList.remove('show');
        confirmPasswordError.textContent = '';
        confirmPasswordError.classList.remove('show');
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

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-menu') && navLinks.classList.contains('show')) {
        navLinks.classList.remove('show');
    }
});