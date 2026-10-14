# Third-party licenses and design provenance

1ERDNA Cube Lab is a static HTML/CSS/JavaScript website. The **Studio v3 enhancements**
(visual cube renderer, solve performance graph, replay gallery, draggable zones, and
styling in `cube-preview.js`, `performance.js`, `replay-gallery.js`,
`zone-drag.js`, and `enhancements.css`) were written specifically for this project.
They do **not** copy implementation code, images, or design assets from NexusTimer,
CubeDesk, CubeTime, or other speedcube sites.

The application already uses these third-party dependencies:

- **cubing.js**, obtained on demand from `https://cdn.cubing.net/` for random
  scrambles. The project describes licensing under the **Mozilla Public License 2.0**
  (and also GPL for original contributions; check project for vendored components).
  Repository and licensing: https://github.com/cubing/cubing.js
- **PeerJS 1.5.5**, loaded from cdnjs for optional paired-phone connections:
  **MIT License**. https://github.com/peers/peerjs
- **MediaPipe Tasks Vision 0.10.32**, loaded on demand from jsDelivr and Google's
  hand-landmarker model endpoint to detect hands: **Apache License 2.0** for the
  MediaPipe implementation. https://github.com/google-ai-edge/mediapipe
- **Browser-native APIs**: Canvas 2D, MediaRecorder, MediaDevices,
  IndexedDB, localStorage and WebRTC: browser features, not new bundled packages.

No third-party dependency or its code was modified as part of Studio v3.
Third-party names, trademarks, and licenses remain those of their respective
owners. This notice does not assign a license to the user's original project;
the project's overall license remains for its owner to choose.
