# 🧊 1ERDNA Cube Lab

### Just one more solve... probably.

A little speedcubing timer I made for my practice sessions. Nothing too serious — just a clean space to scramble, solve, track my times, and try to beat my PB.

It has a **minimal black + neon-blue look**, a camera that can detect my hands, and a timer that starts and stops without me touching the keyboard.

**[🔵 Try it here](https://1erdna.github.io/cubecam-connect/)**

---

## What's inside?

- ⏱️ **Hands-free timer** — rest both hands open and still in the camera zones, lift to start, then put both hands down again to stop
- 📷 **Two camera options** — use a laptop/USB webcam or pair your phone
- 🔀 **Fresh scrambles** — 3×3 and 2×2, with a new scramble after each solve
- 📊 **Stats** — PB, Ao5, Ao12, mean, and recent solves
- 👀 **Camera monitor** — stays on the right while scrolling on desktop, so I can see where my hands should go
- 🎥 **Website-only recording** — capture Cube Lab (not your browser or desktop), preview your clip, and download it
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

## Wanna record a session? 🎬

Open **Timer dashboard → 04 · Cube Lab Recorder**.

**Website-only recording is now the default.** It does *not* open the Opera screen-sharing chooser. Instead, Cube Lab makes a clean 1280×720 video of its own **timer, scramble, hand indicators, session stats, and live camera feed** (when your camera is on). It intentionally leaves out Opera's tabs, menus, other windows, notifications, and the desktop.

1. Set **What to record → Cube Lab only · No screen-sharing popup** (it's already selected).
2. Look at **Live recording view** to see what will be included in your video.
3. Hit **Record Cube Lab only** and do your solves.
4. Hit **Stop recording**.
5. Watch your clip below the buttons, then click **Download recording**.

You can still choose **Browser tab/window** in the dropdown if you specifically want the old screen-sharing method, but you don't need it for regular solve videos.

**Camera tip:** With a laptop webcam, start it normally so its live feed appears in the recording. With a paired phone, enable **Share live video with laptop** on the phone for the camera image to appear in the recording. Without that permission, the timer and stats still record, but the camera section shows a placeholder.

This feature is **opt-in, silent, private, and local**. Nothing is uploaded; browser recording support (Canvas capture + MediaRecorder) is required. Keep the Cube Lab tab visible while recording, and **download before reloading or closing**, because clips aren't saved permanently on the website. The default export is WebM, subject to browser support. The clean recording layout represents your Cube Lab session rather than being a pixel-for-pixel copy of its scrolling page.

## Rest your hands, then solve ✋

The camera timer now has **Resting hands** mode by default. It looks for both hands inside the blue zones, with reasonably open fingers and a short moment of steadiness, before counting them as placed down.

1. Place **both hands open and still** in the left and right boxes.
2. Wait for the timer to show **READY** (about 0.6 seconds after both hands are recognized as resting).
3. Lift both hands to **start**.
4. Solve, then put **both hands back down** in their boxes to **stop**.

The boxes light up when the detector recognizes a resting hand. If your webcam angle or lighting makes this too picky, change **Hand detection** to **Zone only (original)**. The original option responds to hand position rather than open-hand posture.

**Heads up:** The camera estimates hand posture and steadiness — it cannot physically verify contact with the table. The extra check helps avoid accidental starts/stops but can add a small delay to the recorded time. For official timing, use physical sensors.

## A few things to know

This is a **personal practice timer**, not an official competition timer. The camera sees where your hands are, not whether they're actually touching the table. Good lighting and a steady camera help a lot.

Times are stored **locally in your laptop browser**. Clearing its site data or using a different browser won't bring those times along.

Under the hood: **HTML, CSS, JavaScript, MediaPipe, PeerJS/WebRTC, and cubing.js**. Hosted on **GitHub Pages**.

---

**Made by [1erdna](https://github.com/1erdna)** 💙

*Keep turning. Keep improving.*
