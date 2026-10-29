/**
 * WARRIER - Page 1: Warranty Tracker & Bill Management Logic
 */

let currentBillDataUrl = null;
let activeFilter = 'all';
let searchQuery = '';

function initWarrantyPage() {
  setupWarrantyEventListeners();
  renderWarrantyList();
  updateTopAlertBanner();
}

function setupWarrantyEventListeners() {
  // Modal toggle
  const openBtn = document.getElementById('btn-open-warranty-modal');
  const closeBtn = document.getElementById('btn-close-warranty-modal');
  const cancelBtn = document.getElementById('btn-cancel-warranty');
  const modal = document.getElementById('warranty-modal');

  if (openBtn) openBtn.addEventListener('click', () => openWarrantyModal());
  if (closeBtn) closeBtn.addEventListener('click', () => closeWarrantyModal());
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeWarrantyModal());

  // Form submit
  const form = document.getElementById('warranty-form');
  if (form) {
    form.addEventListener('submit', handleWarrantyFormSubmit);
  }

  // Image Upload Handling
  const dropZone = document.getElementById('bill-upload-zone');
  const fileInput = document.getElementById('bill-photo-input');
  const removePreviewBtn = document.getElementById('btn-remove-preview');
  const ocrAutoFillBtn = document.getElementById('btn-ocr-auto');

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and Drop
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processUploadedImage(e.dataTransfer.files[0]);
      }
    });
  }

  if (removePreviewBtn) {
    removePreviewBtn.addEventListener('click', clearImagePreview);
  }

  if (ocrAutoFillBtn) {
    ocrAutoFillBtn.addEventListener('click', simulateBillOCRScan);
  }

  // Search & Filter
  const searchInput = document.getElementById('warranty-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderWarrantyList();
    });
  }

  const filterSelect = document.getElementById('warranty-status-filter');
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      activeFilter = e.target.value;
      renderWarrantyList();
    });
  }

  // Real-time Expiry Date Preview in Form
  const purchaseDateInput = document.getElementById('warr-purchase-date');
  const warrantyValInput = document.getElementById('warr-val');
  const warrantyUnitInput = document.getElementById('warr-unit');

  [purchaseDateInput, warrantyValInput, warrantyUnitInput].forEach(el => {
    if (el) el.addEventListener('input', updateFormExpiryPreview);
  });

  // Bill Image Viewer Modal Close
  const closeViewerBtn = document.getElementById('btn-close-viewer');
  const viewerModal = document.getElementById('bill-viewer-modal');
  if (closeViewerBtn && viewerModal) {
    closeViewerBtn.addEventListener('click', () => viewerModal.classList.remove('open'));
  }
}

function handleFileSelect(e) {
  if (e.target.files && e.target.files[0]) {
    processUploadedImage(e.target.files[0]);
  }
}

function processUploadedImage(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload a valid image file of the bill/receipt (JPG, PNG, WebP).');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    currentBillDataUrl = event.target.result;
    showImagePreview(currentBillDataUrl);
    // Show OCR auto fill banner
    const ocrBar = document.getElementById('ocr-assist-bar');
    if (ocrBar) ocrBar.style.display = 'flex';
  };
  reader.readAsDataURL(file);
}

function showImagePreview(dataUrl) {
  const dropZone = document.getElementById('bill-upload-zone');
  const previewBox = document.getElementById('bill-preview-box');
  const previewImg = document.getElementById('preview-img');

  if (previewImg && previewBox && dropZone) {
    previewImg.src = dataUrl;
    previewBox.style.display = 'block';
    dropZone.style.display = 'none';
  }
}

function clearImagePreview() {
  currentBillDataUrl = null;
  const fileInput = document.getElementById('bill-photo-input');
  if (fileInput) fileInput.value = '';

  const dropZone = document.getElementById('bill-upload-zone');
  const previewBox = document.getElementById('bill-preview-box');
  const ocrBar = document.getElementById('ocr-assist-bar');

  if (dropZone && previewBox) {
    previewBox.style.display = 'none';
    dropZone.style.display = 'block';
  }
  if (ocrBar) ocrBar.style.display = 'none';
}

/**
 * Intelligent OCR Simulation:
 * Extracts bill information from receipt image, auto-populating
 * Product name, store, purchase date, warranty duration, and price!
 */
