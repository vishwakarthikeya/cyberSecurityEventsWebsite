// Main JavaScript for Home Page

import { onAuthChange, logoutUser } from "./auth.js";


// =======================
// DOM Elements
// =======================

const navProfile = document.getElementById("nav-profile");
const loginNav = document.getElementById("login-nav");
const registerNav = document.getElementById("register-nav");
const userAvatar = document.getElementById("user-avatar");
const userName = document.getElementById("user-name");
const profileLink = document.getElementById("profile-link");
const adminLink = document.getElementById("admin-link");
const logoutBtn = document.getElementById("logout-btn");
const mobileToggle = document.getElementById("mobileToggle");
const navLinks = document.querySelector(".nav-links");

// =======================
// Mobile Menu Toggle
// =======================

if (mobileToggle) {
    mobileToggle.addEventListener("click", () => {
        navLinks.classList.toggle("show");
    });
}

// =======================
// Auth State Listener
// =======================

onAuthChange(async (authState) => {

    console.log("AUTH STATE:", authState);

    if (authState.loggedIn && authState.user) {

        if (loginNav) loginNav.style.display = "none";
        if (registerNav) registerNav.style.display = "none";
        if (navProfile) navProfile.style.display = "flex";

        // -----------------------
        // User Info
        // -----------------------

        if (authState.userData) {

            if (userName) {
                userName.textContent =
                    authState.userData.name || authState.user.email;
            }

            if (userAvatar) {
                const name =
                    authState.userData.name || authState.user.email;
                userAvatar.innerHTML = `<span>${name.charAt(0).toUpperCase()}</span>`;
            }

            // -----------------------
            // ADMIN CHECK (FIXED)
            // -----------------------

            if (adminLink) {

                console.log("ROLE:", authState.userData.role);

                if (authState.userData.role === "admin") {
                    adminLink.style.display = "block";
                } else {
                    adminLink.style.display = "none";
                }
            }
        }

    } else {

        if (loginNav) loginNav.style.display = "flex";
        if (registerNav) registerNav.style.display = "flex";
        if (navProfile) navProfile.style.display = "none";
        if (adminLink) adminLink.style.display = "none";
    }

});

// =======================
// Logout
// =======================

if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await logoutUser();
        window.location.href = "index.html";
    });
}

// =======================
// Admin Link Click
// =======================

if (adminLink) {
    adminLink.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "admin.html";
    });
}

// =======================
// Smooth Scroll
// =======================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();

        const targetId = this.getAttribute("href");
        if (targetId === "#") return;

        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: "smooth"
            });

            navLinks.classList.remove("show");
        }
    });
});

// =======================
// Close mobile menu
// =======================

document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-menu") && navLinks.classList.contains("show")) {
        navLinks.classList.remove("show");
    }
});

// =======================
// Page Loaded Animation
// =======================

window.addEventListener("load", () => {
    document.body.classList.add("loaded");
});

// =======================
// Ripple Effect
// =======================

document.addEventListener("click", function (e) {

    if (e.target.closest(".btn")) {

        const btn = e.target.closest(".btn");
        const ripple = document.createElement("span");
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255,255,255,0.6);
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

// =======================
// Ripple CSS
// =======================

const style = document.createElement("style");

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
`;

document.head.appendChild(style);

// =======================
// Init Animations
// =======================

function initAnimations() {
    document
        .querySelectorAll(".stat-card, .highlight")
        .forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
}

initAnimations();
