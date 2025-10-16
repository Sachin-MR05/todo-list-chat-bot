import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch, addDoc, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCZK0bKgBqfVlcMXq3_vo5x42-QQZPqbVo",
    authDomain: "todo-list-chat-bot.firebaseapp.com",
    projectId: "todo-list-chat-bot",
    storageBucket: "todo-list-chat-bot.firebasestorage.app",
    messagingSenderId: "701330320999",
    appId: "1:701330320999:web:08d8df41178a1f0ae12ec2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentFolderId = null;
let currentUserId = null;
let completionChart = null;

// Helper function to get user data
const getUserData = async (userId) => {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    return userDocSnap.exists() ? userDocSnap.data() : null;
};

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentFolderId = urlParams.get('id');

    if (!currentFolderId) {
        document.body.innerHTML = '<h1>Folder not found.</h1><a href="folders.html">Go back to folders</a>';
        return;
    }

    onAuthStateChanged(auth, user => {
        if (user) {
            currentUserId = user.uid;
            loadAllData(currentUserId, currentFolderId);
            initializeAllModals(currentUserId, currentFolderId);
            initializeDeleteFolderButton(currentUserId, currentFolderId);
        } else {
            window.location.href = 'index.html';
        }
    });
});

async function generateRecurringTasks(userId, folderId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to the start of the day for consistent queries
    const dayOfWeek = today.getDay(); // Sunday = 0, Monday = 1, etc.

    const recurringQuery = query(
        collection(db, "recurring_tasks"),
        where("userId", "==", userId),
        where("folderId", "==", folderId),
        where("isActive", "==", true)
    );

    const recurringSnapshot = await getDocs(recurringQuery);

    for (const recurringDoc of recurringSnapshot.docs) {
        const recurringTask = { id: recurringDoc.id, ...recurringDoc.data() };

        const startDate = recurringTask.startDate.toDate();
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = recurringTask.endDate ? recurringTask.endDate.toDate() : null;
        if (endDate) {
            endDate.setHours(0, 0, 0, 0);
        }

        // Check if today is a valid day for this task to run
        const isDayMatch = recurringTask.repeatDays.includes(dayOfWeek);
        const isAfterStartDate = today >= startDate;
        const isBeforeEndDate = !endDate || today <= endDate;

        if (isDayMatch && isAfterStartDate && isBeforeEndDate) {
            // Task is scheduled for today. Check if it has already been created.
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const existingTaskQuery = query(
                collection(db, "tasks"),
                where("userId", "==", userId), // <-- FIX: Ensure query is secure
                where("recurringSourceId", "==", recurringTask.id),
                where("dueDate", ">=", today),
                where("dueDate", "<", tomorrow)
            );

            const existingTaskSnapshot = await getDocs(existingTaskQuery);

            if (existingTaskSnapshot.empty) {
                // Not found, so create it for today.
                await addDoc(collection(db, "tasks"), {
                    userId: userId,
                    folderId: folderId,
                    title: recurringTask.title,
                    dueDate: today,
                    completed: false,
                    isRecurring: true,
                    recurringSourceId: recurringTask.id, // Link to the definition
                    createdAt: serverTimestamp()
                });
            }
        }
    }
}

