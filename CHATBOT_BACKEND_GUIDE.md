# Chatbot Backend Setup Guide (Google Cloud Functions)

This guide provides the code and step-by-step instructions to deploy a secure backend for your chatbot. This backend acts as a proxy to safely handle your Gemini API key and interact with Firestore.

**Follow these steps carefully. You only need to do this once.**

---

## Prerequisites

1.  **Google Cloud Account:** You need a Google Cloud Platform (GCP) account with billing enabled. New users get a generous free tier, which is more than enough for this function.
2.  **Node.js:** You need Node.js and `npm` installed on your local machine to deploy the function. You can get it from [nodejs.org](https://nodejs.org/).
3.  **gcloud CLI:** You need the Google Cloud CLI installed and authenticated. [Installation Guide](https://cloud.google.com/sdk/docs/install).

---

## Step 1: Create a New Directory for Your Function

On your local machine (not inside this project's directory), create a new folder to hold your cloud function code.

```bash
mkdir lifetrack-ai-chatbot-backend
cd lifetrack-ai-chatbot-backend
```

---

## Step 2: Create the Function Files

Inside the `lifetrack-ai-chatbot-backend` directory, create two files: `package.json` and `index.js`.

### `package.json`

This file defines your function's dependencies.

```json
{
  "name": "lifetrack-ai-chatbot-proxy",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "@google-cloud/functions-framework": "^3.0.0",
    "@google/generative-ai": "^0.1.0",
    "firebase-admin": "^11.0.0",
    "cors": "^2.8.5"
  }
}
```

### `index.js`

This is the core of your backend. It receives the request from your website, fetches data, calls the Gemini API, and returns the response.

**Copy the code below into your `index.js` file:**

```javascript
const functions = require('@google-cloud/functions-framework');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors')({ origin: true });

// --- INITIALIZATION ---
// Initialize Firebase Admin SDK
admin.initializeApp({
  projectId: "YOUR_FIREBASE_PROJECT_ID", // <-- Replace with your Project ID
});
const db = admin.firestore();

// Initialize Gemini AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Loaded from environment variables
if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set.");
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// --- HTTP Cloud Function ---
functions.http('chatbotProxy', async (req, res) => {
    // Handle CORS preflight requests and set headers
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        // 1. Authenticate the user
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
            return res.status(401).send('Unauthorized: No token provided.');
        }

        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (error) {
            console.error("Error verifying token:", error);
            return res.status(401).send('Unauthorized: Invalid token.');
        }
        const userId = decodedToken.uid;
        const userPrompt = req.body.prompt;

        if (!userPrompt) {
            return res.status(400).send('Bad Request: No prompt provided.');
        }

        try {
            // 2. Fetch user's data from Firestore
            const tasksSnapshot = await db.collection('tasks').where('userId', '==', userId).get();
            const foldersSnapshot = await db.collection('folders').where('userId', '==', userId).get();

            const tasks = tasksSnapshot.docs.map(doc => doc.data());
            const folders = foldersSnapshot.docs.map(doc => doc.data());

            // 3. Construct a detailed prompt for the AI
            const contextPrompt = `
                You are a helpful AI assistant for the LifeTrack AI app.
                Your user's data is provided below. Use it to answer their questions.
                Do not answer questions that are not related to the app or their data.

                USER'S DATA:
                - Folders: ${JSON.stringify(folders, null, 2)}
                - Tasks: ${JSON.stringify(tasks, null, 2)}

                Based on this data, please answer the following question.
                Question: "${userPrompt}"
            `;

            // 4. Call the Gemini API
            const result = await model.generateContent(contextPrompt);
            const response = await result.response;
            const text = response.text();

            // 5. Send the response back to the frontend
            res.status(200).json({ response: text });

        } catch (error) {
            console.error('Error in chatbotProxy:', error);
            res.status(500).send('Internal Server Error');
        }
    });
});
```

---

## Step 3: Install Dependencies

In your terminal, inside the `lifetrack-ai-chatbot-backend` directory, run:

```bash
npm install
```

---

## Step 4: Deploy the Function

Now, deploy your function to Google Cloud.

**Important:** Replace `YOUR_FIREBASE_PROJECT_ID` with your actual Firebase Project ID. You can find this in your Firebase project settings.

Run the following command in your terminal:

```bash
gcloud functions deploy chatbotProxy \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="YOUR_GEMINI_API_KEY" \
  --project YOUR_FIREBASE_PROJECT_ID
```

-   `--runtime`: Specifies the Node.js version.
-   `--trigger-http`: Makes it a callable endpoint.
-   `--allow-unauthenticated`: Allows your website to call it. (Security is handled by verifying the Firebase user token inside the function).
-   `--set-env-vars`: **This is where you securely provide your Gemini API key.**

After the deployment finishes (it may take a few minutes), the command will output a **`httpsTrigger.url`**. This is your backend endpoint.

---

## Step 5: Update Your Frontend Code

1.  Copy the `httpsTrigger.url` you received from the deployment command.
2.  Go back to your website project and open the `js/chatbot.js` file.
3.  Find this line:
    ```javascript
    const CHATBOT_API_ENDPOINT = 'YOUR_BACKEND_URL_HERE';
    ```
4.  Replace `'YOUR_BACKEND_URL_HERE'` with the URL you copied.
5.  Save the file, commit, and push the changes to your GitHub repository.

Your chatbot is now fully configured and secure!