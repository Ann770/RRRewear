// Profile Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const profileForm = document.getElementById('profile-form');
    const changeAvatarBtn = document.getElementById('change-avatar');
    const profileAvatar = document.getElementById('profile-avatar');
    const listingsCount = document.getElementById('listings-count');
    const purchasesCount = document.getElementById('purchases-count');
    const salesCount = document.getElementById('sales-count');

    // Load user profile data
    loadUserProfile();

    // Handle avatar change
    changeAvatarBtn.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                uploadAvatar(file);
            }
        };
        
        input.click();
    });

    // Handle profile form submission
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        updateProfile();
    });

    // Profile Dropdown Toggle
    const profileTrigger = document.querySelector('.profile-trigger');
    const profileMenu = document.querySelector('.profile-menu');

    if (profileTrigger && profileMenu) {
        profileTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            profileMenu.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!profileMenu.contains(e.target) && !profileTrigger.contains(e.target)) {
                profileMenu.classList.remove('active');
            }
        });
    }

    // Tab Switching
    const tabs = document.querySelectorAll('.profile-tab');
    const tabContent = document.querySelector('.profile-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Load content based on tab
            loadTabContent(this.textContent.trim());
        });
    });

    // Function to load tab content
    function loadTabContent(tabName) {
        // Clear existing content
        tabContent.innerHTML = '';
        
        switch(tabName) {
            case 'My Closet':
                loadClosetItems();
                break;
            case 'Swaps':
                loadSwaps();
                break;
            case 'Reviews':
                loadReviews();
                break;
            case 'Activity':
                loadActivity();
                break;
        }
    }

    // Load Closet Items
    function loadClosetItems() {
        // Simulate loading closet items
        const closetGrid = document.createElement('div');
        closetGrid.className = 'closet-grid';

        // Sample closet items
        const items = [
            { image: 'images/item1.jpg', title: 'Blue Denim Jacket', condition: 'Like New' },
            { image: 'images/item2.jpg', title: 'White Summer Dress', condition: 'Good' },
            { image: 'images/item3.jpg', title: 'Black Leather Boots', condition: 'Excellent' },
            // Add more items as needed
        ];

        items.forEach(item => {
            const itemCard = createItemCard(item);
            closetGrid.appendChild(itemCard);
        });

        tabContent.appendChild(closetGrid);
    }

    // Create Item Card
    function createItemCard(item) {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-image">
                <img src="${item.image}" alt="${item.title}">
            </div>
            <div class="item-details">
                <h4>${item.title}</h4>
                <p>Condition: ${item.condition}</p>
            </div>
        `;
        return card;
    }

    // Load Swaps
    function loadSwaps() {
        tabContent.innerHTML = `
            <div class="swaps-container">
                <h3>Active Swaps</h3>
                <div class="swaps-list">
                    <!-- Swap items will be loaded here -->
                    <p>No active swaps at the moment.</p>
                </div>
            </div>
        `;
    }

    // Load Reviews
    function loadReviews() {
        tabContent.innerHTML = `
            <div class="reviews-container">
                <div class="rating-summary">
                    <h3>Overall Rating</h3>
                    <div class="rating">4.8 <span class="out-of">/5</span></div>
                    <p>Based on 24 reviews</p>
                </div>
                <div class="reviews-list">
                    <!-- Reviews will be loaded here -->
                    <p>Loading reviews...</p>
                </div>
            </div>
        `;
    }

    // Load Activity
    function loadActivity() {
        tabContent.innerHTML = `
            <div class="activity-container">
                <div class="activity-filters">
                    <button class="active">All Activity</button>
                    <button>Listings</button>
                    <button>Swaps</button>
                    <button>Reviews</button>
                </div>
                <div class="activity-timeline">
                    <!-- Activity items will be loaded here -->
                    <p>Loading activity...</p>
                </div>
            </div>
        `;
    }

    // Edit Profile Button
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            // Implement edit profile functionality
            console.log('Edit profile clicked');
        });
    }

    // Share Profile Button
    const shareProfileBtn = document.querySelector('.share-profile-btn');
    if (shareProfileBtn) {
        shareProfileBtn.addEventListener('click', function() {
            // Implement share profile functionality
            console.log('Share profile clicked');
        });
    }

    // Load initial content (My Closet tab)
    loadClosetItems();
});

// Function to load user profile
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const response = await fetch('/api/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            updateProfileUI(data.user);
        } else {
            showAlert(data.message || 'Error loading profile', 'error');
            if (response.status === 401) {
                window.location.href = '/login';
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Error loading profile', 'error');
        window.location.href = '/login';
    }
}

// Function to update profile UI
function updateProfileUI(user) {
    // Update profile header
    document.querySelector('.profile-name').textContent = user.name;
    document.querySelector('.profile-username').textContent = `@${user.email.split('@')[0]}`;
    
    // Update profile stats
    document.querySelector('.stat-value:nth-child(1)').textContent = user.swapsCount || 0;
    document.querySelector('.stat-value:nth-child(2)').textContent = user.listingsCount || 0;
    
    // Update profile menu
    const profileMenuHeader = document.querySelector('.profile-menu-header');
    if (profileMenuHeader) {
        profileMenuHeader.querySelector('h3').textContent = user.name;
        profileMenuHeader.querySelector('p').textContent = user.email;
    }
}

// Upload new avatar
async function uploadAvatar(file) {
    try {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch('/api/profile/avatar', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload avatar');
        }

        const data = await response.json();
        document.getElementById('profile-avatar').src = data.avatar_url;
        showAlert('Avatar updated successfully', 'success');
    } catch (error) {
        console.error('Error uploading avatar:', error);
        showAlert('Failed to upload avatar', 'error');
    }
}

// Update profile information
async function updateProfile() {
    try {
        const formData = new FormData(profileForm);
        const data = Object.fromEntries(formData.entries());

        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        showAlert('Profile updated successfully', 'success');
    } catch (error) {
        console.error('Error updating profile:', error);
        showAlert('Failed to update profile', 'error');
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
    });
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const container = document.querySelector('.profile-container');
    container.insertBefore(alertDiv, container.firstChild);

    // Remove alert after 3 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Form validation
function validateForm() {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword && newPassword !== confirmPassword) {
        showAlert('New passwords do not match', 'error');
        return false;
    }

    return true;
} 