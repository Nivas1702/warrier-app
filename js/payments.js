/**
 * WARRIER - Page 2: Payment Modes & Recurring Bills / EMI / Dues Hub
 */

let activePaymentModeFilter = 'all';
let activeCategoryFilter = 'all';
let activePaymentStatusFilter = 'all';

function initPaymentPage() {
  setupPaymentEventListeners();
  renderPaymentStats();
  renderPaymentList();
}

function setupPaymentEventListeners() {
  // Modal buttons
  const openBtn = document.getElementById('btn-open-payment-modal');
  const closeBtn = document.getElementById('btn-close-payment-modal');
  const cancelBtn = document.getElementById('btn-cancel-payment');

  if (openBtn) openBtn.addEventListener('click', () => openPaymentModal());
  if (closeBtn) closeBtn.addEventListener('click', () => closePaymentModal());
  if (cancelBtn) cancelBtn.addEventListener('click', () => closePaymentModal());

  // Form submit
  const form = document.getElementById('payment-form');
  if (form) {
    form.addEventListener('submit', handlePaymentFormSubmit);
  }

  // EMI checkbox toggle fields
  const isEmiCheckbox = document.getElementById('pay-is-emi');
  const emiFieldsContainer = document.getElementById('emi-specific-fields');
  const paymentModeSelect = document.getElementById('pay-mode');

  if (isEmiCheckbox && emiFieldsContainer) {
    isEmiCheckbox.addEventListener('change', () => {
      emiFieldsContainer.style.display = isEmiCheckbox.checked ? 'grid' : 'none';
    });
  }

  if (paymentModeSelect) {
    paymentModeSelect.addEventListener('change', (e) => {
      const mode = e.target.value;
      if (mode === 'loan_emi' || mode === 'credit_card_emi') {
        if (isEmiCheckbox) {
          isEmiCheckbox.checked = true;
          emiFieldsContainer.style.display = 'grid';
        }
      }
    });
  }

  // Filter dropdowns
  const modeFilter = document.getElementById('payment-mode-filter');
  if (modeFilter) {
    modeFilter.addEventListener('change', (e) => {
      activePaymentModeFilter = e.target.value;
      renderPaymentList();
      highlightActiveModePill();
    });
  }

  const categoryFilter = document.getElementById('payment-cat-filter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      activeCategoryFilter = e.target.value;
      renderPaymentList();
    });
  }

  const statusFilter = document.getElementById('payment-status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      activePaymentStatusFilter = e.target.value;
      renderPaymentList();
    });
  }
}

/**
 * Filter by clicking on the top summary pills
 */
function filterByMode(mode) {
  activePaymentModeFilter = mode;
  const select = document.getElementById('payment-mode-filter');
  if (select) select.value = mode;
  highlightActiveModePill();
  renderPaymentList();
}