function simulateBillOCRScan() {
  const ocrButton = document.getElementById('btn-ocr-auto');
  if (ocrButton) {
    ocrButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Scanning Bill...';
  }

  setTimeout(() => {
    // If not already filled, fill realistic detected receipt data
    const prodNameInput = document.getElementById('warr-product-name');
    const storeInput = document.getElementById('warr-store-name');
    const dateInput = document.getElementById('warr-purchase-date');
    const valInput = document.getElementById('warr-val');
    const unitInput = document.getElementById('warr-unit');
    const priceInput = document.getElementById('warr-price');

    if (!prodNameInput.value) prodNameInput.value = 'Dell XPS 15 InfinityEdge';
    if (!storeInput.value) storeInput.value = 'Best Buy Electronics';
    if (!dateInput.value) dateInput.value = window.DateUtils.formatDDMMYYYY(new Date());
    if (!valInput.value) valInput.value = '24';
    if (unitInput) unitInput.value = 'months';
    if (!priceInput.value) priceInput.value = '1799.00';

    updateFormExpiryPreview();

    if (ocrButton) {
      ocrButton.innerHTML = '<i class="fa-solid fa-check"></i> Data Extracted!';
      setTimeout(() => {
        ocrButton.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Auto-Fill from Receipt';
      }, 2500);
    }
  }, 700);
}

function updateFormExpiryPreview() {
  const dateStr = document.getElementById('warr-purchase-date').value;
  const val = document.getElementById('warr-val').value;
  const unit = document.getElementById('warr-unit').value;
  const previewBadge = document.getElementById('form-expiry-preview');

  if (!previewBadge) return;

  if (dateStr && val) {
    const expiry = window.DateUtils.calculateExpiryDate(dateStr, val, unit);
    const formattedExpiry = window.DateUtils.formatDDMMYYYY(expiry);
    const info = window.DateUtils.getRemainingInfo(expiry);
    previewBadge.innerHTML = `<i class="fa-regular fa-clock"></i> Calculated Expiry: <strong>${formattedExpiry}</strong> (${info.text})`;
    previewBadge.style.display = 'block';
  } else {
    previewBadge.style.display = 'none';
  }
}

function openWarrantyModal(prefillData = null) {
  const modal = document.getElementById('warranty-modal');
  if (!modal) return;

  modal.classList.add('open');
  clearImagePreview();

  // Reset form
  const form = document.getElementById('warranty-form');
  if (form) form.reset();

  const previewBadge = document.getElementById('form-expiry-preview');
  if (previewBadge) previewBadge.style.display = 'none';

  // Set today's date in DD/MM/YYYY as placeholder default
  const dateInput = document.getElementById('warr-purchase-date');
  if (dateInput && !prefillData) {
    dateInput.value = window.DateUtils.formatDDMMYYYY(new Date());
  }

  if (prefillData) {
    document.getElementById('warr-product-name').value = prefillData.productName || '';
    document.getElementById('warr-store-name').value = prefillData.storeName || '';
    document.getElementById('warr-purchase-date').value = prefillData.purchaseDate || '';
    document.getElementById('warr-val').value = prefillData.warrantyValue || '';
    document.getElementById('warr-unit').value = prefillData.warrantyUnit || 'months';
    document.getElementById('warr-price').value = prefillData.price || '';
    if (prefillData.billPhotoUrl) {
      currentBillDataUrl = prefillData.billPhotoUrl;
      showImagePreview(currentBillDataUrl);
    }
    updateFormExpiryPreview();
  }
}

function closeWarrantyModal() {
  const modal = document.getElementById('warranty-modal');
  if (modal) modal.classList.remove('open');
}

function handleWarrantyFormSubmit(e) {
  e.preventDefault();

  const productName = document.getElementById('warr-product-name').value.trim();
  const storeName = document.getElementById('warr-store-name').value.trim();
  const purchaseDate = document.getElementById('warr-purchase-date').value.trim();
  const warrantyValue = parseInt(document.getElementById('warr-val').value, 10);
  const warrantyUnit = document.getElementById('warr-unit').value;
  const price = parseFloat(document.getElementById('warr-price').value) || 0;
  const category = document.getElementById('warr-category').value;
  const notes = document.getElementById('warr-notes').value.trim();

  if (!productName || !purchaseDate || isNaN(warrantyValue)) {
    alert('Please complete all required fields (Product Name, Purchase Date, Warranty Period).');
    return;
  }

  // Use uploaded photo or default fallback
  const billPhotoUrl = currentBillDataUrl || 'assets/receipt_macbook.jpg';

  const newWarranty = {
    id: 'warr_' + Date.now(),
    productName,
    storeName,
    purchaseDate,
    warrantyValue,
    warrantyUnit,
    price,
    billPhotoUrl,
    category,
    notes,
    paymentModeUsed: document.getElementById('warr-payment-mode')?.value || 'direct_cash',
    createdAt: new Date().toISOString()
  };

  window.StorageService.addWarranty(newWarranty);
  closeWarrantyModal();
  renderWarrantyList();
  updateTopAlertBanner();
  if (window.renderPaymentStats) window.renderPaymentStats();
}

