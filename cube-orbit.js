// Original 1ERDNA Cube Lab mouse/touch orbit controls.
// Drag the 3D preview to inspect all six faces, using browser-native pointer events.
(() => {
  const cube = document.getElementById('scramble3D');
  const stage = cube?.parentElement;
  const mode = document.getElementById('scrambleViewMode');
  const reset = document.getElementById('resetCubeOrbit');
  const hint = document.getElementById('cubeOrbitHint');
  if (!cube || !stage || !mode) return;

  const HOME = { pitch: -26, yaw: -32 };
  let pitch = HOME.pitch;
  let yaw = HOME.yaw;
  let drag = null;

  function render() {
    cube.style.transform = `rotateX(${pitch}deg) rotateY(${yaw}deg)`;
  }
  function resetAngle() {
    pitch = HOME.pitch;
    yaw = HOME.yaw;
    render();
  }
  function syncMode() {
    const is3D = mode.value === '3d';
    reset?.classList.toggle('hidden', !is3D);
    hint?.classList.toggle('hidden', !is3D);
    if (!is3D) {
      drag = null;
      stage.classList.remove('orbitDragging');
    }
  }

  stage.addEventListener('pointerdown', event => {
    if (mode.value !== '3d' || (event.pointerType === 'mouse' && event.button !== 0)) return;
    if (drag) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    try { stage.setPointerCapture(event.pointerId); } catch {}
    stage.classList.add('orbitDragging');
    event.preventDefault();
  });

  stage.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId || mode.value !== '3d') return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.x = event.clientX;
    drag.y = event.clientY;
    yaw = (yaw + dx * 0.55) % 360;
    pitch = (pitch - dy * 0.55) % 360;
    render();
    event.preventDefault();
  });

  function endDrag(event) {
    if (!drag || drag.id !== event.pointerId) return;
    drag = null;
    stage.classList.remove('orbitDragging');
    try {
      if (stage.hasPointerCapture?.(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    } catch {}
  }
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    stage.addEventListener(name, endDrag);
  }
  stage.addEventListener('dblclick', event => {
    if (mode.value !== '3d') return;
    resetAngle();
    event.preventDefault();
  });

  // Keyboard access: arrows rotate the cube and R/Home returns to default.
  stage.tabIndex = 0;
  stage.setAttribute('role', 'group');
  stage.setAttribute('aria-label', 'Interactive 3D scramble cube. Drag or use arrow keys to rotate all sides. Press R to reset.');
  stage.addEventListener('keydown', event => {
    if (mode.value !== '3d') return;
    const key = event.key;
    if (key === 'ArrowLeft') yaw -= 15;
    else if (key === 'ArrowRight') yaw += 15;
    else if (key === 'ArrowUp') pitch -= 15;
    else if (key === 'ArrowDown') pitch += 15;
    else if (key.toLowerCase() === 'r' || key === 'Home') resetAngle();
    else return;
    yaw %= 360;
    pitch %= 360;
    render();
    event.preventDefault();
  });

  reset?.addEventListener('click', resetAngle);
  mode.addEventListener('change', syncMode);
  render();
  syncMode();
})();
