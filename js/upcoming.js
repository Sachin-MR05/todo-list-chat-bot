// Upcoming Tasks Page - LifeTrack AI

document.addEventListener('DOMContentLoaded', () => {
  initializeFilters();
  initializeModal();
  initializeTaskInteractions();
  initializeChart();
  animateTasks();
});

// Filter Functionality
function initializeFilters() {
  const filterBtns = document.querySelectorAll('.tab-btn');
  const taskCards = document.querySelectorAll('.task-card');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filter = btn.getAttribute('data-filter');
      
      // Filter tasks
      taskCards.forEach(card => {
        const dueType = card.getAttribute('data-due');
        
        if (filter === 'all') {
          card.style.display = 'flex';
        } else if (filter === dueType) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// Modal Functionality
function initializeModal() {
  const modal = document.getElementById('taskModal');
  const addBtn = document.getElementById('addTaskBtn');
  const closeBtn = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const form = document.getElementById('taskForm');

  const openModal = () => {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    form.reset();
  };

  addBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const taskName = document.getElementById('taskName').value;
    const taskFolder = document.getElementById('taskFolder').value;
    const taskDate = document.getElementById('taskDate').value;
    const taskRepeat = document.getElementById('taskRepeat').checked;
    
    console.log('Creating task:', { taskName, taskFolder, taskDate, taskRepeat });
    
    closeModal();
    showSuccessNotification('Task added successfully!');
  });
}

// Success Notification
function showSuccessNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 32px;
    background: #4CAF50;
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 2000;
    font-weight: 500;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  if (window.gsap) {
    gsap.from(notification, { x: 100, opacity: 0, duration: 0.3 });
    gsap.to(notification, {
      x: 100,
      opacity: 0,
      duration: 0.3,
      delay: 3,
      onComplete: () => notification.remove()
    });
  } else {
    setTimeout(() => notification.remove(), 3000);
  }
}

// Task Interactions
function initializeTaskInteractions() {
  const checkboxes = document.querySelectorAll('.task-card .task-checkbox input');
  
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const taskCard = e.target.closest('.task-card');
      const taskTitle = taskCard.querySelector('.task-title');
      
      if (e.target.checked) {
        taskTitle.classList.add('completed');
        
        if (window.gsap) {
          gsap.to(taskCard, {
            x: 100,
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
              taskCard.remove();
              showSuccessNotification('Task completed! 🎉');
            }
          });
        } else {
          setTimeout(() => {
            taskCard.remove();
            showSuccessNotification('Task completed! 🎉');
          }, 300);
        }
      }
    });
  });

  // Animate time bars
  const timeFills = document.querySelectorAll('.time-fill');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const width = entry.target.style.width;
        entry.target.style.width = '0%';
        setTimeout(() => {
          entry.target.style.width = width;
        }, 100);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  timeFills.forEach(fill => observer.observe(fill));
}

// Initialize Chart
function initializeChart() {
  const ctx = document.getElementById('upcomingChart');
  if (!ctx || !window.Chart) return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Tasks Due',
        data: [3, 5, 2, 4, 6, 3, 2],
        borderColor: '#4A90E2',
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#4A90E2'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#2c3e50',
          bodyColor: '#6c757d',
          borderColor: '#e9ecef',
          borderWidth: 1,
          padding: 10
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 2,
            font: { size: 11 },
            color: '#6c757d'
          },
          grid: {
            color: '#f5f6f7'
          }
        },
        x: {
          ticks: {
            font: { size: 11 },
            color: '#6c757d'
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// GSAP Animations
function animateTasks() {
  if (!window.gsap) return;

  const cards = document.querySelectorAll('.task-card');
  
  gsap.from(cards, {
    y: 30,
    opacity: 0,
    duration: 0.5,
    stagger: 0.1,
    ease: 'power2.out'
  });

  gsap.from('.stats-panel', {
    x: 50,
    opacity: 0,
    duration: 0.8,
    delay: 0.3,
    ease: 'power2.out'
  });

  gsap.from('.fab', {
    scale: 0,
    opacity: 0,
    duration: 0.5,
    delay: 0.6,
    ease: 'back.out(1.7)'
  });
}
