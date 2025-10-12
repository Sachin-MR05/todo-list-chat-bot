document.addEventListener('DOMContentLoaded', () => {
  // GSAP Animations
  if (window.gsap) {
    gsap.from('.left-panel', { x: -50, opacity: 0, duration: 0.8, ease: 'power2.out' });
    gsap.from('.card', { y: 30, opacity: 0, duration: 0.6, delay: 0.2, ease: 'power2.out' });
    
    // Stagger form elements
    gsap.from('.form-group, .actions button, .divider, .btn-google', {
      y: 10,
      opacity: 0,
      duration: 0.4,
      stagger: 0.1,
      delay: 0.4,
      ease: 'power2.out'
    });
  }

  // Form Submit Handler
  const form = document.getElementById('forgotForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;

      if (!email) {
        alert('Please enter your email address');
        return;
      }

      console.log('Password reset request for:', email);
      alert(`Reset link sent to ${email}`);
      // Redirect back to login
      window.location.href = 'index.html';
    });
  }
});
