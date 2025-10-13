import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZK0bKgBqfVlcMXq3_vo5x42-QQZPqbVo",
  authDomain: "todo-list-chat-bot.firebaseapp.com",
  projectId: "todo-list-chat-bot",
  storageBucket: "todo-list-chat-bot.firebasestorage.app",
  messagingSenderId: "701330320999",
  appId: "1:701330320999:web:08d8df41178a1f0ae12ec2",
  measurementId: "G-JDJWS4QY69"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log("DOM content loaded. Initializing app.");

    // GSAP Animations
    if (window.gsap) {
        gsap.set(['.left-panel', '.card', '.form-group', '.form-row', '.actions button', '.divider', '.btn-google'], { autoAlpha: 0, y: 10 });
        gsap.to('.left-panel', { x: 0, autoAlpha: 1, duration: 0.8, ease: 'power2.out' });
        gsap.to('.card', { y: 0, autoAlpha: 1, duration: 0.6, delay: 0.15, ease: 'power2.out' });
        gsap.to('.form-group, .form-row, .actions button, .divider, .btn-google', {
          y: 0,
          autoAlpha: 1,
          duration: 0.45,
          stagger: 0.09,
          delay: 0.35,
          ease: 'power2.out'
        });
    }

    const loginForm = document.getElementById('login-form');
    if (!loginForm) {
        console.error("Login form not found!");
        return;
    }
    console.log("Login form found.");

    const googleSignInButton = document.getElementById('google-signin');
    if (!googleSignInButton) {
        console.error("Google sign-in button not found!");
        return;
    }
    console.log("Google sign-in button found.");

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Login form submitted.");
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            console.log("Attempting to sign in with email and password.");
            await signInWithEmailAndPassword(auth, email, password);
            console.log("Sign-in successful. Redirecting...");
            window.location.href = 'dashboard-new.html';
        } catch (error) {
            console.error("Login failed:", error);
            alert(error.message);
        }
    });

    googleSignInButton.addEventListener('click', async () => {
        console.log("Google sign-in button clicked.");
        const provider = new GoogleAuthProvider();
        try {
            console.log("Attempting to sign in with Google.");
            await signInWithPopup(auth, provider);
            console.log("Google sign-in successful. Redirecting...");
            window.location.href = 'dashboard-new.html';
        } catch (error) {
            console.error("Google sign-in failed:", error);
            alert(error.message);
        }
    });

    console.log("App initialization complete. Event listeners are attached.");

  } catch(e) {
      console.error("An error occurred during app initialization:", e);
      alert("A critical error occurred. Check the console for details.");
  }
});