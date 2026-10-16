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

## Minimal practice interface — October 2026

The website now starts with just two choices: **Use laptop** or **Use phone**.
Choose **Use laptop** to open the timer with the laptop camera selected by
default; camera access only starts when you click **Start**.

The main practice view prioritizes the **camera, scramble, timer, and three quick
stats (solves, best time, Ao5)**. Other features are still there, behind small
expandable sections:

- **Cube preview:** the 2D/3D scramble viewer (drag the 3D cube to rotate)
- **Record:** website-only recording or the optional browser tab source
- **Replays:** local video gallery
- **History / More stats:** recent solves, Ao12 and mean
- **Camera settings:** webcam choice, flip camera, and hand-zone calibration
- **Test without camera:** paired-phone test pads

The detector remains fixed to **Resting hands + Extra safe**. Existing
records, camera pairing, replay storage, cube preview and recording code were
not removed. This is progressive disclosure, not a loss of features.

## How to use it

Open the **[Cube Lab website](https://1erdna.github.io/cubecam-connect/)** on your laptop, then choose **Use laptop**.

### Option 1: Use your laptop camera 💻

1. The laptop camera is selected automatically.
2. Pick your built-in webcam or USB camera.
3. Hit **Start camera** and allow camera access.
4. Point the camera at your cube and both hands. Adjust the blue hand zones if needed.

That's it. No phone pairing needed.

### Option 2: Use your phone as the camera 📱

1. On your laptop, choose **Phone** as the camera source and press **Get code**.
2. Open the same website on your phone and choose **Use phone**.
3. Enter the pairing code and connect.
4. Start the phone camera and aim it at the table.
5. Want the actual phone video on your laptop? Turn on **Share live video with laptop** on your phone. It's optional and off by default.

The phone can send hand-detection signals even when live video sharing is off.

### Ready, set, solve 🟦

**Both hands in the zones → hold for 0.6 seconds → lift both hands → solve → put both hands back to stop.**

Your time gets saved and the next scramble shows up. Repeat until you say *last solve* for the fifth time.

If the camera is being annoying, use the **Spacebar** or the manual start/stop button instead.

## Studio IV — premium black + neon blue identity

The current design is an original, editorial-style brand system: **flat midnight black surfaces, solid neon-blue accents, geometric framing, bold typography, and hard-edged controls**. Inspired by the visual discipline of premium brand identity work, it avoids frosted-glass effects, blur, shiny gradients, and generic AI-dashboard styling.

The UI changes are implemented in `brand-v4.css` (loaded **after** the existing styles) with updated masthead, workstation selection, timer, scramble presentation, camera controls, recorder, and replay layout in `index.html`. This is a styling/layout update, not a rewrite of timing or camera logic. Existing functionality, stored PBs and solves, paired-phone sensor, website-only recording, replay vault, 2D/3D scrambles, draggable orbit, and draggable hand detection boxes are retained. Accessible contrast and reduced-motion handling are included.

The page still uses the existing lightweight web stack—**HTML, CSS, and vanilla JavaScript**—with no extra design framework, blur library, image assets, or copied brand artwork.

## Studio v3.1 — the pretty and useful stuff 💙

Everything still runs on the same static GitHub Pages website. No login or backend needed.

**Visual scrambles:** Under the scramble notation, switch between **2D cube net** and
**3D cube**. The original JavaScript facelet renderer supports 2×2 and 3×3 and
updates whenever cubing.js (or the offline fallback) generates new moves.
These show the *scrambled state*, not an animation of the moves.

**Orbit the 3D cube:** Select **3D cube**, then click and drag the cube display
with a mouse to inspect **all six sides**. It also works with touch drag on phones.
Double-click the preview or press **↺ Reset view** to return to the starting angle.
For keyboard use, focus the 3D preview, press arrow keys to rotate it, and press
**R** or **Home** to reset. Rotation is manual rather than automatically spinning,
so the view stays where you place it.

**Drag your hand zones:** Start the webcam on your laptop or phone, then drag
the transparent blue zone areas left or right by the **↔ DRAG** handles.
The *actual hand detector* follows these positions, not just the rectangles.
You can use keyboard Left/Right arrows while a handle is focused.
Use **Reset zone positions** to restore the default placement. The width and
height sliders still work, and the zone position is saved in this browser.
For a paired phone with **Share live video** enabled, you can also move the
visible zones on the laptop, and it sends the settings back to the phone.

**Better midnight-blue design:** Lightweight original CSS updates, smoother
cards, compact controls, and animated 3D preview. Reduced-motion preferences
disable optional animation.

**Replay Vault:** When you stop a recording, Cube Lab attempts to save
the clip **locally in IndexedDB**. Find it under **05 · Replay vault** and use
**Watch**, **Save**, or **Delete**. This does not upload the video anywhere.
IndexedDB is limited by your browser's storage quota and can be cleared with
site data/private browsing, so **download important videos for backup**.
The recorder's immediate preview and download button still work even if local
replay storage is unavailable.

There are **no new external JavaScript libraries** in Studio v3. The new
renderer, replay gallery, drag behavior, and styling were created for
this repo using standard browser APIs. Existing dependency licenses are listed
in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

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

This feature is **opt-in, silent, private, and local**. Nothing is uploaded; browser recording support (Canvas capture + MediaRecorder) is required. Keep the Cube Lab tab visible while recording. The new Replay Vault also tries to keep clips in this browser across reloads, but **download important clips** because local browser storage is not a guaranteed backup. The default export is WebM, subject to browser support. The clean recording layout represents your Cube Lab session rather than being a pixel-for-pixel copy of its scrolling page.

## Rest your hands, then solve ✋

The camera timer **always uses Resting hands mode with Extra safe stop accuracy**. Both hands must be open and stable inside their blue zones before a placement is recognized. These settings are locked and no longer offer alternate modes.

1. Place **both hands open and still** in the left and right boxes.
2. Wait for the timer to show **READY** (about 0.6 seconds after both hands are recognized as resting).
3. Lift both hands to **start**.
4. Solve, then put **both hands back down** in their boxes to **stop**.

The blue boxes light up when the detector recognizes open, resting hands. The position-only fallback has been removed. If recognition seems too strict, adjust the camera's angle, lighting, or draggable box positions.

**Heads up:** The camera estimates hand posture and steadiness — it cannot physically verify contact with the table. The extra check helps avoid accidental starts/stops but can add a small delay to the recorded time. For official timing, use physical sensors.

## Making the hand timer more reliable 🔵

The camera now permanently uses **Extra safe**. It requires all four fingers to appear open and steady, then confirms both hands have settled before recording a stop. This reduces false stops while solving but may reject poorly framed or curled hands.

The site now rejects stale/frozen webcam detections. When it confirms a valid stop, it uses the estimated time your **second hand first settled** instead of adding the entire confirmation delay to your solve. A little display correction during confirmation is normal.

**Tip:** Aim the camera at two small, separate hand-resting zones near the left and right edges of your table. The cube should stay in the *center*, outside the zones while solving. Face both palms toward the lens when finishing. Lighting and camera angle are important.

A webcam cannot verify that your hands physically touched the surface. This is a practice timer, not a competition-certified timing system.

## A few things to know

This is a **personal practice timer**, not an official competition timer. The camera sees where your hands are, not whether they're actually touching the table. Good lighting and a steady camera help a lot.

Times are stored **locally in your laptop browser**. Clearing its site data or using a different browser won't bring those times along.

Under the hood: **HTML, CSS, JavaScript, MediaPipe, PeerJS/WebRTC, and cubing.js**. Hosted on **GitHub Pages**.

---

**Made by [1erdna](https://github.com/1erdna)** 💙

*Keep turning. Keep improving.*
