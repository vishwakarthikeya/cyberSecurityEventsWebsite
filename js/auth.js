import { auth, db } from './firebase-config.js';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// ---------------- TOAST SYSTEM ----------------

export function showToast(message, type = 'info') {

  const toastContainer =
    document.getElementById('toast-container') || createToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-${
        type === 'success'
          ? 'check-circle'
          : type === 'error'
          ? 'exclamation-circle'
          : 'info-circle'
      }"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close">&times;</button>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 5000);

  toast.querySelector('.toast-close')
    .addEventListener('click', () => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    });

}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
  return container;
}


// ---------------- REGISTER ----------------

export async function registerUser(name, email, password) {

  try {

    const userCredential =
      await createUserWithEmailAndPassword(auth, email, password);

    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: name,
      email: email,
      role: "user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    showToast('Registration successful!', 'success');

    return { success: true, user };

  } catch (error) {

    let errorMessage = 'Registration failed. ';

    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage += 'Email already registered.';
        break;
      case 'auth/invalid-email':
        errorMessage += 'Invalid email address.';
        break;
      case 'auth/weak-password':
        errorMessage += 'Password is too weak.';
        break;
      default:
        errorMessage += error.message;
    }

    showToast(errorMessage, 'error');

    return { success: false, error: errorMessage };

  }

}


// ---------------- LOGIN ----------------

export async function loginUser(email, password) {

  try {

    const userCredential =
      await signInWithEmailAndPassword(auth, email, password);

    showToast('Login successful!', 'success');

    return { success: true, user: userCredential.user };

  } catch (error) {

    let errorMessage = 'Login failed. ';

    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage += 'User not found.';
        break;
      case 'auth/wrong-password':
        errorMessage += 'Incorrect password.';
        break;
      case 'auth/invalid-email':
        errorMessage += 'Invalid email address.';
        break;
      default:
        errorMessage += error.message;
    }

    showToast(errorMessage, 'error');

    return { success: false, error: errorMessage };

  }

}


// ---------------- GOOGLE LOGIN ----------------

export async function signInWithGoogle() {

  try {

    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        role: "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

    }

    showToast('Google login successful!', 'success');

    return { success: true, user };

  } catch (error) {

    showToast('Google login failed. ' + error.message, 'error');

    return { success: false, error: error.message };

  }

}


// ---------------- LOGOUT ----------------

export async function logoutUser() {

  try {

    await signOut(auth);
    showToast('Logged out successfully!', 'success');

    return { success: true };

  } catch (error) {

    showToast('Logout failed. ' + error.message, 'error');

    return { success: false, error: error.message };

  }

}


// ---------------- GET USER DATA ----------------

export async function getCurrentUserData(uid) {

  try {

    const userDoc = await getDoc(doc(db, "users", uid));

    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: 'User data not found' };
    }

  } catch (error) {
    return { success: false, error: error.message };
  }

}


// ---------------- ADMIN CHECK ----------------

export async function isUserAdmin(uid) {

  try {

    const userDoc = await getDoc(doc(db, "users", uid));

    if (userDoc.exists()) {

      const userData = userDoc.data();
      return userData.role === 'admin';

    }

    return false;

  } catch (error) {

    console.error('Error checking admin status:', error);
    return false;

  }

}


// ---------------- AUTH STATE LISTENER (FIXED) ----------------

export function onAuthChange(callback) {

  onAuthStateChanged(auth, async (user) => {

    if (user) {

      try {

        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {

          callback({
            loggedIn: true,
            user: user,
            userData: snap.data()
          });

        } else {

          callback({
            loggedIn: true,
            user: user,
            userData: null
          });

        }

      } catch (error) {

        console.error("User fetch error:", error);

        callback({
          loggedIn: true,
          user: user,
          userData: null
        });

      }

    } else {

      callback({
        loggedIn: false,
        user: null,
        userData: null
      });

    }

  });

}


// ---------------- PROTECT ADMIN PAGE ----------------

export async function protectAdminPage() {

  return new Promise((resolve) => {

    onAuthStateChanged(auth, async (user) => {

      if (!user) {

        window.location.href = 'index.html';
        resolve(false);
        return;

      }

      const isAdmin = await isUserAdmin(user.uid);

      if (!isAdmin) {

        showToast('Access denied. Admin only.', 'error');

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);

        resolve(false);
        return;

      }

      resolve(true);

    });

  });

}
