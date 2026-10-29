/**
 * WARRIER - Main Application Orchestrator
 * Tab Navigation, Currency Switching, Theme Handling, Analytics, and Notifications
 */

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  setupNavigationTabs();
  setupCurrencySelector();
  setupThemeToggle();
  setupNotificationBell();
  setupBackupRestore();

  // Initialize Pages
  window.initWarrantyPage();
  window.initPaymentPage();
  if (window.initCalculator) window.initCalculator();
  renderAnalytics();
}

/**
 * Tab Navigation between Page 1 (Warranties), Page 2 (Payments), and Page 3 (Analytics)
 */
function setupNavigationTabs() {
  const tabs = document.querySelectorAll('.nav-tab-btn');
  const pages = document.querySelectorAll('.page-view');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetPageId = tab.getAttribute('data-target');
      
      // Update tab active state
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update page views
      pages.forEach(p => {
        if (p.id === targetPageId) {
          p.style.display = 'block';
        } else {
          p.style.display = 'none';
        }
      });

      // Refresh corresponding data if needed
      if (targetPageId === 'page-warranties') {
        window.renderWarrantyList();
      } else if (targetPageId === 'page-payments') {
        window.renderPaymentStats();
        window.renderPaymentList();
      } else if (targetPageId === 'page-analytics') {
        renderAnalytics();
      }
    });
  });
}

function switchPage(pageId) {
  const tabBtn = document.querySelector(`.nav-tab-btn[data-target="${pageId}"]`);
  if (tabBtn) tabBtn.click();
}

/**
 * Currency Selector
 */
function setupCurrencySelector() {
  const select = document.getElementById('currency-selector');
  if (!select) return;

  const current = window.StorageService.getCurrency();
  select.value = current;

  select.addEventListener('change', (e) => {
    window.StorageService.setCurrency(e.target.value);
    window.renderWarrantyList();
    window.renderPaymentStats();
    window.renderPaymentList();
    renderAnalytics();
  });
}

/**
 * Dark / Light Theme Toggle
 */
function setupThemeToggle() {
  const themeBtn = document.getElementById('btn-toggle-theme');
  if (!themeBtn) return;

  const savedTheme = localStorage.getItem('warrier_theme_v1') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }

  themeBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('warrier_theme_v1', isLight ? 'light' : 'dark');
    themeBtn.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    if (window.renderWarrantyList) window.renderWarrantyList();
  });
}

/**
 * Notification Bell Popover
 */
function setupNotificationBell() {
  const bellBtn = document.getElementById('btn-nav-notif');
  const notifModal = document.getElementById('notifications-modal');
  const closeNotifBtn = document.getElementById('btn-close-notif-modal');

  if (bellBtn && notifModal) {
    bellBtn.addEventListener('click', () => {
      populateNotificationList();
      notifModal.classList.add('open');
    });
  }

  if (closeNotifBtn && notifModal) {
    closeNotifBtn.addEventListener('click', () => {
      notifModal.classList.remove('open');
    });
  }
}

function populateNotificationList() {
  const listContainer = document.getElementById('notifications-list');
  if (!listContainer) return;

  const warranties = window.StorageService.getWarranties();
  const payments = window.StorageService.getPayments();

  let html = '';

  // 1. Warranties expiring soon (< 60 days)
  const expiringWarranties = warranties.filter(item => {
    const expiry = window.DateUtils.calculateExpiryDate(item.purchaseDate, item.warrantyValue, item.warrantyUnit);
    const info = window.DateUtils.getRemainingInfo(expiry);
    return info.isWarning && !info.isExpired;
  });

  expiringWarranties.forEach(item => {
    const expiry = window.DateUtils.calculateExpiryDate(item.purchaseDate, item.warrantyValue, item.warrantyUnit);
    const info = window.DateUtils.getRemainingInfo(expiry);
    html += `
      <div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 12px 14px; border-radius: 8px; margin-bottom: 10px;">
        <div style="font-size: 13px; font-weight: 700; color: #fbbf24;">
          <i class="fa-solid fa-triangle-exclamation"></i> Warranty Expiry Alert: ${escapeHtml(item.productName)}
        </div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 3px;">
          Expires on ${window.DateUtils.formatDDMMYYYY(expiry)} &bull; <strong>${info.text}</strong> left!
        </div>
        <div style="margin-top: 8px;">
          <button class="btn-alert" onclick="openBillViewer('${item.id}'); document.getElementById('notifications-modal').classList.remove('open');">
            Inspect Bill Receipt
          </button>
        </div>
      </div>
    `;
  });

  // 2. Upcoming / Overdue Payment Dues
  const pendingPayments = payments.filter(p => p.status !== 'paid');
  pendingPayments.forEach(p => {
    const dueInfo = window.DateUtils.getDueInfo(p.dueDate, p.status);
    const isUrgent = dueInfo.urgent;
    html += `
      <div style="background: ${isUrgent ? 'rgba(244, 63, 94, 0.1)' : 'rgba(99, 102, 241, 0.08)'}; border-left: 4px solid ${isUrgent ? '#f43f5e' : '#6366f1'}; padding: 12px 14px; border-radius: 8px; margin-bottom: 10px;">
        <div style="font-size: 13px; font-weight: 700; color: ${isUrgent ? '#fb7185' : '#a5b4fc'};">
          <i class="fa-solid fa-bell"></i> ${p.category}: ${escapeHtml(p.title)}
        </div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 3px;">
          Amount: <strong>${window.CurrencyUtils.format(p.amount)}</strong> &bull; Due Date: <strong>${p.dueDate}</strong> (${dueInfo.text})
        </div>
        <div style="font-size: 11px; color: #fb923c; margin-top: 3px;">
          <i class="fa-solid fa-shield-halved"></i> ${escapeHtml(p.lateFeePolicy)}
        </div>
      </div>
    `;
  });

  if (!html) {
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 30px 10px; color: var(--text-muted);">
        <i class="fa-regular fa-bell-slash" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>
        All warranties and payments are up to date! No pending alerts.
      </div>
    `;
  } else {
    listContainer.innerHTML = html;
  }
}

/**
 * Backup / Export & Seed Reset
 */
function setupBackupRestore() {
  const exportBtn = document.getElementById('btn-export-data');
  const resetBtn = document.getElementById('btn-reset-demo');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const data = {
        warranties: window.StorageService.getWarranties(),
        payments: window.StorageService.getPayments(),
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `warrier-backup-${window.DateUtils.formatDDMMYYYY(new Date()).replace(/\//g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all data to default demo seed records?')) {
        window.StorageService.resetDemoData();
      }
    });
  }
}

