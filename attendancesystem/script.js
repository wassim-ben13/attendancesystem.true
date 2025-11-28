
// constants / state
const totalSessions = 6;
let chartInstance = null;

// ---------- utilitaires ----------
function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

// calcule et applique l'état d'une ligne (absences, classes, message)
function updateRow(row){
  const att = qsa('.attendance', row);
  const part = qsa('.participation', row);
  const attendedCount = att.filter(cb => cb.checked).length;
  const participationsCount = part.filter(cb => cb.checked).length;
  const absences = totalSessions - attendedCount;

  const absCell = qs('.absences', row);
  if(absCell) absCell.textContent = absences;

  // reset classes (preserve 'excellent' until reset button)
  row.classList.remove('row-green','row-yellow','row-red');
  if(absences < 3) row.classList.add('row-green');
  else if(absences < 5) row.classList.add('row-yellow');
  else row.classList.add('row-red');

  const msgInput = qs('.message-input', row);
  if(msgInput){
    if(absences < 3 && participationsCount >= 4) msgInput.value = 'Good attendance – Excellent participation';
    else if(absences < 5) msgInput.value = 'Warning – attendance low – You need to participate more';
    else msgInput.value = 'Excluded – too many absences – You need to participate more';
  }
}

// met à jour toutes les lignes du tableau
function updateAllRows(){
  qsa('#attendanceTable tbody tr').forEach(row => updateRow(row));
}

// ---------- délégation d'événements ----------
document.addEventListener('change', function(e){
  if(e.target && (e.target.matches('.attendance') || e.target.matches('.participation'))){
    const tr = e.target.closest('tr');
    if(tr) updateRow(tr);
  }
});

// Empêcher les clics sur inputs de déclencher le click sur la ligne (utile pour jQuery)
document.addEventListener('click', function(e){
  if(e.target && e.target.tagName.toLowerCase() === 'input') {
    e.stopPropagation && e.stopPropagation();
  }
}, true);

// ---------- Formulaire: validation + ajout ----------
document.addEventListener('DOMContentLoaded', function(){

  const form = document.getElementById('studentForm');
  const confirmation = document.getElementById('confirmation');

  form.addEventListener('submit', function(ev){
    ev.preventDefault();

    // reset errors
    const idError = document.getElementById('idError');
    const firstNameError = document.getElementById('firstNameError');
    const lastNameError = document.getElementById('lastNameError');
    const emailError = document.getElementById('emailError');
    idError.textContent = '';
    firstNameError.textContent = '';
    lastNameError.textContent = '';
    emailError.textContent = '';
    confirmation.textContent = '';

    // values
    const id = (document.getElementById('studentId') || {value:''}).value.trim();
    const last = (document.getElementById('lastName') || {value:''}).value.trim();
    const first = (document.getElementById('firstName') || {value:''}).value.trim();
    const course = (document.getElementById('course') || {value:''}).value.trim();
    const email = (document.getElementById('email') || {value:''}).value.trim();

    let ok = true;
    if(!/^[0-9]+$/.test(id)){ idError.textContent = 'Enter a numeric ID.'; ok=false; }
    if(!/^[A-Za-zÀ-ÖØ-öø-ÿ\s-]+$/.test(first) || first.length===0){ firstNameError.textContent = 'Invalid first name.'; ok=false; }
    if(!/^[A-Za-zÀ-ÖØ-öø-ÿ\s-]+$/.test(last) || last.length===0){ lastNameError.textContent = 'Invalid last name.'; ok=false; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){ emailError.textContent = 'Invalid email.'; ok=false; }

    if(!ok) return;

    // create new row (same structure que les autres lignes)
    const tbody = document.querySelector('#attendanceTable tbody');
    const tr = document.createElement('tr');

    // build 6 attendance and 6 participation td cells
    const attendanceCells = Array.from({length: totalSessions}).map(()=>'<td><input type="checkbox" class="attendance"></td>').join('');
    const participationCells = Array.from({length: totalSessions}).map(()=>'<td><input type="checkbox" class="participation"></td>').join('');

    tr.innerHTML = `
      <td>${id}</td>
      <td class="student-name">${last}</td>
      <td>${first}</td>
      <td>${course || ''}</td>
      ${attendanceCells}
      ${participationCells}
      <td class="absences">0</td>
      <td><input class="message-input" type="text" readonly></td>
    `;

    tbody.appendChild(tr);

    // initialiser la nouvelle ligne
    updateRow(tr);

    confirmation.textContent = 'Student successfully added';
    form.reset();
    setTimeout(()=>{ confirmation.textContent = ''; }, 1800);
  });
  
  updateAllRows();

  // ---------- Show Report (graf + stats) ----------
  document.getElementById('showReport').addEventListener('click', function(){
    updateAllRows();
    const rows = qsa('#attendanceTable tbody tr');

    const sessionLabels = Array.from({length: totalSessions}).map((_,i)=>`S${i+1}`);
    const presencePerSession = Array.from({length: totalSessions}).map(()=>0);
    const participationPerSession = Array.from({length: totalSessions}).map(()=>0);

    let presentStudents = 0;
    let participatedStudents = 0;

    rows.forEach(tr => {
      const att = qsa('.attendance', tr);
      const part = qsa('.participation', tr);

      att.forEach((cb, idx) => { if(cb.checked) presencePerSession[idx]++; });
      part.forEach((cb, idx) => { if(cb.checked) participationPerSession[idx]++; });

      if(att.some(cb => cb.checked)) presentStudents++;
      if(part.some(cb => cb.checked)) participatedStudents++;
    });

    // update stat cards
    document.getElementById('totalStudents').textContent = 'Total: ' + rows.length;
    document.getElementById('presentStudents').textContent = 'Present: ' + presentStudents;
    document.getElementById('participatedStudents').textContent = 'Participated: ' + participatedStudents;

    // draw chart
    const ctx = document.getElementById('reportChart').getContext('2d');
    if(chartInstance) chartInstance.destroy();

    const yMax = Math.max(1, rows.length); // garde une échelle lisible
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sessionLabels,
        datasets: [
          { label: 'Presence', data: presencePerSession, backgroundColor: '#15448b' },
          { label: 'Participation', data: participationPerSession, backgroundColor: '#77d1e6' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { title: { display: true, text: 'Sessions' } },
          y: {
            min: 0,
            max: yMax,
            beginAtZero: true,
            title: { display: true, text: 'Number of students' },
            ticks: { stepSize: 1, callback: function(value){ return Number.isInteger(value) ? value : ''; } }
          }
        }
      }
    });
  });

  // ---------- Highlight & Reset buttons ----------
  $('#highlightBtn').click(function(){
    $('#attendanceTable tbody tr').each(function(){
      const presentCount = $(this).find('.attendance:checked').length;
      const abs = totalSessions - presentCount;
      if(abs < 3){
        $(this).fadeOut(140).fadeIn(140).addClass('excellent');
      }
    });
  });

  $('#resetColorsBtn').click(function(){
    $('#attendanceTable tbody tr').each(function(){
      $(this).removeClass('excellent hover-highlight row-green row-yellow row-red');
      this.style.backgroundColor = '';
      this.style.transition = '';
      $(this).find('td').each(function(){ this.style.backgroundColor = ''; });
    });
    // recompute classes based on absences
    updateAllRows();
  });

  // small hover highlight (jQuery)
  $('#attendanceTable tbody').on('mouseenter', 'tr', function(){ $(this).addClass('hover-highlight'); });
  $('#attendanceTable tbody').on('mouseleave', 'tr', function(){ $(this).removeClass('hover-highlight'); });

}); // DOMContentLoaded end