async function loadAllData(userId, folderId) {
    try {
        // Generate any recurring tasks that are due today before loading all tasks
        await generateRecurringTasks(userId, folderId);

        const [userData, folderSnap, tasksSnapshot, allTasksSnapshot] = await Promise.all([
            getUserData(userId),
            getDoc(doc(db, "folders", folderId)),
            getDocs(query(collection(db, "tasks"), where("folderId", "==", folderId), where("userId", "==", userId))),
            getDocs(query(collection(db, "tasks"), where("userId", "==", userId)))
        ]);

        if (!folderSnap.exists() || folderSnap.data().userId !== userId) {
            document.body.innerHTML = '<h1>Folder not found or access denied.</h1>'; return;
        }
        const folder = { id: folderSnap.id, ...folderSnap.data() };
        const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const allTasks = allTasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (userData) renderHeader(userData);
        renderSidebar(allTasks);
        renderFolderHeader(folder);
        renderTaskLists(tasks);
        renderSummaryPanel(folder, tasks);
        initializeChart(tasks);
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

function initializeAllModals(userId, folderId) {
    // --- Advanced Task Modal --- 
    const taskModal = document.getElementById('taskModal');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const closeTaskModalBtn = document.getElementById('closeTaskModal');
    const cancelTaskBtn = document.getElementById('cancelTaskBtn');
    const taskForm = document.getElementById('taskForm');
    const isRepeatingToggle = document.getElementById('isRepeating');
    const repeatingOptions = document.getElementById('repeatingOptions');
    const singleDateOptions = document.getElementById('singleDateOptions');
    const noEndDateCheckbox = document.getElementById('noEndDate');
    const endDateInput = document.getElementById('endDate');

    if (addTaskBtn && taskModal) {
        addTaskBtn.addEventListener('click', () => {
            taskModal.classList.add('active');
        });
    }

    const closeTaskModal = () => {
        taskModal.classList.remove('active');
        taskForm.reset();
        repeatingOptions.classList.add('hidden');
        singleDateOptions.classList.remove('hidden');
    };
    if(closeTaskModalBtn) closeTaskModalBtn.addEventListener('click', closeTaskModal);
    if(cancelTaskBtn) cancelTaskBtn.addEventListener('click', closeTaskModal);

    isRepeatingToggle.addEventListener('change', () => {
        const isChecked = isRepeatingToggle.checked;
        repeatingOptions.classList.toggle('hidden', !isChecked);
        singleDateOptions.classList.toggle('hidden', isChecked);
    });

    noEndDateCheckbox.addEventListener('change', () => {
        endDateInput.disabled = noEndDateCheckbox.checked;
        if (noEndDateCheckbox.checked) endDateInput.value = '';
    });

    document.getElementById('startDate').valueAsDate = new Date();

    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const taskName = document.getElementById('taskName').value.trim();
        if (!taskName) {
            alert('Task name is required.');
            return;
        }

        try {
            if (isRepeatingToggle.checked) {
                await createRecurringTaskDefinition(folderId);
            } else {
                await createSingleTask(folderId);
            }
            closeTaskModal();
            loadAllData(userId, folderId);
        } catch (error) {
            console.error("Error adding task:", error);
            alert('Failed to add task. ' + error.message);
        }
    });

    // --- Edit Folder Modal --- 
    const editModal = document.getElementById('editFolderModal');
    const editFolderBtn = document.getElementById('editFolderBtn');
    const closeEditFolderModalBtn = document.getElementById('closeEditFolderModal');
    const cancelEditFolderBtn = document.getElementById('cancelEditFolderBtn');
    const editFolderForm = document.getElementById('editFolderForm');

    if(editFolderBtn && editModal) {
        editFolderBtn.addEventListener('click', async () => {
            const folderSnap = await getDoc(doc(db, "folders", folderId));
            const folder = folderSnap.data();
            document.getElementById('editFolderName').value = folder.name;
            document.getElementById('editFolderDescription').value = folder.description;
            renderColorPicker('editFolderColorPicker', folder.color);
            editModal.classList.add('active');
        });
    }
    
    const closeEditModal = () => editModal.classList.remove('active');
    if(closeEditFolderModalBtn) closeEditFolderModalBtn.addEventListener('click', closeEditModal);
    if(cancelEditFolderBtn) cancelEditFolderBtn.addEventListener('click', closeEditModal);

    if(editFolderForm) {
        editFolderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('editFolderName').value;
            const description = document.getElementById('editFolderDescription').value;
            const color = document.querySelector('#editFolderColorPicker input[name="color"]:checked').value;
            await updateDoc(doc(db, "folders", folderId), { name, description, color });
            closeEditModal();
            loadAllData(userId, folderId);
        });
    }
}

async function createSingleTask(folderId) {
    const taskName = document.getElementById('taskName').value.trim();
    const taskDateTime = document.getElementById('taskDateTime').value;
    
    await addDoc(collection(db, 'tasks'), {
        userId: currentUserId,
        folderId: folderId,
        title: taskName,
        dueDate: taskDateTime ? new Date(taskDateTime) : null,
        completed: false,
        isRecurring: false,
        createdAt: serverTimestamp()
    });
}

