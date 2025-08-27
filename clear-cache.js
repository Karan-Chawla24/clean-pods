// Script to clear localStorage and force fresh data load
console.log("Clearing localStorage cache...");

// Clear all localStorage data
localStorage.clear();

// Clear sessionStorage as well
sessionStorage.clear();

console.log("Cache cleared! Please refresh the page to load fresh data.");

// Optionally reload the page
if (confirm("Cache cleared! Would you like to reload the page now?")) {
  window.location.reload();
}
