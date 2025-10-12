document.addEventListener('DOMContentLoaded', () => {
  // GSAP Animations
  if (window.gsap) {
    gsap.from('.left-panel', { x: -50, opacity: 0, duration: 0.8, ease: 'power2.out' });
    gsap.from('.card', { y: 30, opacity: 0, duration: 0.6, delay: 0.2, ease: 'power2.out' });
    
    // Stagger form elements
    gsap.from('.form-group, .form-row, .actions button, .divider, .btn-google', {
      y: 10,
      opacity: 0,
      duration: 0.4,
      stagger: 0.1,
      delay: 0.4,
      ease: 'power2.out'
    });
  }

  // Form Submit Handler
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

      console.log('Registration attempt:', { name, email, password });
      // Simulate success and redirect
      window.location.href = 'dashboard-new.html';
    });

    // Google button handler (simulate)
    const googleBtn = document.querySelector('.btn-google');
    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        console.log('Google registration clicked');
        window.location.href = 'dashboard-new.html';
      });
    }
  }
});
