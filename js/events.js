// Events Page JavaScript
import { onAuthChange, isUserAdmin, showToast } from './auth.js';
import { db, storage } from './firebase-config.js';
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
import { 
    ref, 
    uploadBytes, 
    getDownloadURL,
    deleteObject 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// DOM Elements
const eventsGrid = document.getElementById('events-grid');
const noEvents = document.getElementById('no-events');
const adminActions = document.getElementById('admin-actions');
const addEventBtn = document.getElementById('add-event-btn');
const searchInput = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const filterSort = document.getElementById('filter-sort');
const addEventModal = document.getElementById('add-event-modal');
const editEventModal = document.getElementById('edit-event-modal');
const deleteModal = document.getElementById('delete-modal');
const modalCloseBtns = document.querySelectorAll('.modal-close');
const cancelBtns = document.querySelectorAll('.cancel-btn, .btn-outline');
const addEventForm = document.getElementById('add-event-form');
const editEventForm = document.getElementById('edit-event-form');
const deleteEventBtn = document.getElementById('delete-event-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');

// State variables
let events = [];
let currentUser = null;
let isAdmin = false;
let eventToDelete = null;

// Initialize events page
async function initEventsPage() {
    // Check authentication state
    onAuthChange(async (authState) => {
        if (authState.loggedIn && authState.user) {
            currentUser = authState.user;
            isAdmin = await isUserAdmin(currentUser.uid);
            
            // Update UI based on admin status
            if (isAdmin) {
                adminActions.style.display = 'block';
            }
            
            // Load events
            await loadEvents();
        } else {
            // User is not logged in, still load events
            await loadEvents();
        }
    });
    
    // Setup event listeners
    setupEventListeners();
}

// Load events from Firestore
async function loadEvents() {
    try {
        eventsGrid.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading events...</p>
            </div>
        `;
        
        const eventsRef = collection(db, "events");
        const q = query(eventsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        events = [];
        querySnapshot.forEach((doc) => {
            events.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderEvents(events);
        
        if (events.length === 0) {
            noEvents.style.display = 'block';
        } else {
            noEvents.style.display = 'none';
        }
    } catch (error) {
        console.error("Error loading events:", error);
        showToast("Error loading events. Please try again.", "error");
        
        eventsGrid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Events</h3>
                <p>Failed to load events. Please refresh the page.</p>
            </div>
        `;
    }
}

// Render events to the grid
function renderEvents(eventsToRender) {
    if (eventsToRender.length === 0) {
        eventsGrid.innerHTML = `
            <div class="no-events-found">
                <i class="fas fa-calendar-times"></i>
                <h3>No Events Found</h3>
                <p>Try adjusting your search or filter</p>
            </div>
        `;
        return;
    }
    
    eventsGrid.innerHTML = '';
    
    eventsToRender.forEach((event, index) => {
        const eventCard = createEventCard(event, index);
        eventsGrid.appendChild(eventCard);
    });
}

// Create event card element
function createEventCard(event, index) {
    const card = document.createElement('div');
    card.className = `event-card ${isAdmin ? 'admin-mode' : ''}`;
    card.dataset.id = event.id;
    card.style.animationDelay = `${index * 0.1}s`;
    
    const categoryBadge = getCategoryBadge(event.category || 'workshop');
    const date = event.date ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }) : 'Date TBD';
    
    card.innerHTML = `
        <div class="event-image">
            <img src="${event.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}" 
                 alt="${event.title}" 
                 onerror="this.src='https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">
            <div class="event-category">${categoryBadge.text}</div>
        </div>
        <div class="event-content">
            <div class="event-date">
                <i class="far fa-calendar"></i>
                <span>${date}</span>
            </div>
            <h3 class="event-title">${event.title}</h3>
            <p class="event-description">${event.description || 'No description available.'}</p>
            <div class="event-actions">
                <a href="${event.googleFormLink || '#'}" 
                   target="_blank" 
                   class="register-btn" 
                   ${!event.googleFormLink ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
                    <i class="fas fa-user-plus"></i>
                    ${event.googleFormLink ? 'Register Now' : 'Registration Closed'}
                </a>
                ${isAdmin ? `
                    <div class="admin-actions">
                        <button class="admin-btn edit-btn" data-id="${event.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="admin-btn delete-btn" data-id="${event.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Add event listeners for admin buttons
    if (isAdmin) {
        const editBtn = card.querySelector('.edit-btn');
        const deleteBtn = card.querySelector('.delete-btn');
        
        editBtn.addEventListener('click', () => openEditModal(event));
        deleteBtn.addEventListener('click', () => openDeleteModal(event));
    }
    
    return card;
}