/**
 * Render the Warranty Products Cards
 */
function renderWarrantyList() {
  const container = document.getElementById('warranty-cards-container');
  const countBadge = document.getElementById('warranty-count-badge');
  if (!container) return;

  const warranties = window.StorageService.getWarranties();

  // Process & filter items
  const processed = warranties.map(item => {
    const expiryDate = window.DateUtils.calculateExpiryDate(item.purchaseDate, item.warrantyValue, item.warrantyUnit);
    const remaining = window.DateUtils.getRemainingInfo(expiryDate);
    return {
      ...item,
      expiryDate,
      expiryFormatted: window.DateUtils.formatDDMMYYYY(expiryDate),
      remaining
    };
  });

  // Apply filters
  const filtered = processed.filter(item => {
    const matchSearch = item.productName.toLowerCase().includes(searchQuery) ||
                        item.storeName.toLowerCase().includes(searchQuery) ||
                        item.category.toLowerCase().includes(searchQuery);

    if (!matchSearch) return false;

    if (activeFilter === 'warning') return item.remaining.isWarning;
    if (activeFilter === 'safe') return item.remaining.status === 'safe';
    if (activeFilter === 'expired') return item.remaining.isExpired;
    return true; // 'all'
  });

  // Sort by expiry date soonest first
  filtered.sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());

  if (countBadge) {
    countBadge.textContent = `${filtered.length} Items`;
  }

  // Update Expiry Horizon stat card according to dropdown filter & warranty terms
  updateExpiryHorizonCard(activeFilter, processed);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fa-solid fa-receipt"></i>
        <h3>No warranty items found</h3>
        <p>No products match your current search or filter criteria. Add a new bill or change filters.</p>
        <button class="btn-primary" onclick="openWarrantyModal()">
          <i class="fa-solid fa-plus"></i> Add Product Bill
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const statusClass = item.remaining.badgeClass; // 'safe', 'warning', 'danger'
    const statusIcon = item.remaining.isExpired 
      ? '<i class="fa-solid fa-circle-xmark"></i>' 
      : item.remaining.isWarning 
        ? '<i class="fa-solid fa-triangle-exclamation"></i>' 
        : '<i class="fa-solid fa-shield-halved"></i>';

    const unitLabel = item.warrantyUnit === 'years' 
      ? `${item.warrantyValue} Year${item.warrantyValue > 1 ? 's' : ''}`
      : `${item.warrantyValue} Month${item.warrantyValue > 1 ? 's' : ''}`;

    const formattedPrice = window.CurrencyUtils.format(item.price);

    return `
      <div class="warranty-card" data-id="${item.id}">
        <!-- Bill Image Preview & Quick Zoom -->
        <div class="bill-card-preview" onclick="openBillViewer('${item.id}')" title="Click to view full bill receipt">
          <img src="${item.billPhotoUrl}" alt="${item.productName} Bill Receipt" onerror="this.src='assets/receipt_macbook.jpg'">
          <div class="bill-card-overlay">
            <span class="warranty-status-badge ${statusClass}">
              ${statusIcon} ${item.remaining.label}
            </span>
            <span class="bill-zoom-hint">
              <i class="fa-solid fa-magnifying-glass-plus"></i> View Receipt
            </span>
          </div>
        </div>

        <!-- Product Details -->
        <div class="card-content">
          <div class="product-title-row">
            <div>
              <h3>${escapeHtml(item.productName)}</h3>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                <i class="fa-solid fa-tag"></i> ${escapeHtml(item.category || 'General')}
              </div>
            </div>
            <div class="product-price">${formattedPrice}</div>
          </div>

          <div class="store-meta">
            <span><i class="fa-solid fa-store"></i> ${escapeHtml(item.storeName || 'Store')}</span>
            <span><i class="fa-regular fa-calendar"></i> ${item.purchaseDate}</span>
          </div>

          <!-- Key Metrics: Warranty Term & Expiry Date in DD/MM/YYYY -->
          <div class="warranty-metrics-box">
            <div class="metric-item">
              <small>Warranty Period</small>
              <span><i class="fa-solid fa-clock-rotate-left" style="color: #818cf8;"></i> ${unitLabel}</span>
            </div>
            <div class="metric-item">
              <small>Expires On (DD/MM/YYYY)</small>
              <span><i class="fa-regular fa-calendar-check" style="color: #38bdf8;"></i> ${item.expiryFormatted}</span>
            </div>
          </div>

          <!-- Countdown Banner -->
          <div class="expiry-countdown-banner">
            <span class="countdown-label">
              ${item.remaining.isExpired ? 'Coverage Ended' : 'Time Left Until Expiry'}:
            </span>
            <span class="countdown-time ${statusClass}">
              <i class="fa-solid fa-hourglass-half"></i> ${item.remaining.text}
            </span>
          </div>

          ${item.notes ? `<div style="font-size: 11px; color: var(--text-muted); background: rgba(255,255,255,0.03); padding: 6px 10px; border-radius: 6px;"><i class="fa-regular fa-note-sticky"></i> ${escapeHtml(item.notes)}</div>` : ''}

          <!-- Card Actions -->
          <div class="card-actions-row">
            <button class="btn-card-action" onclick="openBillViewer('${item.id}')">
              <i class="fa-solid fa-file-invoice"></i> Bill Photo
            </button>
            <div style="display: flex; gap: 4px;">
              <button class="btn-card-action" onclick="claimWarrantySupport('${escapeHtml(item.productName)}')">
                <i class="fa-solid fa-headset"></i> Service Claim
              </button>
              <button class="btn-card-action danger" onclick="confirmDeleteWarranty('${item.id}')" title="Delete record">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Top Alert Bar for Expiries & Late Fee Reduction
 */
function updateTopAlertBanner() {
  const banner = document.getElementById('top-alert-banner');
  if (!banner) return;

  const warranties = window.StorageService.getWarranties();
  const payments = window.StorageService.getPayments();

  // Find warranties expiring in 1-2 months (< 60 days)
  const expiringSoon = warranties.filter(item => {
    const expiry = window.DateUtils.calculateExpiryDate(item.purchaseDate, item.warrantyValue, item.warrantyUnit);
    const info = window.DateUtils.getRemainingInfo(expiry);
    return info.isWarning && !info.isExpired;
  });

  // Find payments due in <= 3 days or overdue
  const urgentPayments = payments.filter(item => {
    if (item.status === 'paid') return false;
    const dueInfo = window.DateUtils.getDueInfo(item.dueDate, item.status);
    return dueInfo.urgent;
  });

  if (expiringSoon.length > 0 || urgentPayments.length > 0) {
    banner.style.display = 'flex';

    let titleText = '';
    let descText = '';

    if (urgentPayments.length > 0 && expiringSoon.length > 0) {
      banner.className = 'alert-banner danger-mode';
      titleText = `<i class="fa-solid fa-triangle-exclamation"></i> Action Required: ${urgentPayments.length} Payment Obligation(s) & ${expiringSoon.length} Asset Term(s) Due Shortly`;
      descText = `Settle "${urgentPayments[0].title}" due on ${urgentPayments[0].dueDate} to eliminate late fees. Additionally, inspect "${expiringSoon[0].productName}" before warranty concludes in ${window.DateUtils.getRemainingInfo(window.DateUtils.calculateExpiryDate(expiringSoon[0].purchaseDate, expiringSoon[0].warrantyValue, expiringSoon[0].warrantyUnit)).text}.`;
    } else if (urgentPayments.length > 0) {
      banner.className = 'alert-banner danger-mode';
      titleText = `<i class="fa-solid fa-bell"></i> Payment Obligation Advisory: ${urgentPayments.length} Scheduled Due(s) Approaching Maturity`;
      descText = `Settle ${urgentPayments[0].category} ("${urgentPayments[0].title}") due on ${urgentPayments[0].dueDate} to maintain compliance and avoid penalties.`;
    } else {
      banner.className = 'alert-banner';
      titleText = `<i class="fa-solid fa-shield-halved"></i> Warranty Horizon Notice: ${expiringSoon.length} Asset Coverage Term(s) Expiring Within 60 Days`;
      descText = `Coverage for "${expiringSoon[0].productName}" concludes on ${window.DateUtils.formatDDMMYYYY(window.DateUtils.calculateExpiryDate(expiringSoon[0].purchaseDate, expiringSoon[0].warrantyValue, expiringSoon[0].warrantyUnit))}. Verify operational status or request support.`;
    }

    banner.querySelector('.alert-title').innerHTML = titleText;
    banner.querySelector('.alert-desc').textContent = descText;
  } else {
    banner.style.display = 'none';
  }

  // Update navbar notification bell dot
  const notifDot = document.getElementById('nav-notif-dot');
  if (notifDot) {
    notifDot.style.display = (expiringSoon.length > 0 || urgentPayments.length > 0) ? 'block' : 'none';
  }
}

/**
 * Open High-Resolution Bill Viewer Modal
 */
function openBillViewer(id) {
  const warranties = window.StorageService.getWarranties();
  const item = warranties.find(w => w.id === id);
  if (!item) return;

  const viewerModal = document.getElementById('bill-viewer-modal');
  const viewerImg = document.getElementById('viewer-img');
  const viewerTitle = document.getElementById('viewer-title');
  const viewerMeta = document.getElementById('viewer-meta');

  if (viewerModal && viewerImg && viewerTitle && viewerMeta) {
    viewerImg.src = item.billPhotoUrl || 'assets/receipt_macbook.jpg';
    viewerTitle.textContent = `${item.productName} - Official Purchase Invoice`;
    
    const expiry = window.DateUtils.calculateExpiryDate(item.purchaseDate, item.warrantyValue, item.warrantyUnit);
    viewerMeta.innerHTML = `
      <span><i class="fa-solid fa-store"></i> ${escapeHtml(item.storeName)}</span> &bull;
      <span><i class="fa-regular fa-calendar"></i> Purchased: ${item.purchaseDate}</span> &bull;
      <span><i class="fa-regular fa-calendar-check"></i> Expiry: ${window.DateUtils.formatDDMMYYYY(expiry)}</span> &bull;
      <span><i class="fa-solid fa-dollar-sign"></i> ${window.CurrencyUtils.format(item.price)}</span>
    `;

    viewerModal.classList.add('open');
  }
}

function printReceipt() {
  const viewerImg = document.getElementById('viewer-img');
  if (!viewerImg) return;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head><title>Print Purchase Bill - Warrier</title></head>
      <body style="text-align:center; padding: 20px; font-family: sans-serif;">
        <h2>Official Store Purchase Receipt</h2>
        <img src="${viewerImg.src}" style="max-width: 100%; max-height: 90vh; border: 1px solid #ccc; padding: 10px;" />
        <script>window.onload = function() { window.print(); window.close(); }<\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function confirmDeleteWarranty(id) {
  if (confirm('Are you sure you want to delete this warranty record and its bill?')) {
    window.StorageService.deleteWarranty(id);
    renderWarrantyList();
    updateTopAlertBanner();
    if (window.renderPaymentStats) window.renderPaymentStats();
  }
}

function claimWarrantySupport(prodName) {
  alert(`Initiating service claim for "${prodName}". Customer service hotline and warranty portal instructions have been prepared.`);
}

function updateExpiryHorizonCard(filter, processed) {
  const card = document.getElementById('stat-card-expiry-horizon');
  const title = document.getElementById('stat-expiry-horizon-title');
  const icon = document.getElementById('stat-expiry-horizon-icon');
  const val = document.getElementById('stat-expiring-soon-val');
  const sub = document.getElementById('stat-expiring-soon-sub');
  const filterSelect = document.getElementById('warranty-status-filter');

  const expiredCount = processed.filter(item => item.remaining.isExpired).length;
  const safeCount = processed.filter(item => item.remaining.status === 'safe' && !item.remaining.isExpired).length;
  const warningCount = processed.filter(item => item.remaining.isWarning && !item.remaining.isExpired).length;

  if (!card || !val) return;

  val.style.color = ''; // Keep normal primary text color matching other KPI cards
  const isLight = document.body.classList.contains('light-theme');

  // 1. Expired Warranty -> BLACK colour
  if (filter === 'expired') {
    card.style.setProperty('--stat-accent', '#000000');
    card.style.setProperty('--stat-bg', isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)');
    if (title) title.textContent = 'Expired Warranties';
    if (icon) {
      icon.style.background = '#000000';
      icon.style.color = '#ffffff';
      icon.innerHTML = '<i class="fa-solid fa-calendar-xmark"></i>';
    }
    val.textContent = `${expiredCount} Item${expiredCount !== 1 ? 's' : ''}`;
    if (sub) {
      sub.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color: ${isLight ? '#000000' : '#94a3b8'};"></i> Past coverage duration`;
    }
    if (filterSelect) {
      filterSelect.style.borderColor = isLight ? '#000000' : '#475569';
      filterSelect.style.boxShadow = '0 0 0 1px ' + (isLight ? '#000000' : '#475569');
    }
  }
  // 2. Active & Safe -> White / clean color (no green color)
  else if (filter === 'safe') {
    card.style.setProperty('--stat-accent', isLight ? '#ffffff' : 'transparent');
    card.style.setProperty('--stat-bg', isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)');
    if (title) title.textContent = 'Active & Safe (>2 Months)';
    if (icon) {
      icon.style.background = isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)';
      icon.style.border = '1px solid ' + (isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)');
      icon.style.color = isLight ? '#0f172a' : '#f8fafc';
      icon.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i>';
    }
    val.textContent = `${safeCount} Item${safeCount !== 1 ? 's' : ''}`;
    if (sub) {
      sub.innerHTML = '<i class="fa-solid fa-circle-check"></i> Safe coverage (> 60 days remaining)';
    }
    if (filterSelect) {
      filterSelect.style.borderColor = '';
      filterSelect.style.boxShadow = '';
    }
  }
  // 3. Expiring Soon -> RED colour (1-2 months)
  else if (filter === 'warning') {
    card.style.setProperty('--stat-accent', '#ef4444');
    card.style.setProperty('--stat-bg', 'rgba(239, 68, 68, 0.12)');
    if (title) title.textContent = 'Expiring Soon (1-2 Months)';
    if (icon) {
      icon.style.background = 'rgba(239, 68, 68, 0.15)';
      icon.style.color = '#ef4444';
      icon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    }
    val.textContent = `${warningCount} Item${warningCount !== 1 ? 's' : ''}`;
    if (sub) {
      sub.innerHTML = '<i class="fa-solid fa-bell" style="color: #ef4444;"></i> Urgent: 1-2 months horizon alert';
    }
    if (filterSelect) {
      filterSelect.style.borderColor = '#ef4444';
      filterSelect.style.boxShadow = '0 0 0 1px #ef4444';
    }
  }
  // 4. All Warranties (Default Horizon View)
  else {
    if (filterSelect) {
      filterSelect.style.borderColor = '';
      filterSelect.style.boxShadow = '';
    }
    if (title) title.textContent = 'Expiry Horizon (60 Days)';

    if (warningCount > 0) {
      card.style.setProperty('--stat-accent', '#ef4444');
      card.style.setProperty('--stat-bg', 'rgba(239, 68, 68, 0.12)');
      if (icon) {
        icon.style.background = 'rgba(239, 68, 68, 0.15)';
        icon.style.color = '#ef4444';
        icon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
      }
      val.textContent = `${warningCount} Expiring`;
      if (sub) {
        sub.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i> Urgent: items expiring within 60d';
      }
    } else if (expiredCount > 0 && safeCount === 0) {
      card.style.setProperty('--stat-accent', '#000000');
      card.style.setProperty('--stat-bg', isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)');
      if (icon) {
        icon.style.background = '#000000';
        icon.style.color = '#ffffff';
        icon.innerHTML = '<i class="fa-solid fa-calendar-xmark"></i>';
      }
      val.textContent = `${expiredCount} Expired`;
      if (sub) {
        sub.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color: ${isLight ? '#000000' : '#94a3b8'};"></i> All items expired`;
      }
    } else {
      card.style.setProperty('--stat-accent', isLight ? '#ffffff' : 'transparent');
      card.style.setProperty('--stat-bg', isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)');
      if (icon) {
        icon.style.background = isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)';
        icon.style.border = '1px solid ' + (isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)');
        icon.style.color = isLight ? '#0f172a' : '#f8fafc';
        icon.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i>';
      }
      val.textContent = safeCount > 0 ? `${safeCount} Active` : '0 Items';
      if (sub) {
        sub.innerHTML = '<i class="fa-solid fa-circle-check"></i> No immediate expirations (60d)';
      }
    }
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

window.initWarrantyPage = initWarrantyPage;
window.renderWarrantyList = renderWarrantyList;
window.openWarrantyModal = openWarrantyModal;
window.openBillViewer = openBillViewer;
window.printReceipt = printReceipt;
window.confirmDeleteWarranty = confirmDeleteWarranty;
window.claimWarrantySupport = claimWarrantySupport;
window.updateTopAlertBanner = updateTopAlertBanner;
window.updateExpiryHorizonCard = updateExpiryHorizonCard;
