// Function to show alert message
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        ${message}
        <button class="alert-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

// Function to handle registration
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate passwords match
    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store user data and token in localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            
            // Show success message
            showAlert('Registration successful!');
            
            // Redirect to profile page
            window.location.href = '/profile';
        } else {
            showAlert(data.message || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        showAlert('An error occurred. Please try again.', 'error');
        console.error('Registration error:', error);
    }
}

// Function to handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store user data and token in localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            
            // Show success message
            showAlert('Login successful! Redirecting to profile...');
            
            // Add a small delay before redirecting to show the success message
            setTimeout(() => {
                window.location.href = '/profile';
            }, 1500);
        } else {
            showAlert(data.message || 'Login failed. Please try again.', 'error');
        }
    } catch (error) {
        showAlert('An error occurred. Please try again.', 'error');
        console.error('Login error:', error);
    }
}

// Function to handle logout
function handleLogout() {
    // Clear user data and token from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Show success message
    showAlert('Logged out successfully');
    
    // Redirect to home page
    window.location.href = '/';
}

// Function to check if user is logged in
function isLoggedIn() {
    return !!localStorage.getItem('user') && !!localStorage.getItem('token');
}

// Function to get current user
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Function to get auth token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Add event listeners for forms
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutButton = document.querySelector('.logout-button');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // Add password visibility toggle
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            button.querySelector('i').classList.toggle('fa-eye');
            button.querySelector('i').classList.toggle('fa-eye-slash');
        });
    });

    // Social authentication handlers
    const googleButton = document.querySelector('.social-button.google');
    const facebookButton = document.querySelector('.social-button.facebook');

    if (googleButton) {
        googleButton.addEventListener('click', () => {
            // Implement Google OAuth login
            window.location.href = '/auth/google';
        });
    }

    if (facebookButton) {
        facebookButton.addEventListener('click', () => {
            // Implement Facebook OAuth login
            window.location.href = '/auth/facebook';
        });
    }
});

// Export functions for use in other files
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.isLoggedIn = isLoggedIn;
window.getCurrentUser = getCurrentUser;
window.getAuthToken = getAuthToken; 