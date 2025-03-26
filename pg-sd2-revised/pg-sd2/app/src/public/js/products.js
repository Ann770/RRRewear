document.addEventListener('DOMContentLoaded', function() {
    const productGrid = document.getElementById('productGrid');
    const filterInputs = document.querySelectorAll('.filter-group input');
    const searchInput = document.querySelector('.search-input');
    const currentCategory = window.location.pathname.includes('women') ? 'Women' : 'Men';

    // Function to create product card
    function createProductCard(product) {
        return `
            <div class="product-card">
                <img src="${product.image_url || 'images/placeholder.jpg'}" alt="${product.title}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-brand">${product.brand || 'Brand not specified'}</p>
                    <span class="product-condition">${product.condition_status}</span>
                    <p class="product-size">Size: ${product.size || 'Not specified'}</p>
                    <p class="product-seller">Seller: ${product.seller_name || 'Anonymous'}</p>
                    <button class="view-button" onclick="viewProduct(${product.id})">View Details</button>
                </div>
            </div>
        `;
    }

    // Function to load products
    async function loadProducts(endpoint, targetElementId) {
        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            const targetElement = document.getElementById(targetElementId);
            if (!targetElement) return;

            if (data.success && data.products.length > 0) {
                targetElement.innerHTML = data.products.map(createProductCard).join('');
            } else {
                targetElement.innerHTML = '<p class="no-products">No products found</p>';
            }
        } catch (error) {
            console.error('Error loading products:', error);
            const targetElement = document.getElementById(targetElementId);
            if (targetElement) {
                targetElement.innerHTML = '<p class="error-message">Error loading products. Please try again later.</p>';
            }
        }
    }

    // Function to handle search
    async function handleSearch(event) {
        event.preventDefault();
        const searchInput = document.querySelector('.search-input');
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm) {
            window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`;
        }
    }

    // Function to view product details
    function viewProduct(productId) {
        window.location.href = `/product/${productId}`;
    }

    // Function to handle filter changes
    function handleFilterChange() {
        const filters = {
            condition: Array.from(document.querySelectorAll('input[name="condition"]:checked')).map(cb => cb.value),
            size: Array.from(document.querySelectorAll('input[name="size"]:checked')).map(cb => cb.value),
            brand: Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(cb => cb.value)
        };

        const searchParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, values]) => {
            if (values.length > 0) {
                searchParams.append(key, values.join(','));
            }
        });

        const currentUrl = new URL(window.location.href);
        currentUrl.search = searchParams.toString();
        window.location.href = currentUrl.toString();
    }

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        // Load new arrivals and featured products on the home page
        if (document.getElementById('newArrivalsGrid')) {
            loadProducts('/api/products/new-arrivals', 'newArrivalsGrid');
        }
        if (document.getElementById('featuredGrid')) {
            loadProducts('/api/products/featured', 'featuredGrid');
        }

        // Add search form handler
        const searchForm = document.querySelector('.search-bar');
        if (searchForm) {
            searchForm.addEventListener('submit', handleSearch);
        }

        // Add filter change handlers
        const filterInputs = document.querySelectorAll('.filter-option input');
        filterInputs.forEach(input => {
            input.addEventListener('change', handleFilterChange);
        });

        // Add search input handler for real-time search
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (event) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    const searchTerm = event.target.value.trim();
                    if (searchTerm.length >= 2) {
                        window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`;
                    }
                }, 500);
            });
        }
    });
}); 