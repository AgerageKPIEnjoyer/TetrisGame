# 🎮 Retro Tetris JS

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

A classic Tetris game built with **pure JavaScript** (Vanilla JS) without any third-party libraries or frameworks. The project features full game mechanics, responsive design for mobile devices, and a synthesized audio system.

### 🚀 [PLAY NOW (LIVE DEMO)](https://ageragekpienjoyer.github.io/TetrisGame/)

---

## ✨ Features

* **Zero Dependencies:** No jQuery, React, or Vue. Just native, clean JavaScript.
* **Web Audio API:** Sound effects (clicks, drops) are generated in real-time using oscillators. Zero latency playback.
* **Responsive Design:** The game automatically scales to fit any screen size (PC, Tablet, Smartphone).
* **Progress Saving:** High Score is persisted using the browser's `localStorage`.
* **Smart UX:**
    * **Auto-pause** when the tab loses focus (`blur` event).
    * **Ghost Piece** for precise aiming.
    * **Countdown timer** before the game starts.

---

## 🎮 How to Play

### On Desktop:
* `⬅️` / `➡️` — Move Left / Right
* `⬇️` — Soft Drop (Accelerate)
* `⬆️` — Rotate Piece
* `Pause` — Click the **II** button on the screen

### On Mobile:
Use the on-screen touch controls below the game area.

---

## 🛠️ Tech Stack

* **HTML5 Canvas** — For high-performance graphics rendering (60 FPS).
* **CSS3 Flexbox & Transforms** — For layout centering and scale adaptation (`transform: scale`).
* **Web Audio API** — For procedural sound generation (Square/Triangle/Sine waves).
* **Local Storage API** — For saving high scores locally.

---

## 📦 Installation & Local Development

If you want to run this project locally on your machine:

1.  Clone the repository:
    ```bash
    git clone [https://github.com/your-username/tetris-js.git](https://github.com/your-username/tetris-js.git)
    ```
2.  Open the folder and launch `index.html` in your browser.
    * *Note:* For the best experience (and to avoid potential CORS issues with audio files in some browsers), it is recommended to use a local server (e.g., Live Server in VS Code).

---

## 📝 License

This project is licensed under the MIT License. Feel free to use the code for educational purposes.
