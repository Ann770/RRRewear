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