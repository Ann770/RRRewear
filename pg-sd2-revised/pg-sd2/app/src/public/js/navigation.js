// Function to update navigation based on user login status
function updateNavigation() {
    const userActions = document.querySelector('.user-actions');
    const mainNav = document.querySelector('.main-nav ul');

    if (!userActions || !mainNav) return;

    // Clear existing user actions
    userActions.innerHTML = '';

    // Get current user
    const user = getCurrentUser();

    if (user) {
        // User is logged in
        userActions.innerHTML = `
            <div class="user-menu">
                <span class="user-name">${user.name}</span>
                <div class="dropdown-menu">
                    <a href="/profile">Profile</a>
                    <a href="/my-closet">My Closet</a>
                    <a href="/messages">Messages</a>
                    <button class="logout-button">Logout</button>
                </div>
            </div>
        `;

        // Add user-specific navigation items
        const userNavItems = [
            { text: 'My Closet', href: '/my-closet' },
            { text: 'Messages', href: '/messages' }
        ];

        userNavItems.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="${item.href}">${item.text}</a>`;
            mainNav.appendChild(li);
        });
    } else {
        // User is not logged in
        userActions.innerHTML = `
            <a href="/login" class="btn-login">Login</a>
            <a href="/register" class="btn-register">Register</a>
        `;

        // Remove user-specific navigation items
        const userNavItems = mainNav.querySelectorAll('li a[href="/my-closet"], li a[href="/messages"]');
        userNavItems.forEach(item => {
            item.parentElement.remove();
        });
    }

    // Add event listener for logout button
    const logoutButton = document.querySelector('.logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}

// Update navigation when page loads
document.addEventListener('DOMContentLoaded', updateNavigation);

// Export function for use in other files
window.updateNavigation = updateNavigation;

// Function to handle logout
function logout() {
    // Clear user session
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Redirect to home page
    window.location.href = '/';
}

// Function to get current user
function getCurrentUser() {
    // Implement the logic to retrieve the current user from localStorage
    // This is a placeholder and should be replaced with the actual implementation
    return JSON.parse(localStorage.getItem('user'));
}

// Function to handle logout
function handleLogout() {
    logout();
}

document.addEventListener('DOMContentLoaded', function() {
    // Notification Icon Toggle
    const notificationIcon = document.querySelector('.notification-icon');
    if (notificationIcon) {
        notificationIcon.addEventListener('click', function() {
            // Toggle notification panel (to be implemented)
            console.log('Notification clicked');
        });
    }

    // Search Icon Toggle
    const searchIcon = document.querySelector('.search-icon');
    const searchOverlay = document.createElement('div');
    searchOverlay.className = 'search-overlay';
    searchOverlay.innerHTML = `
        <div class="search-container">
            <div class="search-header">
                <h3>Search</h3>
                <button class="close-search">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="search-input-container">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Search for items, users, or categories...">
            </div>
            <div class="search-results">
                <div class="search-categories">
                    <button class="active">All</button>
                    <button>Items</button>
                    <button>Users</button>
                    <button>Categories</button>
                </div>
                <div class="results-container">
                    <!-- Results will be populated here -->
                    <p class="no-results">Start typing to search...</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(searchOverlay);

    if (searchIcon) {
        searchIcon.addEventListener('click', function() {
            searchOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            searchOverlay.querySelector('input').focus();
        });
    }

    const closeSearch = searchOverlay.querySelector('.close-search');
    if (closeSearch) {
        closeSearch.addEventListener('click', function() {
            searchOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Close search overlay when clicking outside
    searchOverlay.addEventListener('click', function(e) {
        if (e.target === searchOverlay) {
            searchOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Search Input Handler
    const searchInput = searchOverlay.querySelector('input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const query = this.value.trim();
                if (query.length > 2) {
                    performSearch(query);
                } else {
                    const resultsContainer = searchOverlay.querySelector('.results-container');
                    resultsContainer.innerHTML = '<p class="no-results">Start typing to search...</p>';
                }
            }, 300);
        });
    }

    // Search Category Buttons
    const searchCategories = searchOverlay.querySelectorAll('.search-categories button');
    searchCategories.forEach(button => {
        button.addEventListener('click', function() {
            searchCategories.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const query = searchInput.value.trim();
            if (query.length > 2) {
                performSearch(query, this.textContent.toLowerCase());
            }
        });
    });

    // Perform Search
    function performSearch(query, category = 'all') {
        const resultsContainer = searchOverlay.querySelector('.results-container');
        resultsContainer.innerHTML = '<p class="searching">Searching...</p>';

        // Simulate API call
        setTimeout(() => {
            // Sample results
            const results = {
                items: [
                    { type: 'item', title: 'Blue Denim Jacket', image: 'images/item1.jpg', condition: 'Like New' },
                    { type: 'item', title: 'White Summer Dress', image: 'images/item2.jpg', condition: 'Good' }
                ],
                users: [
                    { type: 'user', name: 'Jane Smith', username: '@janesmith', avatar: 'images/avatar1.jpg' },
                    { type: 'user', name: 'John Doe', username: '@johndoe', avatar: 'images/avatar2.jpg' }
                ],
                categories: [
                    { type: 'category', name: 'Summer Collection', count: 156 },
                    { type: 'category', name: 'Vintage', count: 89 }
                ]
            };

            let filteredResults = [];
            if (category === 'all') {
                filteredResults = [
                    ...results.items,
                    ...results.users,
                    ...results.categories
                ];
            } else {
                filteredResults = results[category] || [];
            }

            if (filteredResults.length > 0) {
                resultsContainer.innerHTML = filteredResults.map(result => {
                    switch (result.type) {
                        case 'item':
                            return `
                                <div class="search-result-item">
                                    <img src="${result.image}" alt="${result.title}">
                                    <div class="result-details">
                                        <h4>${result.title}</h4>
                                        <p>Condition: ${result.condition}</p>
                                    </div>
                                </div>
                            `;
                        case 'user':
                            return `
                                <div class="search-result-user">
                                    <img src="${result.avatar}" alt="${result.name}">
                                    <div class="result-details">
                                        <h4>${result.name}</h4>
                                        <p>${result.username}</p>
                                    </div>
                                </div>
                            `;
                        case 'category':
                            return `
                                <div class="search-result-category">
                                    <div class="result-details">
                                        <h4>${result.name}</h4>
                                        <p>${result.count} items</p>
                                    </div>
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            `;
                        default:
                            return '';
                    }
                }).join('');
            } else {
                resultsContainer.innerHTML = '<p class="no-results">No results found</p>';
            }
        }, 500);
    }

    // Add styles for search overlay
    const style = document.createElement('style');
    style.textContent = `
        .search-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: flex-start;
            padding-top: 80px;
            z-index: 1000;
        }

        .search-overlay.active {
            display: flex;
        }

        .search-container {
            background: white;
            width: 100%;
            max-width: 600px;
            border-radius: 15px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            margin: 0 20px;
        }

        .search-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #eee;
        }

        .search-header h3 {
            margin: 0;
            font-size: 20px;
            color: #333;
        }

        .close-search {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #666;
        }

        .search-input-container {
            position: relative;
            padding: 20px;
        }

        .search-input-container i {
            position: absolute;
            left: 35px;
            top: 50%;
            transform: translateY(-50%);
            color: #666;
        }

        .search-input-container input {
            width: 100%;
            padding: 12px 20px 12px 40px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            outline: none;
        }

        .search-input-container input:focus {
            border-color: var(--sea-blue);
        }

        .search-categories {
            display: flex;
            gap: 10px;
            padding: 0 20px;
            margin-bottom: 15px;
        }

        .search-categories button {
            padding: 8px 16px;
            border: none;
            border-radius: 20px;
            background: #f0f0f0;
            color: #666;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .search-categories button.active {
            background: var(--sea-blue);
            color: white;
        }

        .results-container {
            max-height: 400px;
            overflow-y: auto;
            padding: 20px;
        }

        .no-results,
        .searching {
            text-align: center;
            color: #666;
            padding: 20px;
        }

        .search-result-item,
        .search-result-user,
        .search-result-category {
            display: flex;
            align-items: center;
            padding: 10px;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }

        .search-result-item:hover,
        .search-result-user:hover,
        .search-result-category:hover {
            background-color: #f8f8f8;
        }

        .search-result-item img,
        .search-result-user img {
            width: 50px;
            height: 50px;
            object-fit: cover;
            border-radius: 8px;
            margin-right: 15px;
        }

        .result-details {
            flex: 1;
        }

        .result-details h4 {
            margin: 0 0 5px;
            color: #333;
        }

        .result-details p {
            margin: 0;
            color: #666;
            font-size: 14px;
        }

        .search-result-category {
            justify-content: space-between;
        }

        .search-result-category i {
            color: #666;
        }

        @media (max-width: 480px) {
            .search-overlay {
                padding-top: 20px;
            }

            .search-container {
                margin: 0 10px;
            }

            .search-categories {
                overflow-x: auto;
                padding-bottom: 10px;
            }

            .search-categories button {
                white-space: nowrap;
            }
        }
    `;
    document.head.appendChild(style);
}); 