function highlightActiveModePill() {
  document.querySelectorAll('.payment-mode-pill').forEach(pill => {
    const pillMode = pill.getAttribute('data-mode');
    if (pillMode === activePaymentModeFilter || (activePaymentModeFilter === 'all' && !pillMode)) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
}

/**
 * Render Payment Mode Summary Statistics
 */
function renderPaymentStats() {
  const payments = window.StorageService.getPayments();
  const warranties = window.StorageService.getWarranties();

  let cashTotal = 0, cashCount = 0;
  let cardTotal = 0, cardCount = 0;
  let loanTotal = 0, loanCount = 0;
  let ccEmiTotal = 0, ccEmiCount = 0;

  // Aggregate pending / active dues
  payments.forEach(p => {
    const amt = parseFloat(p.amount) || 0;
    if (p.paymentMode === 'direct_cash') {
      cashTotal += amt;
      cashCount++;
    } else if (p.paymentMode === 'credit_debit_card') {
      cardTotal += amt;
      cardCount++;
    } else if (p.paymentMode === 'loan_emi') {
      loanTotal += amt;
      loanCount++;
    } else if (p.paymentMode === 'credit_card_emi') {
      ccEmiTotal += amt;
      ccEmiCount++;
    }
  });

  const elCash = document.getElementById('stat-mode-cash');
  const elCard = document.getElementById('stat-mode-card');
  const elLoan = document.getElementById('stat-mode-loan');
  const elCcEmi = document.getElementById('stat-mode-ccemi');

  if (elCash) elCash.textContent = window.CurrencyUtils.format(cashTotal);
  if (elCard) elCard.textContent = window.CurrencyUtils.format(cardTotal);
  if (elLoan) elLoan.textContent = window.CurrencyUtils.format(loanTotal);
  if (elCcEmi) elCcEmi.textContent = window.CurrencyUtils.format(ccEmiTotal);

  const elCashCount = document.getElementById('stat-count-cash');
  const elCardCount = document.getElementById('stat-count-card');
  const elLoanCount = document.getElementById('stat-count-loan');
  const elCcEmiCount = document.getElementById('stat-count-ccemi');

  if (elCashCount) elCashCount.textContent = `${cashCount} direct schedule${cashCount !== 1 ? 's' : ''}`;
  if (elCardCount) elCardCount.textContent = `${cardCount} active card line${cardCount !== 1 ? 's' : ''}`;
  if (elLoanCount) elLoanCount.textContent = `${loanCount} financing facilit${loanCount !== 1 ? 'ies' : 'y'}`;
  if (elCcEmiCount) elCcEmiCount.textContent = `${ccEmiCount} structured EMI line${ccEmiCount !== 1 ? 's' : ''}`;

  // Top summary widgets
  const totalUpcomingDues = payments
    .filter(p => p.status !== 'paid')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  
  const elUpcomingTotal = document.getElementById('stat-upcoming-dues-total');
  if (elUpcomingTotal) elUpcomingTotal.textContent = window.CurrencyUtils.format(totalUpcomingDues);

  const totalWarrantyValue = warranties.reduce((sum, w) => sum + (parseFloat(w.price) || 0), 0);
  const elWarrantyValue = document.getElementById('stat-warranty-value-total');
  if (elWarrantyValue) elWarrantyValue.textContent = window.CurrencyUtils.format(totalWarrantyValue);
}

/**
 * Render Payments & EMI List
 */
function renderPaymentList() {
  const container = document.getElementById('payments-list-container');
  if (!container) return;

  const payments = window.StorageService.getPayments();

  // Filter
  const filtered = payments.filter(p => {
    // Mode filter
    if (activePaymentModeFilter !== 'all' && p.paymentMode !== activePaymentModeFilter) {
      return false;
    }
    // Category filter
    if (activeCategoryFilter !== 'all' && p.category !== activeCategoryFilter) {
      return false;
    }
    // Status filter
    if (activePaymentStatusFilter === 'pending' && p.status === 'paid') return false;
    if (activePaymentStatusFilter === 'paid' && p.status !== 'paid') return false;
    if (activePaymentStatusFilter === 'urgent') {
      const dueInfo = window.DateUtils.getDueInfo(p.dueDate, p.status);
      if (!dueInfo.urgent) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-credit-card"></i>
        <h3>No payments found</h3>
        <p>No bills or EMIs match your selected filter criteria. Add a payment or adjust filters.</p>
        <button class="btn-primary" onclick="openPaymentModal()">
          <i class="fa-solid fa-plus"></i> Add New Bill / EMI
        </button>
      </div>
    `;
    return;
  }

  // Sort by urgency / due date
  filtered.sort((a, b) => {
    if (a.status === 'paid' && b.status !== 'paid') return 1;
    if (a.status !== 'paid' && b.status === 'paid') return -1;
    const dateA = window.DateUtils.parseDate(a.dueDate).getTime();
    const dateB = window.DateUtils.parseDate(b.dueDate).getTime();
    return dateA - dateB;
  });

  container.innerHTML = filtered.map(item => {
    const isPaid = item.status === 'paid';
    const dueInfo = window.DateUtils.getDueInfo(item.dueDate, item.status);
    const catStyle = getCategoryStyle(item.category);
    const modeBadge = getPaymentModeBadge(item.paymentMode);

    // EMI progress calculation
    let emiHtml = '';
    if (item.isEmi && item.totalTenureMonths) {
      const curr = item.currentInstallment || 1;
      const total = item.totalTenureMonths || 12;
      const pct = Math.min(100, Math.round((curr / total) * 100));
      emiHtml = `
        <div class="emi-progress-wrap">
          <div class="emi-progress-header">
            <span>Installment: <strong>${curr} / ${total}</strong></span>
            <span>${pct}% Paid</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar-fill" style="width: ${pct}%"></div>
          </div>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 3px;">
            ${item.totalAmount ? `Total: ${window.CurrencyUtils.format(item.totalAmount)}` : 'Monthly installment'}
          </div>
        </div>
      `;
    }

    return `
      <div class="payment-item-card ${isPaid ? 'paid-row' : ''}" data-id="${item.id}">
        <!-- Category Icon -->
        <div class="payment-cat-icon" style="--cat-bg: ${catStyle.bg}; --cat-color: ${catStyle.color};">
          <i class="${catStyle.icon}"></i>
        </div>

        <!-- Title & Category Info -->
        <div class="payment-primary-info">
          <h4>
            ${escapeHtml(item.title)}
            ${item.isRecurring ? '<span style="font-size: 11px; background: rgba(99, 102, 241, 0.15); color: #818cf8; padding: 2px 7px; border-radius: 4px;">Recurring</span>' : ''}
          </h4>
          <div class="payment-meta">
            <span><i class="fa-solid fa-tag"></i> ${escapeHtml(item.category)}</span>
            ${modeBadge}
            ${item.lateFeePolicy ? `<span style="color: #fb923c;"><i class="fa-solid fa-shield-cat"></i> ${escapeHtml(item.lateFeePolicy)}</span>` : ''}
          </div>
          ${item.notes ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;"><i class="fa-regular fa-comment-dots"></i> ${escapeHtml(item.notes)}</div>` : ''}
        </div>

        <!-- EMI Progress if applicable -->
        ${emiHtml}

        <!-- Due Date & Urgency Badge (Decreases Late Fees!) -->
        <div class="due-status-box">
          <div class="due-date-text">
            <i class="fa-regular fa-calendar"></i> Due: <strong>${item.dueDate}</strong>
          </div>
          <span class="due-countdown-tag ${dueInfo.class}">
            ${dueInfo.text}
          </span>
        </div>

        <!-- Amount & Settle Action -->
        <div class="payment-amount-col">
          <div class="payment-amount-val">${window.CurrencyUtils.format(item.amount)}</div>
          <div class="payment-sub-cycle">${item.frequency || 'Monthly'}</div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <button 
            class="btn-mark-paid ${isPaid ? 'is-paid' : ''}" 
            onclick="togglePaymentPaid('${item.id}')"
            title="${isPaid ? 'Payment already recorded' : 'Mark as paid to decrease late fee'}">
            ${isPaid ? '<i class="fa-solid fa-check-double"></i> Settled' : '<i class="fa-solid fa-check"></i> Mark Paid'}
          </button>
          <button class="btn-card-action danger" onclick="deletePaymentItem('${item.id}')" title="Delete payment entry">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function getCategoryStyle(category) {
  switch (category) {
    case 'Rent':
      return { icon: 'fa-solid fa-house', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    case 'Electricity':
      return { icon: 'fa-solid fa-bolt', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    case 'Credit Card EMI':
      return { icon: 'fa-solid fa-credit-card', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' };
    case 'Loan EMI':
      return { icon: 'fa-solid fa-building-columns', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' };
    case 'Product Purchases':
      return { icon: 'fa-solid fa-bag-shopping', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' };
    default:
      return { icon: 'fa-solid fa-receipt', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' };
  }
}

function getPaymentModeBadge(mode) {
  switch (mode) {
    case 'direct_cash':
      return `<span class="payment-mode-tag" style="color: #34d399;"><i class="fa-solid fa-money-bill-wave"></i> Direct Cash</span>`;
    case 'credit_debit_card':
      return `<span class="payment-mode-tag" style="color: #60a5fa;"><i class="fa-solid fa-credit-card"></i> Card</span>`;
    case 'loan_emi':
      return `<span class="payment-mode-tag" style="color: #c084fc;"><i class="fa-solid fa-landmark"></i> Loan / EMI</span>`;
    case 'credit_card_emi':
      return `<span class="payment-mode-tag" style="color: #fb923c;"><i class="fa-solid fa-credit-card"></i> CC EMI</span>`;
    default:
      return `<span class="payment-mode-tag">${mode}</span>`;
  }
}

function togglePaymentPaid(id) {
  window.StorageService.togglePaymentStatus(id);
  renderPaymentStats();
  renderPaymentList();
  window.updateTopAlertBanner();
  if (window.renderAnalytics) window.renderAnalytics();
}

function deletePaymentItem(id) {
  if (confirm('Delete this payment / EMI record?')) {
    window.StorageService.deletePayment(id);
    renderPaymentStats();
    renderPaymentList();
    window.updateTopAlertBanner();
    if (window.renderAnalytics) window.renderAnalytics();
  }
}

function openPaymentModal() {
  const modal = document.getElementById('payment-modal');
  if (!modal) return;
  modal.classList.add('open');

  const form = document.getElementById('payment-form');
  if (form) form.reset();

  const dueDateInput = document.getElementById('pay-due-date');
  if (dueDateInput) {
    dueDateInput.value = window.DateUtils.formatDDMMYYYY(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000));
  }
}

function closePaymentModal() {
  const modal = document.getElementById('payment-modal');
  if (modal) modal.classList.remove('open');
}

function handlePaymentFormSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('pay-title').value.trim();
  const category = document.getElementById('pay-category').value;
  const paymentMode = document.getElementById('pay-mode').value;
  const amount = parseFloat(document.getElementById('pay-amount').value) || 0;
  const dueDate = document.getElementById('pay-due-date').value.trim();
  const frequency = document.getElementById('pay-frequency').value;
  const isEmi = document.getElementById('pay-is-emi').checked;
  const currentInstallment = parseInt(document.getElementById('pay-current-inst').value, 10) || 1;
  const totalTenureMonths = parseInt(document.getElementById('pay-total-tenure').value, 10) || 12;
  const totalAmount = parseFloat(document.getElementById('pay-total-amt').value) || (amount * totalTenureMonths);
  const lateFeePolicy = document.getElementById('pay-late-fee-note').value.trim();
  const notes = document.getElementById('pay-notes').value.trim();

  if (!title || !dueDate || amount <= 0) {
    alert('Please enter a valid title, due date, and amount.');
    return;
  }

  const newPayment = {
    id: 'pay_' + Date.now(),
    title,
    category,
    paymentMode,
    amount,
    dueDate,
    frequency,
    isRecurring: frequency !== 'One-Time',
    isEmi,
    currentInstallment,
    totalTenureMonths,
    totalAmount,
    status: 'pending',
    lateFeePolicy: lateFeePolicy || 'Late payment penalty applicable',
    notes,
    createdAt: new Date().toISOString()
  };

  window.StorageService.addPayment(newPayment);
  closePaymentModal();
  renderPaymentStats();
  renderPaymentList();
  window.updateTopAlertBanner();
  if (window.renderAnalytics) window.renderAnalytics();
}

window.initPaymentPage = initPaymentPage;
window.renderPaymentStats = renderPaymentStats;
window.renderPaymentList = renderPaymentList;
window.openPaymentModal = openPaymentModal;
window.closePaymentModal = closePaymentModal;
window.filterByMode = filterByMode;
window.togglePaymentPaid = togglePaymentPaid;
window.deletePaymentItem = deletePaymentItem;
