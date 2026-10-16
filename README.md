# 1ERDNA Cube Lab

A minimalist, browser-based speedcubing timer with camera-assisted hand detection, solve statistics, and local video recording.

**[Open Cube Lab](https://1erdna.github.io/cubecam-connect/)**

## Features

- **Hands-free timing:** Start and stop with open, resting hands using the fixed **Extra safe** detection profile. Manual timing is also available with the Spacebar.
- **Flexible camera setup:** Use a laptop webcam or pair a phone as a wireless hand sensor. Adjust the blue detection zones as needed.
- **Scrambles:** Generate 2×2 and 3×3 scrambles and inspect them in 2D or a draggable 3D view.
- **Solve statistics:** Track your best time, Ao5, Ao12, mean, and solve history.
- **Record and replay:** Record Cube Lab sessions, watch saved clips, and download videos from the local replay gallery.

## Getting started

1. Open the website on your laptop and select **Open timer**.
2. Select **Laptop** as the camera source and press **Start** to enable your webcam.
3. Rest both hands open and still in the blue zones until the timer shows **READY**. Lift to start; return both hands to stop.

To use a phone instead, select **Phone** on the laptop and click **Get code**. On your phone, open the same website, choose **Phone camera**, enter the code, connect, and start its camera. Sharing the phone's live video is optional.

## Privacy and requirements

- Solve history and saved replays are stored **locally in your browser**. Download important recordings, as clearing browser data can remove them.
- Camera access requires permission. An internet connection is needed for external detection resources and phone pairing.
- Camera timing is intended for **practice**, not official competition timing.

## Technology

Built with **HTML, CSS, and JavaScript**, using MediaPipe, cubing.js, PeerJS/WebRTC, and browser-native recording and storage APIs. Hosted on GitHub Pages.

See [third-party notices](THIRD_PARTY_NOTICES.md) for dependency and licensing information.

---

Developed by [1erdna](https://github.com/1erdna).
