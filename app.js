// Estado Global de la Aplicación
let currentField = 1;
let fieldData = Array.from({ length: 100 }, () => ({ asexuados: 0, sexuados: 0, time: 0 }));
let timerInterval = null;
let secondsInCurrentField = 0;

// Contexto de Audio Web (Offline beep)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(freq = 600, duration = 0.08) {
  const soundEnabled = document.getElementById('soundToggle').checked;
  if (!soundEnabled) return;
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// Control del Cronómetro
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    secondsInCurrentField++;
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const mins = String(Math.floor(secondsInCurrentField / 60)).padStart(2, '0');
  const secs = String(secondsInCurrentField % 60).padStart(2, '0');
  document.getElementById('timerDisplay').innerText = `${mins}:${secs}`;
}

function resetTimer() {
  secondsInCurrentField = 0;
  updateTimerDisplay();
}

// Incrementos / Decrementos
window.increment = function(type) {
  playBeep(800, 0.05);
  const fieldIndex = currentField - 1;
  fieldData[fieldIndex][type]++;
  updateUI();
};

window.decrement = function(type) {
  const fieldIndex = currentField - 1;
  if (fieldData[fieldIndex][type] > 0) {
    playBeep(400, 0.05);
    fieldData[fieldIndex][type]--;
    updateUI();
  }
};

// Configurar toques en los botones grandes (tarjetas)
document.getElementById('cardAsexuados').addEventListener('click', () => window.increment('asexuados'));
document.getElementById('cardSexuados').addEventListener('click', () => window.increment('sexuados'));

// Actualización de Interfaz
function updateUI() {
  const data = fieldData[currentField - 1];
  document.getElementById('countAsexuados').innerText = data.asexuados;
  document.getElementById('countSexuados').innerText = data.sexuados;
  document.getElementById('currentFieldText').innerText = `Campo ${currentField}`;
}

// Siguiente Campo
document.getElementById('btnSiguiente').addEventListener('click', () => {
  fieldData[currentField - 1].time = secondsInCurrentField;
  
  if (currentField < 100) {
    currentField++;
    resetTimer();
    updateUI();
  } else {
    clearInterval(timerInterval);
    alert('¡Se ha completado el conteo de los 100 campos!');
    showReport();
  }
});

// Nueva Lectura
document.getElementById('btnNueva').addEventListener('click', () => {
  if (confirm('¿Desea iniciar una nueva lectura? Se reiniciarán todos los conteos.')) {
    currentField = 1;
    fieldData = Array.from({ length: 100 }, () => ({ asexuados: 0, sexuados: 0, time: 0 }));
    resetTimer();
    startTimer();
    updateUI();
  }
});

// Cálculo de Escalas Parasitarias
function getParasiteScale(total) {
  if (total === 0) return '0';
  if (total >= 1 && total <= 39) return total.toString();
  if (total >= 40 && total <= 60) return '+/2';
  if (total >= 61 && total <= 199) return '+';
  if (total >= 200 && total <= 2000) return '++';
  if (total >= 2001 && total <= 20000) return '+++';
  if (total >= 20001) return '++++';
  return '0';
}

// Generación de Reportes
function getTotals() {
  const totalAsexuados = fieldData.reduce((acc, f) => acc + f.asexuados, 0);
  const totalSexuados = fieldData.reduce((acc, f) => acc + f.sexuados, 0);
  const totalSeconds = fieldData.reduce((acc, f) => acc + f.time, 0);
  return { totalAsexuados, totalSexuados, totalSeconds };
}

function showReport() {
  const { totalAsexuados, totalSexuados, totalSeconds } = getTotals();
  const scaleAsex = getParasiteScale(totalAsexuados);
  const scaleSex = getParasiteScale(totalSexuados);
  const lamina = document.getElementById('laminaInput').value || 'Sin Nombre';

  const modalSummary = document.getElementById('modalSummary');
  modalSummary.innerHTML = `
    <strong>Lámina:</strong> ${lamina} | <strong>Tipo:</strong> ${document.querySelector('input[name="especie"]:checked').value}<br>
    <strong>Total Asexuados:</strong> ${totalAsexuados} (Resultado: <strong>${scaleAsex}</strong>)<br>
    <strong>Total Sexuados:</strong> ${totalSexuados} (Resultado: <strong>${scaleSex}</strong>)<br>
    <strong>Tiempo Total:</strong> ${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s
  `;

  const tbody = document.getElementById('reportTableBody');
  tbody.innerHTML = '';
  fieldData.forEach((f, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${f.asexuados}</td>
      <td>${f.sexuados}</td>
      <td>${f.time}s</td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById('reportModal').style.display = 'flex';
}

document.getElementById('btnReportes').addEventListener('click', showReport);
document.getElementById('btnCloseModal').addEventListener('click', () => {
  document.getElementById('reportModal').style.display = 'none';
});

// Exportación a Excel (.CSV)
document.getElementById('btnExcel').addEventListener('click', () => {
  const { totalAsexuados, totalSexuados } = getTotals();
  const lamina = document.getElementById('laminaInput').value || 'Sin_ID';
  let csv = `Reporte de Conteo Parasitologico\n`;
  csv += `Lamina,${lamina}\n`;
  csv += `Tipo,${document.querySelector('input[name="especie"]:checked').value}\n`;
  csv += `Resultado Asexuados,${getParasiteScale(totalAsexuados)} (Total: ${totalAsexuados})\n`;
  csv += `Resultado Sexuados,${getParasiteScale(totalSexuados)} (Total: ${totalSexuados})\n\n`;
  csv += `Campo,Asexuados,Sexuados,Tiempo (segundos)\n`;

  fieldData.forEach((f, i) => {
    csv += `${i + 1},${f.asexuados},${f.sexuados},${f.time}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Malaria_Lamina_${lamina}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

// Registro de Service Worker para soporte Offline
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed:', err));
}

// Inicializar la app
startTimer();
updateUI();