async function createRecurringTaskDefinition(folderId) {
    const taskName = document.getElementById('taskName').value.trim();
    const repeatDays = Array.from(document.querySelectorAll('input[name="repeatDay"]:checked')).map(cb => parseInt(cb.value));
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const noEndDate = document.getElementById('noEndDate').checked;

    if (repeatDays.length === 0) throw new Error('Please select at least one day for the task to repeat.');
    if (!startDate) throw new Error('A start date is required for repeating tasks.');

    await addDoc(collection(db, 'recurring_tasks'), {
        userId: currentUserId,
        folderId: folderId,
        title: taskName,
        repeatDays: repeatDays, 
        startDate: new Date(startDate),
        endDate: noEndDate ? null : new Date(endDate),
        isActive: true, 
        createdAt: serverTimestamp()
    });
}

function initializeDeleteFolderButton(userId, folderId) {
    const deleteBtn = document.getElementById('deleteFolderBtn');
    if(deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to PERMANENTLY delete this folder and ALL its tasks?')) return;
            
            const batch = writeBatch(db);
            // Also delete recurring task definitions associated with the folder
            const recurringQuery = query(collection(db, "recurring_tasks"), where("folderId", "==", folderId), where('userId', '==', userId));
            const recurringSnap = await getDocs(recurringQuery);
            recurringSnap.forEach(recDoc => batch.delete(recDoc.ref));

            const tasksQuery = query(collection(db, "tasks"), where("folderId", "==", folderId), where('userId', '==', userId));
            const tasksSnap = await getDocs(tasksQuery);
            tasksSnap.forEach(taskDoc => batch.delete(taskDoc.ref));
            
            batch.delete(doc(db, "folders", folderId));

            await batch.commit();
            window.location.href = 'folders.html';
        });
    }
}

function renderHeader(user) {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    topbar.innerHTML = `
        <div class="topbar-left"><img src="assets/logo.svg" alt="LifeTrack AI" class="logo"> <span>LifeTrack AI</span></div>
        <div class="topbar-right">
            <div class="user-menu"><span class="user-name">${user.name || 'User'}</span> <img src="${user.avatar || 'https://i.pravatar.cc/120'}" alt="${user.name || 'User'}" class="user-avatar"></div>
            <button class="btn-logout" id="logoutBtn">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </button>
        </div>
    `;
    
    // Add logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await auth.signOut();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Logout error:', error);
                alert('Failed to logout. Please try again.');
            }
        });
    }
}

function renderSidebar(tasks) {
    const upcomingCount = tasks.filter(t => !t.completed).length;
    const completedCount = tasks.filter(t => t.completed).length;
    const navContainer = document.querySelector('.sidebar-nav');
    if (!navContainer) return;
    navContainer.innerHTML = `
        <a href="dashboard-new.html" class="nav-link"><i class="fas fa-user-circle"></i> Profile</a>
        <a href="folders.html" class="nav-link"><i class="fas fa-folder"></i> Folders</a>
        <a href="upcoming.html" class="nav-link"><i class="fas fa-calendar-alt"></i> Upcoming <span class="count">${upcomingCount}</span></a>
        <a href="completed.html" class="nav-link"><i class="fas fa-check-circle"></i> Completed <span class="count">${completedCount}</span></a>
        <a href="settings.html" class="nav-link"><i class="fas fa-cog"></i> Settings</a>
    `;
}

function renderFolderHeader(folder) {
    document.getElementById('folderTitle').textContent = folder.name;
    document.getElementById('folderDescription').textContent = folder.description;
    const banner = document.querySelector('.folder-banner');
    const icon = document.querySelector('.folder-banner-icon svg');
    banner.style.background = getBannerGradient(folder.color);
    icon.style.stroke = folder.color;
}

