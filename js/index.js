// Main JavaScript for Home Page
import { onAuthChange, logoutUser, isUserAdmin } from './auth.js';

// DOM Elements
const navProfile = document.getElementById('nav-profile');
const loginNav = document.getElementById('login-nav');
const registerNav = document.getElementById('register-nav');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const profileLink = document.getElementById('profile-link');
const adminLink = document.getElementById('admin-link');
const logoutBtn = document.getElementById('logout-btn');
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.querySelector('.nav-links');

// Mobile Menu Toggle
if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    });
}

// Handle Authentication State Changes
onAuthChange(async (authState) => {
    if (authState.loggedIn && authState.user) {
        // User is logged in
        loginNav.style.display = 'none';
        registerNav.style.display = 'none';
        navProfile.style.display = 'block';
        
        // Update user info
        if (authState.userData) {
            userName.textContent = authState.userData.name || authState.user.email;
            
            // Create avatar with initials
            const name = authState.userData.name || authState.user.email;
            const initials = name.charAt(0).toUpperCase();
            userAvatar.innerHTML = `<span>${initials}</span>`;
            userAvatar.style.background = `linear-gradient(135deg, var(--accent), var(--secondary))`;
        }
        
        // Check if user is admin
        const isAdmin = await isUserAdmin(authState.user.uid);
        if (isAdmin) {
            adminLink.style.display = 'block';
        }
        
    } else {
        // User is not logged in
        loginNav.style.display = 'block';
        registerNav.style.display = 'block';
        navProfile.style.display = 'none';
    }
});

// Handle Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await logoutUser();
        window.location.href = 'index.html';
    });
}

// Handle Admin Link
if (adminLink) {
    adminLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'admin.html';
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe all sections for animation
document.querySelectorAll('.section, .stat-card, .highlight, .hod-card, .cta-card').forEach(el => {
    observer.observe(el);
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        const rate = scrolled * -0.5;
        hero.style.backgroundPosition = `center ${rate}px`;
    }
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Ripple effect for buttons
document.addEventListener('click', function(e) {
    if (e.target.closest('.btn')) {
        const btn = e.target.closest('.btn');
        const ripple = document.createElement('span');
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            width: ${size}px;
            height: ${size}px;
            top: ${y}px;
            left: ${x}px;
        `;
        
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }
});

// Add ripple animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    .btn {
        position: relative;
        overflow: hidden;
    }
    .animate-in {
        animation: fadeInUp 0.6s ease forwards;
    }
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Initialize all animations
function initAnimations() {
    // Add animation delay to cards
    document.querySelectorAll('.stat-card, .highlight').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

// Call initialization
initAnimations();