const video = document.getElementById('video');
const reportTable = document.getElementById('report-table').querySelector('tbody');
const summaryDiv = document.getElementById('summary');
const filters = { name: '', date: '' };

// Webcam access
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => video.srcObject = stream)
  .catch(err => console.error('Camera access error:', err));

// Login
document.getElementById('login-btn').addEventListener('click', () => {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (username === 'student.gehu.ac.in' && password === '12345') {
    alert('Login successful!');
    document.getElementById('login-section').style.display = 'none';
    document.querySelector('.container').style.display = 'block';
  } else {
    alert('Invalid username or password.');
  }
});

// Attendance
document.getElementById('capture-btn').addEventListener('click', () => {
  const name = document.getElementById('att-name').value.trim();
  const subject = document.getElementById('att-subject').value.trim();
  if (!name || !subject) return alert('Please enter name and subject.');

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 320;
  canvas.height = video.videoHeight || 240;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  const photo = canvas.toDataURL();

  const entry = {
    type: 'Attendance',
    name,
    subject,
    time: new Date().toISOString(),
    photo,
    notes: ''
  };

  saveEntry(entry);
  renderTable();
});

// Leave
document.getElementById('apply-leave-btn').addEventListener('click', () => {
  const name = document.getElementById('leave-name').value.trim();
  const from = document.getElementById('leave-from').value;
  const to = document.getElementById('leave-to').value;
  const reason = document.getElementById('leave-reason').value.trim();
  if (!name || !from || !to || !reason) return alert('Fill all leave details.');

  const entry = {
    type: 'Leave',
    name,
    subject: `${from} to ${to}`,
    time: reason,
    photo: '',
    notes: ''
  };

  saveEntry(entry);
  renderTable();
});

// Notes
document.getElementById('save-notes-btn').addEventListener('click', () => {
  const notes = document.getElementById('notes-text').value.trim();
  if (!notes) return alert('Write something in the notes.');
  const name = prompt('Enter your name to save notes:').trim();
  if (!name) return;

  const entries = getEntries();
  const userEntries = entries.filter(e => e.name === name);
  if (userEntries.length === 0) return alert('No records found for this name.');

  userEntries.forEach(e => { e.notes = notes; });
  saveAllEntries(entries);
  renderTable();
});

// Search & Filter
document.getElementById('search-name').addEventListener('input', e => {
  filters.name = e.target.value.trim().toLowerCase();
  renderTable();
});

document.getElementById('search-date').addEventListener('change', e => {
  filters.date = e.target.value;
  renderTable();
});

document.getElementById('clear-filters').addEventListener('click', () => {
  filters.name = '';
  filters.date = '';
  document.getElementById('search-name').value = '';
  document.getElementById('search-date').value = '';
  renderTable();
});

// Utility Functions
function saveEntry(entry) {
  const entries = getEntries();
  entries.push(entry);
  saveAllEntries(entries);
}

function getEntries() {
  return JSON.parse(localStorage.getItem('entries') || '[]');
}

function saveAllEntries(entries) {
  localStorage.setItem('entries', JSON.stringify(entries));
}

function renderTable() {
  const entries = getEntries();
  const filtered = entries.filter(e => {
    const matchesName = filters.name === '' || e.name.toLowerCase().includes(filters.name);
    const matchesDate = filters.date === '' || (e.type === 'Attendance' && e.time.startsWith(filters.date));
    return matchesName && matchesDate;
  });

  reportTable.innerHTML = '';
  filtered.forEach((entry, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${entry.type}</td>
      <td contenteditable="true" onblur="editField(${i}, 'name', this.textContent)">${entry.name}</td>
      <td contenteditable="true" onblur="editField(${i}, 'subject', this.textContent)">${entry.subject}</td>
      <td contenteditable="true" onblur="editField(${i}, 'time', this.textContent)">${entry.time}</td>
      <td>${entry.photo ? `<img src="${entry.photo}" class="photo-thumb" />` : '—'}</td>
      <td contenteditable="true" onblur="editField(${i}, 'notes', this.textContent)">${entry.notes || ''}</td>
      <td><em>Edit inline</em></td>
    `;
    reportTable.appendChild(tr);
  });

  renderSummary(entries);
}

function editField(index, field, value) {
  const entries = getEntries();
  entries[index][field] = value;
  saveAllEntries(entries);
  renderTable();
}

function renderSummary(entries) {
  const attendanceMap = {};
  entries.forEach(e => {
    if (e.type === 'Attendance') {
      const date = e.time.split('T')[0];
      const key = `${e.name}_${date}`;
      attendanceMap[key] = true;
    }
  });

  const nameDays = {};
  Object.keys(attendanceMap).forEach(key => {
    const [name] = key.split('_');
    nameDays[name] = (nameDays[name] || 0) + 1;
  });

  const allNames = [...new Set(entries.map(e => e.name))];
  let html = '<h3>Attendance Summary</h3><ul>';
  allNames.forEach(name => {
    const count = nameDays[name] || 0;
    const total = Object.keys(attendanceMap).filter(k => k.startsWith(name + '_')).length || 0;
    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
    html += `<li><strong>${name}</strong>: ${count} days (${percent}%)</li>`;
  });
  html += '</ul>';
  summaryDiv.innerHTML = html;
}

// Initialize
renderTable();