/**
 * PAGE 3: Analytics & Breakdown Charts
 */
function renderAnalytics() {
  const payments = window.StorageService.getPayments();
  const warranties = window.StorageService.getWarranties();

  // Mode breakdown
  const modes = {
    'direct_cash': { label: 'Direct Cash', amount: 0, color: '#10b981' },
    'credit_debit_card': { label: 'Credit / Debit Card', amount: 0, color: '#3b82f6' },
    'loan_emi': { label: 'Loan / EMI', amount: 0, color: '#8b5cf6' },
    'credit_card_emi': { label: 'Credit Card EMI', amount: 0, color: '#f97316' }
  };

  let totalSpent = 0;
  payments.forEach(p => {
    const amt = parseFloat(p.amount) || 0;
    if (modes[p.paymentMode]) {
      modes[p.paymentMode].amount += amt;
      totalSpent += amt;
    }
  });

  const barsContainer = document.getElementById('analytics-mode-bars');
  if (barsContainer) {
    if (totalSpent === 0) {
      barsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">No payments recorded yet.</p>';
    } else {
      barsContainer.innerHTML = Object.values(modes).map(m => {
        const pct = Math.round((m.amount / totalSpent) * 100);
        return `
          <div class="bar-row">
            <div class="bar-meta">
              <span style="color: var(--text-primary);"><i class="fa-solid fa-circle" style="color: ${m.color}; font-size: 8px;"></i> ${m.label}</span>
              <span><strong>${window.CurrencyUtils.format(m.amount)}</strong> (${pct}%)</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" style="width: ${pct}%; background: ${m.color};"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Warranty Coverage Status Ratio
  let activeWarrCount = 0, warningWarrCount = 0, expiredWarrCount = 0;
  warranties.forEach(item => {
    const exp = window.DateUtils.calculateExpiryDate(item.purchaseDate, item.warrantyValue, item.warrantyUnit);
    const info = window.DateUtils.getRemainingInfo(exp);
    if (info.isExpired) expiredWarrCount++;
    else if (info.isWarning) warningWarrCount++;
    else activeWarrCount++;
  });

  const warrSummary = document.getElementById('analytics-warr-summary');
  if (warrSummary) {
    warrSummary.innerHTML = `
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-subtle);">
        <span style="color: #34d399;"><i class="fa-solid fa-shield-halved"></i> Active Covered Products</span>
        <strong>${activeWarrCount}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-subtle);">
        <span style="color: #fbbf24;"><i class="fa-solid fa-triangle-exclamation"></i> Expiring Soon (1-2 mo.)</span>
        <strong>${warningWarrCount}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 10px 0;">
        <span style="color: #fb7185;"><i class="fa-solid fa-circle-xmark"></i> Expired Warranties</span>
        <strong>${expiredWarrCount}</strong>
      </div>
    `;
  }

  // Late Fee Avoidance Estimate
  const lateFeeSaved = payments.filter(p => p.status === 'paid').length * 45;
  const elSaved = document.getElementById('analytics-late-fee-saved');
  if (elSaved) {
    elSaved.textContent = window.CurrencyUtils.format(lateFeeSaved);
  }
}

window.switchPage = switchPage;
window.renderAnalytics = renderAnalytics;
