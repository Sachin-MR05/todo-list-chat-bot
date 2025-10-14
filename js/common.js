import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyCZK0bKgBqfVlcMXq3_vo5x42-QQZPqbVo",
    authDomain: "todo-list-chat-bot.firebaseapp.com",
    projectId: "todo-list-chat-bot",
    storageBucket: "todo-list-chat-bot.appspot.com",
    messagingSenderId: "701330320999",
    appId: "1:701330320999:web:08d8df41178a1f0ae12ec2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Common.js - Load sidebar and topbar components

async function loadComponent(selector, componentPath) {
  try {
    const response = await fetch(componentPath);
    const html = await response.text();
    const element = document.querySelector(selector);
    if (element) {
      element.outerHTML = html;
      // After loading, attach logout listener
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await signOut(auth);
            localStorage.removeItem('userData');
            window.location.href = 'index.html';
          } catch (error) {
            console.error('Logout error:', error);
          }
        });
      }
    }
  } catch (error) {
    console.error(`Error loading component ${componentPath}:`, error);
  }
}

// Load components when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await loadComponent('.sidebar', 'components/sidebar.html');
  await loadComponent('.topbar', 'components/topbar.html');
});

export { loadComponent };