// Get category badge
function getCategoryBadge(category) {
    const categories = {
        workshop: { text: 'Workshop', class: 'badge-workshop' },
        competition: { text: 'Competition', class: 'badge-competition' },
        seminar: { text: 'Seminar', class: 'badge-seminar' },
        hackathon: { text: 'Hackathon', class: 'badge-hackathon' },
        conference: { text: 'Conference', class: 'badge-conference' }
    };
    
    return categories[category] || categories.workshop;
}

// Filter and sort events
function filterAndSortEvents() {
    let filteredEvents = [...events];
    
    // Filter by search
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredEvents = filteredEvents.filter(event => 
            event.title.toLowerCase().includes(searchTerm) ||
            (event.description && event.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Filter by category
    const category = filterCategory.value;
    if (category !== 'all') {
        filteredEvents = filteredEvents.filter(event => 
            event.category === category
        );
    }
    
    // Sort events
    const sortBy = filterSort.value;
    filteredEvents.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.createdAt?.toDate() || 0) - new Date(a.createdAt?.toDate() || 0);
            case 'oldest':
                return new Date(a.createdAt?.toDate() || 0) - new Date(b.createdAt?.toDate() || 0);
            case 'alphabetical':
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });
    
    renderEvents(filteredEvents);
}

// Setup event listeners
function setupEventListeners() {
    // Add event button
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => {
            addEventModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Modal close buttons
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });
    
    // Cancel buttons
    cancelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });
    
    // Search and filter
    searchInput.addEventListener('input', filterAndSortEvents);
    filterCategory.addEventListener('change', filterAndSortEvents);
    filterSort.addEventListener('change', filterAndSortEvents);
    
    // Form submissions
    if (addEventForm) {
        addEventForm.addEventListener('submit', handleAddEvent);
    }
    
    if (editEventForm) {
        editEventForm.addEventListener('submit', handleEditEvent);
    }
    
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
    
    // Show current image preview
    const preview = document.getElementById('edit-image-preview');
    if (event.imageUrl) {
        preview.innerHTML = `<img src="${event.imageUrl}" alt="Current Image">`;
        preview.classList.add('has-image');
    }
}

// Open delete modal
function openDeleteModal(event) {
    eventToDelete = event;
    deleteModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const preview = document.getElementById('delete-event-preview');
    preview.innerHTML = `
        <h4>${event.title}</h4>
        <p>${event.description?.substring(0, 100)}...</p>
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
    const imageFile = document.getElementById('event-image').files[0];
    
    // Show loading state
    const submitBtn = addEventForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    try {
        let imageUrl = '';
        
        // Upload image if provided
        if (imageFile) {
            const storageRef = ref(storage, `events/${Date.now()}_${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(storageRef);
        }
        
        // Add event to Firestore
        const eventData = {
            title,
            description,
            googleFormLink,
            category,
            date,
            imageUrl,
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
    const imageFile = document.getElementById('edit-event-image').files[0];
    
    // Show loading state
    const submitBtn = editEventForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    submitBtn.disabled = true;
    
    try {
        let imageUrl = '';
        
        // Upload new image if provided
        if (imageFile) {
            const storageRef = ref(storage, `events/${Date.now()}_${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(storageRef);
        }
        
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
        
        // Only update imageUrl if a new image was uploaded
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
        
        // Delete image from storage if exists
        if (eventToDelete.imageUrl) {
            const imageRef = ref(storage, eventToDelete.imageUrl);
            try {
                await deleteObject(imageRef);
            } catch (error) {
                console.warn('Error deleting image:', error);
            }
        }
        
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

// Image preview
document.addEventListener('DOMContentLoaded', () => {
    const imageInputs = document.querySelectorAll('input[type="file"]');
    
    imageInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const previewId = this.id === 'event-image' ? 'image-preview' : 'edit-image-preview';
            const preview = document.getElementById(previewId);
            
            if (file) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                    preview.classList.add('has-image');
                };
                
                reader.readAsDataURL(file);
            } else {
                preview.innerHTML = '';
                preview.classList.remove('has-image');
            }
        });
    });
});

// Initialize page
initEventsPage();