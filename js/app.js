document.addEventListener('DOMContentLoaded', () => {
  // GSAP Animations
  if (window.gsap) {
    // Set initial hidden state (prevents flash of unstyled content)
    gsap.set(['.left-panel', '.card', '.form-group', '.form-row', '.actions button', '.divider', '.btn-google'], { autoAlpha: 0, y: 10 });

    // Animate panels and card in sequence
    gsap.to('.left-panel', { x: 0, autoAlpha: 1, duration: 0.8, ease: 'power2.out' });
    gsap.to('.card', { y: 0, autoAlpha: 1, duration: 0.6, delay: 0.15, ease: 'power2.out' });

    // Stagger form elements into view
    gsap.to('.form-group, .form-row, .actions button, .divider, .btn-google', {
      y: 0,
      autoAlpha: 1,
      duration: 0.45,
      stagger: 0.09,
      delay: 0.35,
      ease: 'power2.out'
    });
  }

  // Form Submit Handler
  const form = document.querySelector('.form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      console.log('Login attempt:', { email, password });
      // Simulate success and redirect
      window.location.href = 'dashboard-new.html';
    });

    // Google button handler (simulate)
    const googleBtn = document.querySelector('.btn-google');
    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        console.log('Google login clicked');
        window.location.href = 'register.html';
      });
    }
  }
});
