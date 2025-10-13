
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCZK0bKgBqfVlcMXq3_vo5x42-QQZPqbVo",
    authDomain: "todo-list-chat-bot.firebaseapp.com",
    projectId: "todo-list-chat-bot",
    storageBucket: "todo-list-chat-bot.appspot.com",
    messagingSenderId: "701330320999",
    appId: "1:701330320999:web:08d8df41178a1f0ae12ec2"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let tasksChart = null;
let currentUserId = null;

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, user => {
        if (user) {
            currentUserId = user.uid;
            loadPageData(currentUserId);
            initializeFolderModal(currentUserId);
        } else {
            // Redirection is handled by common.js
        }
    });
});

async function loadPageData(userId) {
    const foldersGrid = document.querySelector('.folders-grid');
    if (!foldersGrid) return;
    foldersGrid.innerHTML = '<p>Loading folders...</p>';

    try {
        const [foldersSnapshot, tasksSnapshot] = await Promise.all([
            getDocs(query(collection(db, "folders"), where("userId", "==", userId))),
            getDocs(query(collection(db, "tasks"), where("userId", "==", userId)))
        ]);

        const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const folders = foldersSnapshot.docs.map(doc => {
            const folderData = { id: doc.id, ...doc.data() };
            const folderTasks = tasks.filter(task => task.folderId === folderData.id);
            const completedTasks = folderTasks.filter(task => task.completed).length;
            const progress = folderTasks.length > 0 ? Math.round((completedTasks / folderTasks.length) * 100) : 0;
            return { ...folderData, taskCount: folderTasks.length, completedCount: completedTasks, progress };
        });

        renderFolders(folders, userId);
        updateStatsPanel(folders, tasks);
        updateDoughnutChart(folders);

    } catch (error) {
        console.error("Error loading page data: ", error);
        foldersGrid.innerHTML = '<p class="error">Could not load folders.</p>';
    }
}

function renderFolders(folders, userId) {
    const foldersGrid = document.querySelector('.folders-grid');
    foldersGrid.innerHTML = '';

    folders.forEach(folder => {
        const card = createFolderCard(folder, userId);
        foldersGrid.appendChild(card);
    });

    const createCard = createNewFolderCard();
    foldersGrid.appendChild(createCard);
}

function createFolderCard(folder, userId) {
    const card = document.createElement('div');
    card.className = 'folder-card';
    const bannerBg = getBannerGradient(folder.color);

    card.innerHTML = `
        <div class="folder-actions">
            <button class="action-btn edit-btn" title="Edit Folder"><svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83l3.75 3.75l1.83-1.83z"/></svg></button>
            <button class="action-btn delete-btn" title="Delete Folder"><svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
        </div>
        <div class="folder-banner" style="background: ${bannerBg};">
            <div class="folder-banner-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${folder.color || '#000'}" stroke-width="2"><use href="assets/icons.svg#folder"></use></svg>
            </div>
        </div>
        <div class="folder-content" data-folder-id="${folder.id}">
            <h3 class="folder-title">${folder.name}</h3>
            <p class="folder-description">${folder.description || 'No description'}</p>
            <div class="folder-progress">
                <div class="progress-bar"><div class="progress-fill" style="width: ${folder.progress}%; background-color:${folder.color};"></div></div>
                <span class="progress-text">${folder.progress}% Complete</span>
            </div>
        </div>
    `;
    
    // Main card click navigates to detail page
    card.querySelector('.folder-content').addEventListener('click', () => {
        window.location.href = `folder-detail.html?id=${folder.id}`;
    });

    // Edit button opens modal
    card.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openFolderModal(folder);
    });

    // Delete button triggers deletion
    card.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFolder(folder.id, userId);
    });

    return card;
}

async function deleteFolder(folderId, userId) {
    if (!confirm("Are you sure you want to delete this folder and all its tasks? This action cannot be undone.")) {
        return;
    }

    try {
        const batch = writeBatch(db);
        
        // 1. Delete all tasks in the folder
        const tasksQuery = query(collection(db, "tasks"), where("folderId", "==", folderId), where("userId", "==", userId));
        const tasksSnapshot = await getDocs(tasksQuery);
        tasksSnapshot.forEach(doc => batch.delete(doc.ref));
        
        // 2. Delete the folder itself
        const folderRef = doc(db, "folders", folderId);
        batch.delete(folderRef);
        
        await batch.commit();

        // 3. Reload data
        loadPageData(userId);

    } catch (error) {
        console.error("Error deleting folder: ", error);
        alert("Failed to delete folder.");
    }
}


