// Filter functionality for listings
document.addEventListener('DOMContentLoaded', function() {
    const categoryFilter = document.getElementById('category-filter');
    const sizeFilter = document.getElementById('size-filter');
    const conditionFilter = document.getElementById('condition-filter');
  
    if (categoryFilter && sizeFilter && conditionFilter) {
      function applyFilters() {
        const category = categoryFilter.value;
        const size = sizeFilter.value;
        const condition = conditionFilter.value;
  
        // Add your filter logic here
        console.log('Applying filters:', { category, size, condition });
      }
  
      categoryFilter.addEventListener('change', applyFilters);
      sizeFilter.addEventListener('change', applyFilters);
      conditionFilter.addEventListener('change', applyFilters);
    }
  
    // Swap request functionality
    const requestSwapBtn = document.getElementById('request-swap');
    if (requestSwapBtn) {
      requestSwapBtn.addEventListener('click', function() {
        // Add your swap request logic here
        console.log('Requesting swap...');
      });
    }
  
    // Wishlist functionality
    const addToWishlistBtn = document.getElementById('add-to-wishlist');
    if (addToWishlistBtn) {
      addToWishlistBtn.addEventListener('click', function() {
        // Add your wishlist logic here
        console.log('Adding to wishlist...');
      });
    }
  
    // Message owner functionality
    const messageOwnerBtn = document.getElementById('message-owner');
    if (messageOwnerBtn) {
      messageOwnerBtn.addEventListener('click', function() {
        // Add your messaging logic here
        console.log('Opening message dialog...');
      });
    }
  
    // Image upload preview
    const imageUpload = document.getElementById('image-upload');
    const uploadBox = document.querySelector('.upload-box');
    
    if (imageUpload && uploadBox) {
      uploadBox.addEventListener('click', function() {
        imageUpload.click();
      });
      
      imageUpload.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = function(e) {
            uploadBox.innerHTML = `
              <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 100%; object-fit: contain;">
            `;
          };
          reader.readAsDataURL(e.target.files[0]);
        }
      });
    }
  });

// Format date to a more readable format
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Create an item card element
function createItemCard(item) {
    return `
        <div class="item-card">
            <div class="item-image">
                <img src="${item.image_url || '/images/placeholder.jpg'}" alt="${item.title}">
            </div>
            <div class="item-details">
                <h3 class="item-title">${item.title}</h3>
                <p class="item-category">${item.category_name}</p>
                <p class="item-seller">By ${item.seller_name}</p>
                <p class="item-date">Listed on ${formatDate(item.created_at)}</p>
                <p class="item-price">$${item.price.toFixed(2)}</p>
            </div>
            <div class="item-actions">
                <a href="/items/${item.id}" class="btn btn-primary">View Details</a>
                <button class="favorite-btn" data-item-id="${item.id}">
                    <i class="far fa-heart"></i>
                </button>
            </div>
        </div>
    `;
}

// Load latest items from the API
async function loadLatestItems() {
    try {
        const response = await fetch('/api/latest-items');
        if (!response.ok) {
            throw new Error('Failed to fetch latest items');
        }

        const items = await response.json();
        const itemsGrid = document.getElementById('latest-items');
        
        if (itemsGrid) {
            itemsGrid.innerHTML = items.map(item => createItemCard(item)).join('');
            
            // Add event listeners to favorite buttons
            const favoriteButtons = itemsGrid.querySelectorAll('.favorite-btn');
            favoriteButtons.forEach(button => {
                button.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const itemId = button.dataset.itemId;
                    try {
                        const response = await fetch(`/api/items/${itemId}/favorite`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (response.ok) {
                            const icon = button.querySelector('i');
                            icon.classList.toggle('far');
                            icon.classList.toggle('fas');
                            icon.classList.toggle('text-danger');
                        }
                    } catch (error) {
                        console.error('Error toggling favorite:', error);
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error loading latest items:', error);
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Load latest items if the grid exists
    const itemsGrid = document.getElementById('latest-items');
    if (itemsGrid) {
        loadLatestItems();
    }

    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
    }

    // Search form submission
    const searchForm = document.querySelector('.search-bar form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchInput = searchForm.querySelector('input');
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `/search?q=${encodeURIComponent(query)}`;
            }
        });
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseenter', (e) => {
            const tooltipText = e.target.dataset.tooltip;
            const tooltipEl = document.createElement('div');
            tooltipEl.className = 'tooltip';
            tooltipEl.textContent = tooltipText;
            document.body.appendChild(tooltipEl);
            
            const rect = e.target.getBoundingClientRect();
            tooltipEl.style.top = `${rect.top - tooltipEl.offsetHeight - 10}px`;
            tooltipEl.style.left = `${rect.left + (rect.width - tooltipEl.offsetWidth) / 2}px`;
            
            e.target.addEventListener('mouseleave', () => {
                tooltipEl.remove();
            }, { once: true });
        });
    });
}); 