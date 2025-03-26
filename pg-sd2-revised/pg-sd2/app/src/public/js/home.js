// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load recent listings
    loadRecentListings();
    
    // Add smooth scrolling for navigation links
    addSmoothScroll();
    
    // Setup mobile menu
    setupMobileMenu();
    
    // Setup newsletter subscription
    setupNewsletter();
});

// Function to load recent listings
async function loadRecentListings() {
    try {
        const response = await fetch('/api/listings/recent');
        const data = await response.json();
        
        const listingsGrid = document.querySelector('.listings-grid');
        if (!listingsGrid) return;
        
        // Clear existing content
        listingsGrid.innerHTML = '';
        
        if (!data.success || !data.listings || data.listings.length === 0) {
            listingsGrid.innerHTML = `
                <div class="no-listings">
                    <p>No recent listings available. Be the first to add your items!</p>
                </div>
            `;
            return;
        }
        
        // Add each listing to the grid
        data.listings.forEach(listing => {
            const listingCard = createListingCard(listing);
            listingsGrid.appendChild(listingCard);
        });
    } catch (error) {
        console.error('Error loading recent listings:', error);
        const listingsGrid = document.querySelector('.listings-grid');
        if (listingsGrid) {
            listingsGrid.innerHTML = `
                <div class="error-message">
                    <p>Unable to load recent listings. Please try again later.</p>
                </div>
            `;
        }
    }
}

// Function to create a listing card
function createListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'listing-card';
    
    const formattedDate = new Date(listing.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    card.innerHTML = `
        <img src="${listing.image_url}" alt="${listing.title}" class="listing-image">
        <div class="listing-content">
            <h3 class="listing-title">${listing.title}</h3>
            <p class="listing-description">${listing.description.substring(0, 100)}...</p>
            <div class="listing-meta">
                <span class="listing-category">${listing.category}</span>
                <span class="listing-condition">${listing.condition_status}</span>
                <span class="listing-date">${formattedDate}</span>
            </div>
            <div class="listing-user">
                <i class="fas fa-user"></i>
                <span>${listing.username}</span>
            </div>
        </div>
    `;
    
    // Add click event to navigate to listing detail
    card.addEventListener('click', () => {
        window.location.href = `/listing/${listing.id}`;
    });
    
    return card;
}

// Function to add smooth scrolling
function addSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Function to setup mobile menu
function setupMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (!menuToggle || !mainNav) return;
    
    menuToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
            mainNav.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    });
    
    // Close menu when clicking a link
    mainNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mainNav.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });
}

// Function to setup newsletter subscription
function setupNewsletter() {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (!newsletterForm) return;
    
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailInput = newsletterForm.querySelector('input[type="email"]');
        const email = emailInput.value.trim();
        
        if (!email) {
            showNotification('Please enter your email address', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Thank you for subscribing!', 'success');
                emailInput.value = '';
            } else {
                showNotification(data.message || 'Something went wrong', 'error');
            }
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            showNotification('Unable to subscribe. Please try again later.', 'error');
        }
    });
}

// Function to show notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add scroll animation for elements
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.category-card, .listing-card, .stat-card').forEach(el => {
    observer.observe(el);
}); 