function createNewFolderCard() {
    const card = document.createElement('div');
    card.className = 'folder-card create-folder-card';
    card.innerHTML = `
        <div class="create-folder-content">
            <div class="create-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><use href="assets/icons.svg#plus"></use></svg>
            </div>
            <h3 class="create-title">Create New Folder</h3>
        </div>
    `;
    card.addEventListener('click', () => openFolderModal());
    return card;
}

let currentEditingFolderId = null;

function openFolderModal(folder = null) {
    const modal = document.getElementById('folderModal');
    const form = document.getElementById('folderForm');
    const modalTitle = document.getElementById('modalTitle');
    form.reset();

    if (folder) {
        modalTitle.textContent = 'Edit Folder';
        document.getElementById('folderName').value = folder.name;
        document.getElementById('folderDescription').value = folder.description || '';
        const colorInput = form.querySelector(`input[name="color"][value="${folder.color}"]`);
        if (colorInput) colorInput.checked = true;
        currentEditingFolderId = folder.id;
    } else {
        modalTitle.textContent = 'Create New Folder';
        currentEditingFolderId = null;
    }
    modal.style.display = 'flex';
}

function initializeFolderModal(userId) {
    const modal = document.getElementById('folderModal');
    const form = document.getElementById('folderForm');
    const closeModalBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');

    const closeModal = () => {
        modal.style.display = 'none';
        form.reset();
    };

    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('folderName').value.trim();
        const description = document.getElementById('folderDescription').value.trim();
        const color = form.querySelector('input[name="color"]:checked')?.value;
        if (!name || !color) return alert("Please provide a folder name and select a color.");

        try {
            if (currentEditingFolderId) {
                // Update existing folder
                const folderRef = doc(db, 'folders', currentEditingFolderId);
                await updateDoc(folderRef, { name, description, color });
            } else {
                // Create new folder
                await addDoc(collection(db, 'folders'), { userId, name, description, color, createdAt: serverTimestamp() });
            }
            closeModal();
            loadPageData(userId);
        } catch (error) {
            console.error("Error saving folder: ", error);
            alert("Failed to save folder.");
        }
    });
}

function animateValue(element, start, end, duration, suffix = '') {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = Math.floor(progress * (end - start) + start);
        element.textContent = currentValue + suffix;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function updateStatsPanel(folders, tasks) {
    const valueElements = document.querySelectorAll('.stats-panel .stat-value');
    if (valueElements.length !== 3) return;

    const totalFoldersEl = valueElements[0];
    const totalTasksEl = valueElements[1];
    const avgCompletionEl = valueElements[2];
    
    const endTotalFolders = folders.length;
    const endTotalTasks = tasks.length;
    const endAvgCompletion = folders.length > 0 ? Math.round(folders.reduce((acc, f) => acc + f.progress, 0) / folders.length) : 0;

    // Get current values, or 0 if they are not numbers yet
    const startTotalFolders = parseInt(totalFoldersEl.textContent) || 0;
    const startTotalTasks = parseInt(totalTasksEl.textContent) || 0;
    const startAvgCompletion = parseInt(avgCompletionEl.textContent) || 0;

    animateValue(totalFoldersEl, startTotalFolders, endTotalFolders, 1500);
    animateValue(totalTasksEl, startTotalTasks, endTotalTasks, 1500);
    animateValue(avgCompletionEl, startAvgCompletion, endAvgCompletion, 1500, '%');
}


function updateDoughnutChart(folders) {
    const ctx = document.getElementById('tasksChart')?.getContext('2d');
    if (!ctx) return;
    if (tasksChart) tasksChart.destroy();

    tasksChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: folders.map(f => f.name),
            datasets: [{
                data: folders.map(f => f.taskCount),
                backgroundColor: folders.map(f => f.color),
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: { responsive: true, cutout: '70%', plugins: { legend: { display: false } } }
    });
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
