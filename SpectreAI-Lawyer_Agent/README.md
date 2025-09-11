# Spectre AI: Your Indian Legal AI Agent ⚖️

Spectre AI is a dedicated legal assistant engineered to simplify the complexities of Indian law. This web-based application provides users with clear, step-by-step guidance on various legal issues and connects them to official government resources and contact information.

## ✨ Features

* **Intelligent Legal Guidance**: The core feature of Spectre AI is its ability to understand a user's legal situation and provide a structured, actionable response. It offers step-by-step guidance on procedures like filing an FIR, handling consumer complaints, or dealing with property disputes.
* **Comprehensive Knowledge Base**: The agent is powered by a robust internal knowledge base covering a wide range of legal domains in India, including:
    * Personal & Family Life (Family Law, Property Law)
    * Financial & Commercial Life (Consumer Rights, Banking, Taxation)
    * Safety & Civic Rights (Criminal Law, Cyber Law, Traffic Law)
    * Citizen & State Interaction (RTI, Legal Aid)
    * Rights at Work, School & Hospital (Employment, Health, Education Law)
    * Business & Creative Rights (Intellectual Property Law)
* **Official Resources & Contacts**: For every legal topic, the application provides a curated list of official government websites and direct contact information like helpline numbers and email addresses, displayed in a dedicated sidebar.
* **Email Generation Assistant**: When a user's query is substantial enough to warrant formal communication, the AI can generate a professional email draft. This draft includes a clear subject line and a summary of the case with placeholders for personal details, making it easy for the user to contact a lawyer or official.
* **Chat History Management**: All conversations are saved, allowing users to revisit past queries. Users can easily switch between chats, create new ones, and delete individual chats or clear the entire history.
* **Customizable API Integration**: The application is built to be flexible, supporting both the **Google Gemini** and **OpenAI** APIs. Users can easily enter and save their preferred API key in the settings to power the AI backend.
* **User-Friendly Interface**: The application features a clean, three-panel layout with a collapsible sidebar for chat history and a separate sidebar for references. It includes a typing indicator for a better user experience and an auto-resizing text input area.
* **Dark Mode**: A dark theme is available and can be toggled to reduce eye strain, providing a comfortable user experience in different lighting conditions.
* **Persistence and Privacy**: All user data, including API keys, chat history, and theme preferences, are stored securely in the browser's **local storage** and are never shared. A "Clear All Saved Data" option is also available for complete privacy control.
* **About Section**: A modal provides information about the project and its creators, Team MCA from CUCEK Dept, CUSAT, Kerala.

## 🚀 Getting Started

Since this is a client-side-only application, you can run it directly in your browser.

1.  Download the project files (`index.html`, `style.css`, `script.js`).
2.  Open the `index.html` file in a modern web browser (like Chrome, Firefox, or Edge).
3.  The app will prompt you to add an API key. Navigate to the **Settings** panel.
4.  Select your preferred API provider (Gemini or OpenAI).
5.  Enter your valid API key and click **"Save Key"**.
6.  Go back to the main screen and start a new chat!

## 🛠️ Technology Stack

* **Frontend**:
    * **HTML5**: For the structure and content of the web page.
    * **CSS3**: For all styling, including a responsive layout with Flexbox and a dark mode theme.
    * **Vanilla JavaScript (ES6+)**: For all client-side logic, DOM manipulation, event handling, and asynchronous API calls (`fetch`, `async/await`) without any external frameworks.
* **Backend**: The application is a front-end-only project that connects to external AI services. There is no custom backend server.
* **APIs & Data**:
    * **Google Gemini API**: Used for generating AI responses (specifically `gemini-1.5-flash-latest`).
    * **OpenAI API**: An alternative option for the AI backend (specifically `gpt-4-turbo`).
    * **JSON**: The data format used for communicating with the AI APIs.
    * **Browser Local Storage**: Used for persisting API keys, chat history, and user preferences on the client's machine.