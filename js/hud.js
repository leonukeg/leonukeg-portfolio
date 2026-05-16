// hud.js
const coordsEl = document.getElementById('hud-br');

window.addEventListener('mousemove', (e) => {
  const nx = ((e.clientX / window.innerWidth)  * 2 - 1).toFixed(3);
  const ny = ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3);
  coordsEl.textContent = `X: ${nx} · Y: ${ny}`;
});
