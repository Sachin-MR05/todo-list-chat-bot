document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('test-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Test form submitted, default prevented.');
    alert('Test form submitted, default prevented.');
  });
});