# 🧊 1ERDNA Cube Lab

### Just one more solve... probably.

A little speedcubing timer I made for my practice sessions. Nothing too serious — just a clean space to scramble, solve, track my times, and try to beat my PB.

It has a **minimal black + neon-blue look**, a camera that can detect my hands, and a timer that starts and stops without me touching the keyboard.

**[🔵 Try it here](https://1erdna.github.io/cubecam-connect/)**

---

## What's inside?

- ⏱️ **Hands-free timer** — put both hands in the camera zones, lift to start, put them back to stop
- 📷 **Two camera options** — use a laptop/USB webcam or pair your phone
- 🔀 **Fresh scrambles** — 3×3 and 2×2, with a new scramble after each solve
- 📊 **Stats** — PB, Ao5, Ao12, mean, and recent solves
- 👀 **Camera monitor** — stays on the right while scrolling on desktop, so I can see where my hands should go
- 💙 **Midnight-blue UI** — minimal, dark, and a little neon

No Stackmat required. Just a camera, a cube, and the urge to get faster.

## How to use it

Open the **[Cube Lab website](https://1erdna.github.io/cubecam-connect/)** on your laptop, then hit **Timer dashboard**.

### Option 1: Use your laptop camera 💻

1. Choose **Laptop camera**.
2. Pick your built-in webcam or USB camera.
3. Hit **Start camera** and allow camera access.
4. Point the camera at your cube and both hands. Adjust the blue hand zones if needed.

That's it. No phone pairing needed.

### Option 2: Use your phone as the camera 📱

1. On your laptop, select **Pair phone camera** and hit **Create code**.
2. Open the same website on your phone and choose **Hand-tracking camera**.
3. Enter the pairing code and connect.
4. Start the phone camera and aim it at the table.
5. Want the actual phone video on your laptop? Turn on **Share live video with laptop** on your phone. It's optional and off by default.

The phone can send hand-detection signals even when live video sharing is off.

### Ready, set, solve 🟦

**Both hands in the zones → hold for 0.6 seconds → lift both hands → solve → put both hands back to stop.**

Your time gets saved and the next scramble shows up. Repeat until you say *last solve* for the fifth time.

If the camera is being annoying, use the **Spacebar** or the manual start/stop button instead.

## A few things to know

This is a **personal practice timer**, not an official competition timer. The camera sees where your hands are, not whether they're actually touching the table. Good lighting and a steady camera help a lot.

Times are stored **locally in your laptop browser**. Clearing its site data or using a different browser won't bring those times along.

Under the hood: **HTML, CSS, JavaScript, MediaPipe, PeerJS/WebRTC, and cubing.js**. Hosted on **GitHub Pages**.

---

**Made by [1erdna](https://github.com/1erdna)** 💙

*Keep turning. Keep improving.*
