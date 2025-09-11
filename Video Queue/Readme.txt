# Video Queue & Learning Canvas

Video Queue is a powerful, web-based tool for searching, organizing, and creating learning paths from YouTube videos and playlists. It combines a dynamic search interface with an infinite visual canvas, allowing you to map out content, create connections, and play your custom queues in sequence.

*(A GIF or screenshot of the canvas with video nodes and connections would be perfect here)*

## ✨ Features

* **YouTube Search**: Search for both videos and playlists directly from the YouTube Data API v3. Search results are displayed in a clean, card-based grid.
* **Infinite Visual Canvas**:
    * Drag and drop videos or playlists from search results onto an infinite canvas to create visual "nodes".
    * Create directed connections between nodes to define playback order or learning paths.
    * Pan and zoom around the canvas for a comprehensive view of your content map.
* **Tabbed Organization (Queues)**:
    * Organize your canvases into multiple tabs, called "Queues".
    * Create, rename, reorder (drag & drop), and delete tabs to manage different projects or topics.
* **Integrated Video Player**:
    * Play any node directly from the canvas in a modal player.
    * The player automatically advances to the next connected node upon video completion.
    * If a node has multiple connections, a branch choice overlay appears, letting you choose the next path.
* **Data Persistence & Management**:
    * Your entire canvas state, API key, and history are saved automatically to your browser's local storage.
    * **Backup & Restore**: Export selected tabs (or your entire canvas) to a JSON file for backup, and import them back later. You can choose to merge or overwrite existing data on import.
    * **History Tracking**: The app keeps a "Click History" of search results you've interacted with and a "Canvas Watch History" of nodes you've played.
* **User Experience**:
    * **Theme Support**: Switch between Default, AMOLED Dark, and Light themes.
    * **Responsive Interface**: A clean UI designed to be functional and aesthetically pleasing.
    * **Drag & Drop**: Intuitive drag-and-drop functionality for adding nodes to the canvas and reordering tabs.

## 🚀 Getting Started

To run this application, you need a YouTube Data API v3 key. The application is entirely client-side, so no server is needed.

1.  **Get a YouTube API Key**:
    * Go to the [Google Cloud Console](https://console.cloud.google.com/).
    * Create a new project.
    * Go to **APIs & Services > Library**, search for "YouTube Data API v3," and enable it.
    * Go to **APIs & Services > Credentials**, click "+ CREATE CREDENTIALS," select "API key," and copy the key.

2.  **Run the Application**:
    * Download the project files (`index.html`, `style.css`, `script.js`).
    * Open `index.html` in a modern web browser.
    * Click the **Settings** icon in the top right.
    * Paste your YouTube API key into the input field and click **"Save Key"**.
    * The app will reload the homepage content, and you can now start searching for videos.

## 🛠️ Technology Stack

* **Frontend**:
    * **HTML5**: Provides the application's structure.
    * **CSS3**: Handles all custom styling, theming, and animations.
    * **Vanilla JavaScript (ES6+)**: Powers all the application's logic, from API calls and state management to DOM manipulation and canvas interactivity.
* **APIs & Libraries**:
    * **YouTube Data API v3**: Used to fetch video and playlist data from YouTube.
    * **Tailwind CSS** (via CDN): Utilized for the utility-first styling of the interface.
    * **YouTube IFrame Player API**: For embedding and controlling the YouTube player.
* **Data Storage**:
    * **Browser Local Storage**: All user data, including the API key, canvas state, and history, is stored on the client-side.