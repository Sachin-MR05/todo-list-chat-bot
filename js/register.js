
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZK0bKgBqfVlcMXq3_vo5x42-QQZPqbVo",
  authDomain: "todo-list-chat-bot.firebaseapp.com",
  projectId: "todo-list-chat-bot",
  storageBucket: "todo-list-chat-bot.firebasestorage.app",
  messagingSenderId: "701330320999",
  appId: "1:701330320999:web:08d8df41178a1f0ae12ec2",
  measurementId: "G-JDJWS4QY69"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
  if (window.gsap) {
    gsap.from('.left-panel', { x: -50, opacity: 0, duration: 0.8, ease: 'power2.out' });
    gsap.from('.card', { y: 30, opacity: 0, duration: 0.6, delay: 0.2, ease: 'power2.out' });
    gsap.from('.form-group, .form-row, .actions button, .divider, .btn-google', {
      y: 10,
      opacity: 0,
      duration: 0.4,
      stagger: 0.1,
      delay: 0.4,
      ease: 'power2.out'
    });
  }

  const form = document.getElementById('registerForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const terms = document.getElementById('terms').checked;

      if (!terms) {
        alert('Please agree to the Terms and Conditions');
        return;
      }

      if (password !== confirmPassword) {
        alert("Passwords don't match");
        return;
      }

      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          // Store new user info in session storage to pass to the dashboard
          sessionStorage.setItem('newUserName', name);
          
          console.log('Registration successful:', user);
          window.location.href = 'dashboard-new.html';
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.error('Registration failed:', errorCode, errorMessage);
          alert(`Registration failed: ${errorMessage}`);
        });
    });
  }
});
