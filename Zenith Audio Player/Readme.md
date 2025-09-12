# Zenith Audio Player

Zenith is a modern, lightweight, and feature-rich web-based audio player designed to provide an elegant listening experience for local music collections. Built with a minimalist design philosophy, it focuses on performance, aesthetics, and user-friendly controls.

## ✨ Features

* **Local File Playback**: Directly play audio files from a local folder on your computer. Your files never leave your device.
* **Intuitive Interface**: A sleek, dark-themed UI that's easy on the eyes.
* **Audio Controls**: Fine-tune your listening experience with a built-in equalizer for **bass** and **treble** adjustments.
* **Dynamic Visuals**: The player features a unique "color wings" visualization that generates gradient bars based on the album art of the currently playing track.
* **Metadata Support**: Reads and displays **track title**, **artist**, and **album art** from the audio file's metadata (powered by `jsmediatags`).
* **Playlist Management**: Create and manage custom playlists from your local music library.
* **Favorites**: Mark your favorite songs to easily find them later.
* **Loop Modes**: Toggle between looping a single track or the entire playlist.
* **Responsive Design**: A clean layout that adapts to different screen sizes.

## 🚀 How to Use

1.  **Download/Clone**: Download the `Audio player15.2.html` file or clone this repository to your local machine.
2.  **Open in Browser**: Open the `Audio player15.2.html` file in your favorite web browser (e.g., Chrome, Firefox, Safari).
3.  **Select Folder**: Click the "Open Folder" button and choose a folder containing your music files. The player will scan the directory and load all supported audio files.
4.  **Enjoy**: Click on any track to start playing!

## ⚙️ Technologies

* **HTML5**: The structure of the application.
* **Tailwind CSS**: A utility-first CSS framework used for rapid UI development.
* **Font Awesome**: Provides the icons used throughout the interface.
* **JavaScript**: The core logic for audio playback, state management, and UI interactions.
* **Web Audio API**: Used for advanced audio processing features like the equalizer.
* **`jsmediatags` Library**: A third-party library for reading metadata from various audio file formats.

## 🎨 Customization

The player's appearance is built with Tailwind CSS, making it highly customizable. You can modify the color scheme, layout, and component styles directly within the `Audio player15.2.html` file.

* **Theme**: The player supports both **light** and **dark** themes, which can be toggled using the sun/moon icon in the top right corner.
* **Colors**: The `tailwind.config` section in the `<script>` tag allows for easy color customization.
* **Wings**: The "color wings" effect can be toggled on or off from the "Audio Controls" panel. The base color for the wings can be adjusted via the `--bg-color-for-wings` CSS variable.