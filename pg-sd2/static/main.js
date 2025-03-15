document.addEventListener("DOMContentLoaded", () => {
    console.log("Main.js loaded");

    // Handling Swap Request Button Click
    const swapButtons = document.querySelectorAll(".button");
    swapButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            alert("Swap request sent!");
        });
    });

    //  Ajax call for search feature
    const searchForm = document.querySelector("#search-form");
    if (searchForm) {
        searchForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const query = document.querySelector("#search-input").value;
            const response = await fetch(`/search/listings?query=${query}`);
            const results = await response.json();
            console.log(results);
        });
    }
});
