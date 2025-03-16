// Example of adding interactivity for Listings

// Dynamically load products (this would normally come from a backend API)
const products = [
    { id: 1, name: "T-shirt", description: "Cotton T-shirt", price: "$20", image: "product1.jpg" },
    { id: 2, name: "Jeans", description: "Blue denim jeans", price: "$30", image: "product2.jpg" },
    // Add more products as needed
];

// Render products to the page
const productGrid = document.getElementById('productGrid');

function renderProducts() {
    productGrid.innerHTML = '';  // Clear existing products
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.classList.add('product-item');
        productElement.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h2>${product.name}</h2>
            <p>${product.description}</p>
            <p>${product.price}</p>
            <a href="#" class="button">Add to Wishlist</a>
        `;
        productGrid.appendChild(productElement);
    });
}

// Call the function to render products when page loads
renderProducts();

// Handle the "Add to Wishlist" functionality (example)
const wishlistButtons = document.querySelectorAll('.button');

wishlistButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        event.preventDefault();  // Prevent link behavior
        alert('Item added to wishlist!');
    });
});

// Toggle the dark mode (example functionality)
const darkModeToggle = document.getElementById('darkModeToggle');

darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('dark-mode', 'enabled');
    } else {
        localStorage.setItem('dark-mode', 'disabled');
    }
});

// Check for saved dark mode preference
if (localStorage.getItem('dark-mode') === 'enabled') {
    document.body.classList.add('dark-mode');
} else {
    document.body.classList.remove('dark-mode');
}
