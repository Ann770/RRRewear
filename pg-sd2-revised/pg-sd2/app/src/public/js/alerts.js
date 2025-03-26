// Function to show an alert message
function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    // Add alert to the page
    document.body.appendChild(alert);

    // Remove alert after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Function to show success message
function showSuccess(message) {
    showAlert(message, 'success');
}

// Function to show error message
function showError(message) {
    showAlert(message, 'error');
}

// Function to show warning message
function showWarning(message) {
    showAlert(message, 'warning');
}

// Function to show info message
function showInfo(message) {
    showAlert(message, 'info');
}

// Export functions for use in other files
window.showAlert = showAlert;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo; 