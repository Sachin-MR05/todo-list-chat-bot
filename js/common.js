// Common JavaScript for all pages - LifeTrack AI

// Load sidebar component
async function loadSidebar() {
  const sidebarContainer = document.getElementById('sidebar-container');
  if (!sidebarContainer) return;
  
  try {
    const response = await fetch('components/sidebar.html');
    const html = await response.text();
    sidebarContainer.innerHTML = html;
  } catch (error) {
    console.error('Error loading sidebar:', error);
  }
}

// Initialize common features
document.addEventListener('DOMContentLoaded', () => {
  loadSidebar();
});
