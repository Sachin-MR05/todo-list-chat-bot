// --- 1. Chatbot State and Configuration ---
const CHATBOT_API_ENDPOINT = 'YOUR_BACKEND_URL_HERE'; // IMPORTANT: Replace with your actual backend URL
let isChatOpen = false;
let messageHistory = [];

// --- 2. DOM Element References ---
let toggleButton, chatWindow, closeButton, messageArea, inputForm, inputField, sendButton;

// --- 3. Core Functions ---

/**
 * Initializes the chatbot UI, sets up event listeners.
 * @param {object} auth - The Firebase auth instance.
 */
export function initializeChatbot(auth) {
    // Cache DOM elements
    toggleButton = document.getElementById('chatbot-toggle-button');
    chatWindow = document.getElementById('chat-window');
    closeButton = document.getElementById('chat-close-button');
    messageArea = document.getElementById('chat-messages');
    inputForm = document.getElementById('chat-input-form');
    inputField = document.getElementById('chat-input');
    sendButton = document.getElementById('chat-send-button');

    // Attach event listeners
    toggleButton.addEventListener('click', toggleChatWindow);
    closeButton.addEventListener('click', closeChatWindow);
    inputForm.addEventListener('submit', (e) => handleSendMessage(e, auth));

    console.log("Chatbot Initialized");
}

/**
 * Toggles the visibility of the chat window.
 */
function toggleChatWindow() {
    isChatOpen = !isChatOpen;
    if (isChatOpen) {
        chatWindow.classList.remove('hidden');
        // Add a slight delay to allow the element to be displayed before animating
        setTimeout(() => {
            chatWindow.style.opacity = '1';
            chatWindow.style.transform = 'scale(1)';
        }, 10);
    } else {
        closeChatWindow();
    }
}

/**
 * Explicitly closes the chat window.
 */
function closeChatWindow() {
    isChatOpen = false;
    chatWindow.style.opacity = '0';
    chatWindow.style.transform = 'scale(0.5)';
    // Hide the element after the animation completes
    setTimeout(() => {
        chatWindow.classList.add('hidden');
    }, 300); // Must match the CSS transition duration
}

/**
 * Handles the form submission to send a message.
 * @param {Event} e - The form submission event.
 * @param {object} auth - The Firebase auth instance.
 */
async function handleSendMessage(e, auth) {
    e.preventDefault();
    const userMessage = inputField.value.trim();
    if (!userMessage) return;

    // Add user message to UI
    addMessageToHistory('user', userMessage);
    inputField.value = '';
    setLoadingState(true);

    try {
        const user = auth.currentUser;
        if (!user) {
            addMessageToHistory('bot', 'Error: You must be logged in to use the chat.');
            setLoadingState(false);
            return;
        }

        // Get the Firebase auth token to securely identify the user
        const idToken = await user.getIdToken();

        // --- API Call to Backend ---
        const response = await fetch(CHATBOT_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                prompt: userMessage,
                history: messageHistory.slice(-10) // Send last 10 messages for context
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const botResponse = data.response || 'Sorry, I encountered an error.';

        // Add bot response to UI
        addMessageToHistory('bot', botResponse);

    } catch (error) {
        console.error("Chatbot API error:", error);
        addMessageToHistory('bot', 'Sorry, I couldn\'t connect to the server. Please try again later.');
    } finally {
        setLoadingState(false);
    }
}

// --- 4. UI Helper Functions ---

/**
 * Adds a message to the chat window and the internal history.
 * @param {string} sender - 'user' or 'bot'.
 * @param {string} text - The message content.
 */
function addMessageToHistory(sender, text) {
    // Add to internal state
    messageHistory.push({ role: sender, parts: [{ text }] });

    // Create and append message element
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${sender}`;
    messageElement.textContent = text;
    messageArea.appendChild(messageElement);

    // Scroll to the latest message
    messageArea.scrollTop = messageArea.scrollHeight;
}

/**
 * Enables or disables the input form to prevent multiple submissions.
 * @param {boolean} isLoading - True if the bot is "thinking".
 */
function setLoadingState(isLoading) {
    inputField.disabled = isLoading;
    sendButton.disabled = isLoading;
    if (isLoading) {
        inputField.placeholder = 'Thinking...';
    } else {
        inputField.placeholder = 'Ask a question...';
        inputField.focus();
    }
}