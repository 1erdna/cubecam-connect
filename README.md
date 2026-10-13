# 1ERDNA Cube Lab — Speedcube Timer

A minimalist, personal speedcube timer with **two interchangeable camera modes**. The website is published at https://1erdna.github.io/cubecam-connect/ and the source lives at https://github.com/1erdna/cubecam-connect.

## Option 1 — Laptop webcam / external USB camera

1. On your laptop, open the website in Chrome or Edge.
2. Select **Timer dashboard** and then **Laptop camera**.
3. Choose the desired camera in **Camera source** (built-in or USB webcam) and press **Start camera**.
4. Allow camera permission. Mount or position the camera so the table, cube, and both hand-resting zones fit in the video.
5. Adjust **Zone width** and **Zone starts at** to align with your resting hands.
6. Hold one hand in each zone for 0.6 seconds; the timer turns green. Remove both to start; return both to stop. A new scramble appears.

Camera recognition and timer both run on your laptop. **No phone pairing or local server needed.** The site needs HTTPS and an internet connection for its model/CDN on first load.

## Option 2 — Phone camera, laptop timer

1. On the laptop, open the same site and select **Timer dashboard → Pair phone camera**.
2. Click **Create code** and leave the laptop page open.
3. On your phone, open the same HTTPS site, choose **Hand-tracking camera**, enter the pairing code and press **Connect**.
4. Test both phone touch pads before starting the camera. Both laptop indicators should change.
5. Tap **Start camera**, grant permission, and mount the phone where both hands fit into the marked zones.
6. Hold both hands in the marked zones, lift to start, return to stop.

The phone sends only left/right detection states to the laptop over a PeerJS/WebRTC data channel. It does not intentionally stream camera frames.

## Shared features

- 3×3 and 2×2 random-state scrambles provided by cubing.js when online (random-move fallback if CDN unavailable)
- Hands-free start/stop, new scramble after every completed solve
- Solve history, personal best, Ao5, Ao12 and session mean
- Spacebar or manual start/stop button on the laptop as a fallback
- Local browser storage on the laptop (clearing storage or changing browsers loses the local history)
- Two camera modes in one dashboard; changing modes will reset an unfinished solve

## Notes

Camera tracking detects **hand positions inside virtual zones**, not actual table contact. Timing may be affected by lighting, hand visibility, camera frame rate and (in phone mode) the network. This is a practice tool, not an official Stackmat-style competition timer.

Use a well-lit table; keep the camera steady and browser tab active. If the camera is not listed, close other apps that may be using it, check OS and browser permissions, then reload. On iOS, keep the phone screen awake and the browser visible.

This project uses MediaPipe Tasks Vision for hand landmarks, PeerJS for phone pairing and cubing.js for scrambles. It is a static website and works with GitHub Pages.
