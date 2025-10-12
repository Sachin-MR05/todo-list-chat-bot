// LifeTrack AI Dashboard - Clean Professional Design

document.addEventListener('DOMContentLoaded', () => {
  initializeCounters();
  initializeCharts();
  initializeNavigation();
  initializeTaskCheckboxes();
  animateCards();
});

// Animated Number Counters
function initializeCounters() {
  const counters = document.querySelectorAll('[data-target]');
  
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const updateCounter = () => {
      current += increment;
      if (current < target) {
        counter.textContent = Math.floor(current);
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target;
      }
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          updateCounter();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(counter);
  });
}

// Initialize Charts
function initializeCharts() {
  // Mini Chart 1 - Line Chart
  const ctx1 = document.getElementById('miniChart1');
  if (ctx1 && window.Chart) {
    new Chart(ctx1, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          data: [75, 82, 68, 90, 85, 78, 92],
          borderColor: '#4A90E2',
          backgroundColor: 'rgba(74, 144, 226, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: { display: false },
          y: { display: false }
        }
      }
    });
  }

  // Progress Ring Animation
  const progressRing = document.querySelector('.progress-ring-fill');
  if (progressRing) {
    const progress = parseInt(progressRing.getAttribute('data-progress'));
    const circumference = 2 * Math.PI * 32;
    const offset = circumference - (progress / 100) * circumference;
    
    setTimeout(() => {
      progressRing.style.strokeDashoffset = offset;
    }, 500);
  }
}

// Navigation Active State
function initializeNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Smooth scroll to section if exists
      const target = link.getAttribute('href');
      if (target && target.startsWith('#')) {
        const section = document.querySelector(target);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Filter Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// Task Checkboxes with Line-through Animation
function initializeTaskCheckboxes() {
  const checkboxes = document.querySelectorAll('.task-checkbox input');
  
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const taskRow = e.target.closest('.task-row');
      const taskTitle = taskRow.querySelector('.task-title');
      
      if (e.target.checked) {
        taskTitle.classList.add('completed');
        if (window.gsap) {
          gsap.to(taskRow, {
            opacity: 0.6,
            duration: 0.3
          });
        }
      } else {
        taskTitle.classList.remove('completed');
        if (window.gsap) {
          gsap.to(taskRow, {
            opacity: 1,
            duration: 0.3
          });
        }
      }
    });
  });
}

// GSAP Card Animations


// Smooth scroll for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
