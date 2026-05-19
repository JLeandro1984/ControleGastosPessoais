// Arquivo JS extraído do projeto original para FinTrack
// ==================== STATE ====================
let state = {
  bills: [],
  payments: {}, // key: billId_YYYY-MM => true/false
  income: {},   // key: YYYY-MM => value
  investments: [], // {value, type, date}
  accumulate: false, // opção de acumular saldo
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(), // 0-indexed
};
let editingId = null;
let currentFilter = 'all';
// ==================== INIT ====================
function init() {
  loadFromStorage();
  renderMonthChips();
  document.getElementById('accumulateBalance').checked = !!state.accumulate;
  renderAll();
}
// ==================== STORAGE ====================
function saveToStorage() {
  localStorage.setItem('fintrack_v2', JSON.stringify(state));
}

function toggleAccumulate() {
  state.accumulate = document.getElementById('accumulateBalance').checked;
  saveToStorage();
  renderAll();
}
function loadFromStorage() {
  const raw = localStorage.getItem('fintrack_v2');
  if (raw) {
    try {
      const loaded = JSON.parse(raw);
      state = { ...state, ...loaded };
    } catch(e) {}
  }
}
// ==================== MONTHS ====================
const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTHS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
function currentMonthKey() {
  return `${state.currentYear}-${String(state.currentMonth+1).padStart(2,'0')}`;
}
function renderMonthChips() {
  const container = document.getElementById('monthChips');
  container.innerHTML = '';
  for (let i = -2; i <= 5; i++) {
    let m = state.currentMonth + i;
    let y = state.currentYear;
    while (m < 0) { m += 12; y--; }
    while (m > 11) { m -= 12; y++; }
    const chip = document.createElement('div');
    chip.className = 'month-chip' + (i === 0 ? ' active' : '');
    chip.textContent = `${MONTHS_PT[m]}/${String(y).slice(2)}`;
    chip.onclick = () => selectMonth(y, m);
    container.appendChild(chip);
  }
}
function selectMonth(year, month) {
  state.currentYear = year;
  state.currentMonth = month;
  renderMonthChips();
  renderAll();
}
function shiftMonth(dir) {
  let m = state.currentMonth + dir;
  let y = state.currentYear;
  if (m < 0) { m = 11; y--; }
  if (m > 11) { m = 0; y++; }
  selectMonth(y, m);
}
// ==================== RENDER ====================
function renderAll() {
  renderSummary();
  renderBills();
}
function renderSummary() {
  const mk = currentMonthKey();
  const activeBills = getActiveBills();
  const income = state.income[mk] || 0;
  document.getElementById('incomeDisplay').textContent = fmtCurrency(income);
  let total = 0, paid = 0, pending = 0;
  let paidCount = 0, pendingCount = 0;
  activeBills.forEach(b => {
    const val = b.value || 0;
    total += val;
    const isPaid = !!state.payments[`${b.id}_${mk}`];
    if (isPaid) { paid += val; paidCount++; }
    else { pending += val; pendingCount++; }
  });
  // Acúmulo de saldo
  let prevBalance = 0;
  if (state.accumulate) {
    const [y, m] = mk.split('-');
    let prevY = +y, prevM = +m - 1;
    if (prevM < 1) { prevM = 12; prevY--; }
    const prevKey = `${prevY}-${String(prevM).padStart(2,'0')}`;
    const prevIncome = state.income[prevKey] || 0;
    let prevTotal = 0;
    (state.bills||[]).forEach(b => {
      if (b.recurrence === 'once' && b.monthKey !== prevKey) return;
      if (b.recurrence !== 'once' || b.monthKey === prevKey) {
        prevTotal += b.value || 0;
      }
    });
    prevBalance = prevIncome - prevTotal;
    // Acumula saldo anterior
  }
  document.getElementById('sumTotal').textContent = fmtCurrency(total);
  document.getElementById('sumCount').textContent = `${activeBills.length} conta${activeBills.length !== 1 ? 's' : ''}`;
  document.getElementById('sumPaid').textContent = fmtCurrency(paid);
  document.getElementById('sumPending').textContent = fmtCurrency(pending);
  document.getElementById('pendingCount').textContent = `${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}`;
  const pct = total > 0 ? (paid / total) * 100 : 0;
  document.getElementById('progressFill').style.width = pct + '%';
  let balance = income - total;
  if (state.accumulate) balance += prevBalance;
  if (income > 0) {
    document.getElementById('sumBalance').textContent = fmtCurrency(balance);
    document.getElementById('sumBalance').style.color = balance >= 0 ? 'var(--green)' : 'var(--red)';
    let balDisplay = income - pending;
    if (state.accumulate) balDisplay += prevBalance;
    document.getElementById('balanceDisplay').textContent = fmtCurrency(balDisplay);
    document.getElementById('balanceDisplay').style.color = (balDisplay) >= 0 ? 'var(--purple)' : 'var(--red)';
  } else {
    document.getElementById('sumBalance').textContent = '—';
    document.getElementById('balanceDisplay').textContent = '—';
  }
}

