// Admin Page JavaScript
import { onAuthChange, logoutUser, protectAdminPage, showToast } from './auth.js';
import { db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    orderBy,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM Elements
const navProfile = document.getElementById('nav-profile');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.querySelector('.nav-links');
const addEventBtn = document.getElementById('add-event-btn');
const refreshEventsBtn = document.getElementById('refresh-events');
const eventSearch = document.getElementById('event-search');
const eventsTableBody = document.getElementById('events-table-body');
const totalEventsElement = document.getElementById('total-events');
const upcomingEventsElement = document.getElementById('upcoming-events');
const addEventModal = document.getElementById('add-event-modal');
const editEventModal = document.getElementById('edit-event-modal');
const deleteModal = document.getElementById('delete-modal');
const addEventForm = document.getElementById('add-event-form');
const editEventForm = document.getElementById('edit-event-form');
const deleteEventBtn = document.getElementById('delete-event-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');

// State variables
let events = [];
let currentUser = null;
let eventToDelete = null;

// Initialize admin page
async function initAdminPage() {
    // Protect admin page
    const isAdmin = await protectAdminPage();
    if (!isAdmin) return;
    
    // Check authentication state
    onAuthChange(async (authState) => {
        if (authState.loggedIn && authState.user) {
            currentUser = authState.user;
            
            // Update user info
            if (authState.userData) {
                userName.textContent = authState.userData.name || authState.user.email;
                
                // Create avatar with initials
                const name = authState.userData.name || authState.user.email;
                const initials = name.charAt(0).toUpperCase();
                userAvatar.innerHTML = `<span>${initials}</span>`;
                userAvatar.style.background = `linear-gradient(135deg, var(--warning), var(--danger))`;
            }
            
            // Load events
            await loadEvents();
        }
    });
    
    // Setup event listeners
    setupEventListeners();
}

// Load events from Firestore
async function loadEvents() {
    try {
        eventsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="loading-cell">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <p>Loading events...</p>
                    </div>
                </td>
            </tr>
        `;
        
        const eventsRef = collection(db, "events");
        const q = query(eventsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        events = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            events.push({
                id: doc.id,
                title: data.title || '',
                description: data.description || '',
                imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                googleFormLink: data.googleFormLink || '',
                category: data.category || 'workshop',
                date: data.date || '',
                createdAt: data.createdAt || null
            });
        });
        
        renderEventsTable(events);
        updateStats(events);
        
    } catch (error) {
        console.error("Error loading events:", error);
        showToast("Error loading events. Please try again.", "error");
        
        eventsTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: var(--danger);">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load events. Please refresh the page.</p>
                </td>
            </tr>
        `;
    }
}

// Render events table
function renderEventsTable(eventsToRender) {
    if (eventsToRender.length === 0) {
        eventsTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: var(--gray);">
                    <i class="fas fa-calendar-times"></i>
                    <p>No events found. Add your first event!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    eventsTableBody.innerHTML = '';
    
    eventsToRender.forEach((event) => {
        const row = createEventTableRow(event);
        eventsTableBody.appendChild(row);
    });
}

// Create event table row
function createEventTableRow(event) {
    const row = document.createElement('tr');
    
    const categoryClass = `category-${event.category}`;
    const status = new Date(event.date) >= new Date() ? 'upcoming' : 'past';
    const statusClass = `status-${status}`;
    const date = event.date ? new Date(event.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }) : 'Date TBD';
    
    row.innerHTML = `
        <td data-label="Event">
            <div class="event-cell">
                <div class="event-image-small">
                    <img src="${event.imageUrl}" alt="${event.title}" 
                         onerror="this.src='https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">
                </div>
                <div class="event-info">
                    <h4>${event.title}</h4>
                    <p>${event.description?.substring(0, 100) || 'No description'}...</p>
                </div>
            </div>
        </td>
        <td data-label="Category">
            <span class="category-badge ${categoryClass}">
                ${getCategoryText(event.category)}
            </span>
        </td>
        <td data-label="Date">${date}</td>
        <td data-label="Status">
            <span class="status-badge ${statusClass}">
                ${status === 'upcoming' ? 'Upcoming' : 'Past'}
            </span>
        </td>
        <td data-label="Actions">
            <div class="table-actions-cell">
                <button class="table-action-btn edit" data-id="${event.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="table-action-btn delete" data-id="${event.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    // Add event listeners for action buttons
    const editBtn = row.querySelector('.edit');
    const deleteBtn = row.querySelector('.delete');
    
    editBtn.addEventListener('click', () => openEditModal(event));
    deleteBtn.addEventListener('click', () => openDeleteModal(event));
    
    return row;
}

// Get category text
function getCategoryText(category) {
    const categories = {
        workshop: 'Workshop',
        competition: 'Competition',
        seminar: 'Seminar',
        hackathon: 'Hackathon',
        conference: 'Conference'
    };
    
    return categories[category] || 'Workshop';
}

// Update statistics
function updateStats(eventsList) {
    totalEventsElement.textContent = eventsList.length;
    
    const upcoming = eventsList.filter(event => {
        if (!event.date) return false;
        return new Date(event.date) >= new Date();
    }).length;
    
    upcomingEventsElement.textContent = upcoming;
}

// Filter events
function filterEvents() {
    const searchTerm = eventSearch.value.toLowerCase();
    
    let filteredEvents = [...events];
    
    if (searchTerm) {
        filteredEvents = filteredEvents.filter(event => 
            event.title.toLowerCase().includes(searchTerm) ||
            (event.description && event.description.toLowerCase().includes(searchTerm))
        );
    }
    
    renderEventsTable(filteredEvents);
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await logoutUser();
            window.location.href = 'index.html';
        });
    }
    
    // Add event button
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => {
            addEventModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Refresh events button
    if (refreshEventsBtn) {
        refreshEventsBtn.addEventListener('click', loadEvents);
    }
    
    // Event search
    if (eventSearch) {
        eventSearch.addEventListener('input', filterEvents);
    }
    
    // Form submissions
    if (addEventForm) {
        addEventForm.addEventListener('submit', handleAddEvent);
    }
    
    if (editEventForm) {
        editEventForm.addEventListener('submit', handleEditEvent);
    }
    
    // Modal close buttons
    document.querySelectorAll('.modal-close, .cancel-btn, .btn-outline').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Delete modal buttons
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleDeleteEvent);
    }
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-menu') && navLinks.classList.contains('show')) {
            navLinks.classList.remove('show');
        }
    });
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';
}

// Open edit modal
function openEditModal(event) {
    editEventModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Populate form with event data
    document.getElementById('edit-event-id').value = event.id;
    document.getElementById('edit-event-title').value = event.title;
    document.getElementById('edit-event-description').value = event.description || '';
    document.getElementById('edit-event-form-link').value = event.googleFormLink || '';
    document.getElementById('edit-event-category').value = event.category || 'workshop';
    
    if (event.date) {
        const date = new Date(event.date);
        document.getElementById('edit-event-date').value = date.toISOString().split('T')[0];
    }
    
    // Set current image URL
    document.getElementById('edit-event-image-url').value = event.imageUrl || '';
}

// Open delete modal
function openDeleteModal(event) {
    eventToDelete = event;
    deleteModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const preview = document.getElementById('delete-event-preview');
    preview.innerHTML = `
        <h4>${event.title}</h4>
        <p>${event.description?.substring(0, 100) || 'No description'}...</p>
    `;
}

// Handle add event
async function handleAddEvent(e) {
    e.preventDefault();
    
    const title = document.getElementById('event-title').value;
    const description = document.getElementById('event-description').value;
    const googleFormLink = document.getElementById('event-form-link').value;
    const category = document.getElementById('event-category').value;
    const date = document.getElementById('event-date').value;
    const imageUrl = document.getElementById('event-image-url').value;
    
    // Show loading state
    const submitBtn = addEventForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    try {
        // Add event to Firestore
        const eventData = {
            title,
            description,
            googleFormLink,
            category,
            date,
            imageUrl: imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            createdAt: serverTimestamp(),
            createdBy: currentUser.uid
        };
        
        await addDoc(collection(db, "events"), eventData);
        
        showToast('Event created successfully!', 'success');
        closeAllModals();
        addEventForm.reset();
        
        // Reload events
        await loadEvents();
    } catch (error) {
        console.error('Error adding event:', error);
        showToast('Error creating event. Please try again.', 'error');
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Handle edit event
async function handleEditEvent(e) {
    e.preventDefault();
    
    const eventId = document.getElementById('edit-event-id').value;
    const title = document.getElementById('edit-event-title').value;
    const description = document.getElementById('edit-event-description').value;
    const googleFormLink = document.getElementById('edit-event-form-link').value;
    const category = document.getElementById('edit-event-category').value;
    const date = document.getElementById('edit-event-date').value;
    const imageUrl = document.getElementById('edit-event-image-url').value;
    
    // Show loading state
    const submitBtn = editEventForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    submitBtn.disabled = true;
    
    try {
        // Update event in Firestore
        const eventRef = doc(db, "events", eventId);
        const eventData = {
            title,
            description,
            googleFormLink,
            category,
            date,
            updatedAt: serverTimestamp()
        };
        
        // Only update imageUrl if provided
        if (imageUrl) {
            eventData.imageUrl = imageUrl;
        }
        
        await updateDoc(eventRef, eventData);
        
        showToast('Event updated successfully!', 'success');
        closeAllModals();
        
        // Reload events
        await loadEvents();
    } catch (error) {
        console.error('Error updating event:', error);
        showToast('Error updating event. Please try again.', 'error');
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Handle delete event
async function handleDeleteEvent() {
    if (!eventToDelete) return;
    
    try {
        const eventRef = doc(db, "events", eventToDelete.id);
        
        // Delete event from Firestore
        await deleteDoc(eventRef);
        
        showToast('Event deleted successfully!', 'success');
        closeAllModals();
        
        // Reload events
        await loadEvents();
    } catch (error) {
        console.error('Error deleting event:', error);
        showToast('Error deleting event. Please try again.', 'error');
    } finally {
        eventToDelete = null;
    }
}

// Initialize admin page
initAdminPage();