function renderTaskLists(tasks) {
    const upcomingList = document.getElementById('upcomingTasksList');
    const completedList = document.getElementById('completedTasksList');
    upcomingList.innerHTML = '';
    completedList.innerHTML = '';

    // Sort tasks by due date, with null dates last
    tasks.sort((a, b) => {
        const dateA = a.dueDate ? a.dueDate.toMillis() : Infinity;
        const dateB = b.dueDate ? b.dueDate.toMillis() : Infinity;
        return dateA - dateB;
    });

    const upcomingTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);
    document.getElementById('upcomingTasksCount').textContent = `${upcomingTasks.length} tasks`;
    document.getElementById('completedTasksCount').textContent = `${completedTasks.length} tasks`;
    if (upcomingTasks.length === 0) upcomingList.innerHTML = '<p class="empty-list">No upcoming tasks.</p>';
    else upcomingTasks.forEach(task => upcomingList.appendChild(createTaskCard(task)));
    if (completedTasks.length === 0) completedList.innerHTML = '<p class="empty-list">No completed tasks.</p>';
    else completedTasks.forEach(task => completedList.appendChild(createTaskCard(task)));
}

function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-card ${task.completed ? 'completed' : ''}`;
    card.dataset.taskId = task.id;
    const dueDate = task.dueDate ? new Date(task.dueDate.seconds * 1000).toLocaleDateString() : 'No date';
    card.innerHTML = `
        <label class="task-checkbox">
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <span class="checkmark"></span>
        </label>
        <div class="task-main">
            <h3 class="task-name">${task.title}</h3>
            <span class="task-time">${task.isRecurring ? 'Today' : dueDate}</span>
        </div>
        <button class="btn-delete-task">&times;</button>
    `;
    card.querySelector('.task-checkbox input').addEventListener('change', (e) => toggleTaskCompletion(task.id, e.target.checked));
    card.querySelector('.btn-delete-task').addEventListener('click', () => deleteTask(task.id));
    return card;
}

async function toggleTaskCompletion(taskId, isCompleted) {
    const taskDocRef = doc(db, "tasks", taskId);
    await updateDoc(taskDocRef, { completed: isCompleted });
    loadAllData(currentUserId, currentFolderId);
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    await deleteDoc(doc(db, "tasks", taskId));
    loadAllData(currentUserId, currentFolderId);
}

function renderSummaryPanel(folder, tasks) {
    const completedCount = tasks.filter(t => t.completed).length;
    const totalCount = tasks.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    document.getElementById('progressValue').textContent = progress;
    document.getElementById('summaryCompleted').textContent = `${completedCount} / ${totalCount}`;
    document.getElementById('summaryUpcoming').textContent = totalCount - completedCount;
    const circle = document.querySelector('.progress-ring-fill');
    if(circle) {
        const radius = circle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (progress / 100) * circumference;
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;
    }
}

function initializeChart(tasks) {
    const ctx = document.getElementById('completionChart')?.getContext('2d');
    if (!ctx) return;
    if (completionChart) completionChart.destroy();
    const labels = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toLocaleDateString('en-US', { weekday: 'short' }); }).reverse();
    const data = labels.map(label => {
        return tasks.filter(task => {
            if (!task.completed || !task.createdAt) return false;
            const completedDate = (task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt)).toLocaleDateString('en-US', { weekday: 'short' });
            return completedDate === label;
        }).length;
    });
    completionChart = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ data, backgroundColor: '#4A90E2', borderRadius: 4 }] }, options: { scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } } });
}

function renderColorPicker(containerId, selectedColor) {
    const colors = ['#FF6B35', '#4A90E2', '#7B68EE', '#4CAF50', '#FF9800'];
    const container = document.getElementById(containerId);
    container.innerHTML = colors.map((color, index) => `
        <input type="radio" name="color" value="${color}" id="edit-color-${index}" ${color === selectedColor ? 'checked' : ''}>
        <label for="edit-color-${index}" class="color-option" style="background: ${color};"></label>
    `).join('');
}

function getBannerGradient(color) {
    const gradients = {
        '#FF6B35': 'linear-gradient(135deg, #FFE5D9 0%, #FFB4A2 100%)',
        '#4A90E2': 'linear-gradient(135deg, #E3F2FD 0%, #90CAF9 100%)',
        '#7B68EE': 'linear-gradient(135deg, #F3E5F5 0%, #CE93D8 100%)',
        '#4CAF50': 'linear-gradient(135deg, #E8F5E9 0%, #A5D6A7 100%)',
        '#FF9800': 'linear-gradient(135deg, #FFF3E0 0%, #FFCC80 100%)'
    };
    return gradients[color] || 'linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)';
}