// ========== INVESTIMENTOS ==========
function openInvestmentModal() {
  document.getElementById('investmentModal').style.display = 'flex';
  document.getElementById('inv-value').value = '';
  document.getElementById('inv-type').value = '';
  document.getElementById('inv-date').value = '';
}
function closeInvestmentModal() {
  document.getElementById('investmentModal').style.display = 'none';
}
function saveInvestment() {
  const value = parseFloat(document.getElementById('inv-value').value);
  const type = document.getElementById('inv-type').value;
  const date = document.getElementById('inv-date').value;
  if (!value || value <= 0) { toast('Informe um valor válido', 'error'); return; }
  state.investments.push({ value, type, date });
  saveToStorage();
  closeInvestmentModal();
  renderAll();
  toast('Investimento cadastrado!', 'success');
}
function getActiveBills() {
  const mk = currentMonthKey();
  return state.bills.filter(b => {
    if (b.recurrence === 'once') {
      return b.monthKey === mk;
    }
    return true;
  });
}
function renderBills() {
  const mk = currentMonthKey();
  const activeBills = getActiveBills();
  const first = activeBills.filter(b => b.day <= 15);
  const second = activeBills.filter(b => b.day > 15);
  renderList('list-first', first, mk);
  renderList('list-second', second, mk);
  document.getElementById('section-first').style.display = filterVisible(first) ? '' : 'none';
  document.getElementById('section-second').style.display = filterVisible(second) ? '' : 'none';
}
function filterVisible(bills) {
  if (currentFilter === 'all') return bills.length > 0;
  if (currentFilter === 'first' || currentFilter === 'second') return bills.length > 0;
  return bills.some(b => {
    const mk = currentMonthKey();
    const isPaid = !!state.payments[`${b.id}_${mk}`];
    if (currentFilter === 'paid') return isPaid;
    if (currentFilter === 'pending') return !isPaid;
    return true;
  });
}
function applyFilter(bills) {
  const mk = currentMonthKey();
  if (currentFilter === 'all' || currentFilter === 'first' || currentFilter === 'second') return bills;
  return bills.filter(b => {
    const isPaid = !!state.payments[`${b.id}_${mk}`];
    if (currentFilter === 'paid') return isPaid;
    if (currentFilter === 'pending') return !isPaid;
    return true;
  });
}
function renderList(containerId, bills, mk) {
  const container = document.getElementById(containerId);
  const filtered = applyFilter(bills);
  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>Nenhuma conta aqui</p></div>`;
    return;
  }
  filtered.sort((a,b) => a.day - b.day);
  container.innerHTML = filtered.map(bill => {
    const isPaid = !!state.payments[`${bill.id}_${mk}`];
    const cat = getCategoryLabel(bill.category);
    return `
      <div class="bill-row ${isPaid ? 'paid-row' : ''}" id="row-${bill.id}">
        <div class="bill-info">
          <div class="bill-name">${escHtml(bill.name)}</div>
          <div class="bill-meta">
            <span>${cat}</span>
            ${bill.notes ? `<span>· ${escHtml(bill.notes)}</span>` : ''}
          </div>
        </div>
        <div class="bill-due">dia ${bill.day}</div>
        <div class="bill-value ${!bill.value ? 'no-value' : ''}">${bill.value ? fmtCurrency(bill.value) : '—'}</div>
        <div class="bill-actions">
          <button class="action-btn edit" onclick="editBill('${bill.id}')" title="Editar">✏️</button>
          <button class="action-btn" onclick="deleteBill('${bill.id}')" title="Excluir">🗑</button>
        </div>
        <button class="status-toggle ${isPaid ? 'paid' : ''}" onclick="togglePaid('${bill.id}')" title="${isPaid ? 'Marcar como pendente' : 'Marcar como pago'}">
          ${isPaid ? '✓' : ''}
        </button>
      </div>
    `;
  }).join('');
}
function getCategoryLabel(cat) {
  const map = {
    moradia:'🏠 Moradia', educacao:'📚 Educação', transporte:'🚗 Transporte',
    utilidades:'⚡ Utilidades', saude:'🏥 Saúde', alimentacao:'🍽️ Alimentação',
    lazer:'🎮 Lazer', financeiro:'💳 Financeiro', outro:'📦 Outro'
  };
  return map[cat] || cat;
}
// ==================== TOGGLE PAID ====================
function togglePaid(id) {
  const mk = currentMonthKey();
  const key = `${id}_${mk}`;
  state.payments[key] = !state.payments[key];
  saveToStorage();
  renderAll();
  toast(state.payments[key] ? '✅ Marcado como pago!' : '⬜ Desmarcado', state.payments[key] ? 'success' : 'info');
}
// ==================== MODAL ====================
function openModal(id = null) {
  editingId = id;
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('modalTitle').textContent = id ? 'Editar Conta' : 'Nova Conta';
  if (id) {
    const b = state.bills.find(x => x.id === id);
    document.getElementById('f-name').value = b.name;
    document.getElementById('f-day').value = b.day;
    document.getElementById('f-value').value = b.value || '';
    document.getElementById('f-category').value = b.category;
    document.getElementById('f-recurrence').value = b.recurrence || 'monthly';
    document.getElementById('f-notes').value = b.notes || '';
  } else {
    document.getElementById('f-name').value = '';
    document.getElementById('f-day').value = '';
    document.getElementById('f-value').value = '';
    document.getElementById('f-category').value = 'outro';
    document.getElementById('f-recurrence').value = 'monthly';
    document.getElementById('f-notes').value = '';
  }
  overlay.classList.add('open');
  setTimeout(() => document.getElementById('f-name').focus(), 200);
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingId = null;
}
function saveBill() {
  const name = document.getElementById('f-name').value.trim();
  const day = parseInt(document.getElementById('f-day').value);
  const value = parseFloat(document.getElementById('f-value').value) || 0;
  const category = document.getElementById('f-category').value;
  const recurrence = document.getElementById('f-recurrence').value;
  const notes = document.getElementById('f-notes').value.trim();
  if (!name) { toast('⚠️ Informe o nome da conta', 'error'); return; }
  if (!day || day < 1 || day > 31) { toast('⚠️ Dia inválido (1-31)', 'error'); return; }
  if (editingId) {
    const idx = state.bills.findIndex(b => b.id === editingId);
    if (idx !== -1) {
      state.bills[idx] = { ...state.bills[idx], name, day, value, category, recurrence, notes };
      toast('✅ Conta atualizada!', 'success');
    }
  } else {
    const bill = {
      id: 'b_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
      name, day, value, category, recurrence, notes,
      monthKey: currentMonthKey(),
      createdAt: new Date().toISOString(),
    };
    state.bills.push(bill);
    toast('✅ Conta adicionada!', 'success');
  }
  saveToStorage();
  closeModal();
  renderAll();
}
// ==================== EDIT / DELETE ====================
function editBill(id) { openModal(id); }
function deleteBill(id) {
  const b = state.bills.find(x => x.id === id);
  if (!b) return;
  showConfirm(
    'Excluir conta',
    `Deseja excluir "${b.name}"? Os registros de pagamento também serão removidos.`,
    () => {
      state.bills = state.bills.filter(x => x.id !== id);
      Object.keys(state.payments).forEach(k => {
        if (k.startsWith(id + '_')) delete state.payments[k];
      });
      saveToStorage();
      renderAll();
      toast('🗑 Conta removida', 'info');
    }
  );
}
// ==================== INCOME ====================
function editIncome() {
  const mk = currentMonthKey();
  const current = state.income[mk] || 0;
  const val = prompt(`Renda de ${MONTHS_FULL[state.currentMonth]}/${state.currentYear}:`, current);
  if (val === null) return;
  const parsed = parseFloat(val.replace(',','.'));
  if (isNaN(parsed) || parsed < 0) { toast('⚠️ Valor inválido', 'error'); return; }
  state.income[mk] = parsed;
  saveToStorage();
  renderAll();
  toast('💰 Renda atualizada!', 'success');
}
// ==================== FILTER ====================
function setFilter(filter, el) {
  currentFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderBills();
}
// ==================== EXPORT / IMPORT ====================
function exportData() {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fintrack_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('⬇ Backup exportado!', 'success');
}
function importTrigger() { document.getElementById('import-input').click(); }
function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      showConfirm('Importar backup', 'Isso substituirá todos os dados atuais. Continuar?', () => {
        state = { ...state, ...data };
        saveToStorage();
        renderMonthChips();
        renderAll();
        toast('✅ Backup importado com sucesso!', 'success');
      });
    } catch(err) {
      toast('❌ Arquivo inválido', 'error');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}
// ==================== HELPERS ====================
function fmtCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}
function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}
// ==================== TOAST ====================
function toast(msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
// ==================== CONFIRM ====================
function showConfirm(title, msg, onConfirm) {
  const div = document.createElement('div');
  div.className = 'confirm-overlay';
  div.innerHTML = `
    <div class="confirm-box">
      <div class="confirm-title">${title}</div>
      <div class="confirm-msg">${msg}</div>
      <div class="confirm-btns">
        <button class="btn btn-ghost" id="conf-cancel">Cancelar</button>
        <button class="btn btn-danger" id="conf-ok">Confirmar</button>
      </div>
    </div>
  `;
  document.body.appendChild(div);
  div.querySelector('#conf-cancel').onclick = () => div.remove();
  div.querySelector('#conf-ok').onclick = () => { div.remove(); onConfirm(); };
}
// ==================== KEYBOARD ====================
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Escape') closeInvestmentModal();
});
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});
document.getElementById('investmentModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeInvestmentModal();
});
// ==================== START ====================
// ========== GRÁFICOS =============
let pieChart, barChart;

function renderCharts() {
  renderPieChart();
  renderBarChart();
}

function renderPieChart() {
  const mk = currentMonthKey();
  const bills = getActiveBills();
  const catMap = {};
  bills.forEach(b => {
    if (!b.value) return;
    catMap[b.category] = (catMap[b.category] || 0) + b.value;
  });
  const labels = Object.keys(catMap).map(getCategoryLabel);
  const data = Object.values(catMap);
  const colors = [
    '#4f8aff','#2ecc8a','#ff5f6e','#f5c842','#a78bfa','#e67e22','#1abc9c','#e84393','#636e72'
  ];
  const ctx = document.getElementById('pieChart').getContext('2d');
  if (pieChart) pieChart.destroy();
  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom', labels: { color: '#e8eaf2', font: { size: 13 } } }
      }
    }
  });
}

function renderBarChart() {
  // Mostra últimos 6 meses
  const now = new Date(state.currentYear, state.currentMonth);
  const months = [];
  const values = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i);
    const mk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    months.push(`${MONTHS_PT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`);
    // Soma dos valores das contas do mês
    let total = 0;
    (state.bills||[]).forEach(b => {
      if (b.recurrence === 'once' && b.monthKey !== mk) return;
      if (b.recurrence !== 'once' || b.monthKey === mk) {
        total += b.value || 0;
      }
    });
    values.push(total);
  }
  const ctx = document.getElementById('barChart').getContext('2d');
  if (barChart) barChart.destroy();
  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Total de contas',
        data: values,
        backgroundColor: '#4f8aff',
        borderRadius: 8,
        maxBarThickness: 32
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { ticks: { color: '#e8eaf2', font: { size: 12 } }, grid: { display: false } },
        y: { ticks: { color: '#e8eaf2', font: { size: 12 }, callback: v => fmtCurrency(v) }, grid: { color: '#232840' } }
      }
    }
  });
}

// Hook para atualizar gráficos junto com o resto
const _oldRenderAll = renderAll;
renderAll = function() {
  _oldRenderAll();
  setTimeout(renderCharts, 0);
}

init();
