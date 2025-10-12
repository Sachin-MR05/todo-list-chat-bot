// Folder Detail Page - LifeTrack AI

document.addEventListener('DOMContentLoaded', () => {
  loadFolderData();
  initializeModal();
  initializeTaskInteractions();
  initializeChart();
  animateProgressRing();
  animatePage();
});

// Load Folder Data from URL
function loadFolderData() {
  const urlParams = new URLSearchParams(window.location.search);
  const folderId = urlParams.get('id');
  
  // Mock data - in real app, fetch from backend
  const folderData = {
    '1': {
      name: 'Morning Routine',
      description: 'Daily tasks to start the day right and maintain consistency',
      color: 'linear-gradient(135deg, #FFE5D9 0%, #FFB4A2 100%)',
      iconColor: '#FF6B35'
    },
    '2': {
      name: 'Tablets',
      description: 'Medication schedule and health supplements tracking',
      color: 'linear-gradient(135deg, #E3F2FD 0%, #90CAF9 100%)',
      iconColor: '#4A90E2'
    },
    '3': {
      name: 'Pregnancy Check',
      description: 'Prenatal care tasks and health monitoring',
      color: 'linear-gradient(135deg, #F3E5F5 0%, #CE93D8 100%)',
      iconColor: '#7B68EE'
    }
  };

  const folder = folderData[folderId] || folderData['1'];
  
  // Update page with folder data
  document.getElementById('folderTitle').textContent = folder.name;
  document.getElementById('folderDescription').textContent = folder.description;
  
  const banner = document.querySelector('.folder-banner');
  banner.style.background = folder.color;
  
  const icon = document.querySelector('.folder-banner-icon svg');
  icon.setAttribute('stroke', folder.iconColor);
}

// Modal Functionality
function initializeModal() {
  const modal = document.getElementById('taskModal');
  const addBtn = document.getElementById('addTaskBtn');
  const closeBtn = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const form = document.getElementById('taskForm');
  const repeatCheckbox = document.getElementById('taskRepeat');
  const repeatOptions = document.getElementById('repeatOptions');

  const openModal = () => {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    form.reset();
    repeatOptions.style.display = 'none';
  };

  addBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  // Toggle repeat options
  repeatCheckbox.addEventListener('change', (e) => {
    repeatOptions.style.display = e.target.checked ? 'block' : 'none';
  });

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
    const taskDateTime = document.getElementById('taskDateTime').value;
    const isRepeating = repeatCheckbox.checked;
    
    let repeatData = null;
    if (isRepeating) {
      const selectedDays = Array.from(document.querySelectorAll('input[name="day"]:checked'))
        .map(cb => cb.value);
      const repeatEnd = document.querySelector('input[name="repeatEnd"]:checked').value;
      const endDate = repeatEnd === 'date' ? document.getElementById('repeatEndDate').value : null;
      
      repeatData = { days: selectedDays, endType: repeatEnd, endDate };
    }
    
    console.log('Creating task:', { taskName, taskDateTime, isRepeating, repeatData });
    
    closeModal();
    showSuccessNotification('Task added successfully!');
    
    // In real app, add task to list dynamically
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
  const checkboxes = document.querySelectorAll('.task-card:not(.completed) .task-checkbox input');
  
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const taskCard = e.target.closest('.task-card');
      const taskName = taskCard.querySelector('.task-name');
      
      if (e.target.checked) {
        taskCard.classList.add('completed');
        taskName.style.textDecoration = 'line-through';
        
        if (window.gsap) {
          gsap.to(taskCard, {
            opacity: 0.7,
            x: 10,
            duration: 0.5,
            onComplete: () => {
              showSuccessNotification('Task completed! 🎉');
              // In real app, move to completed section
            }
          });
        } else {
          setTimeout(() => {
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
  const ctx = document.getElementById('completionChart');
  if (!ctx || !window.Chart) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Tasks Completed',
        data: [2, 3, 1, 2, 4, 2, 3],
        backgroundColor: 'rgba(74, 144, 226, 0.8)',
        borderColor: '#4A90E2',
        borderWidth: 1,
        borderRadius: 4
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
          padding: 10,
          callbacks: {
            label: (context) => ` ${context.parsed.y} tasks`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: { size: 10 },
            color: '#6c757d'
          },
          grid: {
            color: '#f5f6f7'
          }
        },
        x: {
          ticks: {
            font: { size: 10 },
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

// Animate Progress Ring
function animateProgressRing() {
  const progressValue = parseInt(document.getElementById('progressValue').textContent);
  const circle = document.querySelector('.progress-ring-fill');
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressValue / 100) * circumference;
  
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  circle.style.strokeDashoffset = circumference;
  
  setTimeout(() => {
    circle.style.strokeDashoffset = offset;
  }, 500);
}

// GSAP Animations
function animatePage() {
  if (!window.gsap) return;

  // Animate header


  // Animate task sections
  const sections = document.querySelectorAll('.task-section');
  gsap.from(sections, {
    y: 40,
    opacity: 0,
    duration: 0.6,
    stagger: 0.2,
    delay: 0.3,
    ease: 'power2.out'
  });

  // Animate summary panel
  gsap.from('.summary-panel', {
    x: 50,
    opacity: 0,
    duration: 0.8,
    delay: 0.5,
    ease: 'power2.out'
  });

  // FAB is now always visible without animation

  // Hover effects for task cards
  const taskCards = document.querySelectorAll('.task-card');
  taskCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        x: 6,
        duration: 0.3,
        ease: 'power2.out'
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        x: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
  });
}

// Delete Folder
document.getElementById('deleteFolderBtn').addEventListener('click', () => {
  if (confirm('Are you sure you want to delete this folder? All tasks will be removed.')) {
    console.log('Deleting folder...');
    showSuccessNotification('Folder deleted successfully');
    setTimeout(() => {
      window.location.href = 'folders.html';
    }, 1500);
  }
});

// Edit Folder
document.getElementById('editFolderBtn').addEventListener('click', () => {
  console.log('Edit folder functionality - would open edit modal');
  // In real app, open edit modal with current folder data
});
