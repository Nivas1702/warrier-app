/**
 * WARRIER - Enterprise Financial & Standard Math Calculator
 * Handles quick arithmetic, bill computations, and EMI / Loan amortization
 */

(function () {
  'use strict';

  // Calculator State
  let calcState = {
    current: '0',
    previous: '',
    operation: null,
    resetNext: false,
    history: []
  };

  function initCalculator() {
    setupCalculatorEventListeners();
    setupEmiCalculator();
  }

  function setupCalculatorEventListeners() {
    // Open/Close modal
    const openBtn = document.getElementById('btn-open-calculator');
    const modal = document.getElementById('calculator-modal');
    const closeBtn = document.getElementById('btn-close-calc-modal');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => openCalculatorModal());
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => closeCalculatorModal());
    }

    // Modal background click
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeCalculatorModal();
      });
    }

    // Tab buttons inside calculator
    const tabBtns = document.querySelectorAll('.calc-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-calc-tab');
        switchCalculatorTab(target);
      });
    });

    // Standard Calculator Keys
    const keyContainer = document.getElementById('calc-keypad');
    if (keyContainer) {
      keyContainer.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const action = target.getAttribute('data-action');
        const value = target.getAttribute('data-val');

        if (value !== null && value !== undefined) {
          appendCalcDigit(value);
        } else if (action) {
          handleCalcAction(action);
        }
      });
    }

    // Keyboard support when calculator modal is open
    window.addEventListener('keydown', handleCalcKeyboard);
  }

  function openCalculatorModal(initialTab = 'standard') {
    const modal = document.getElementById('calculator-modal');
    if (!modal) return;

    modal.classList.add('open');
    switchCalculatorTab(initialTab);
    updateCalcDisplay();
    calculateEmiSchedule();
  }

  function closeCalculatorModal() {
    const modal = document.getElementById('calculator-modal');
    if (modal) modal.classList.remove('open');
  }

  function switchCalculatorTab(tabName) {
    const tabBtns = document.querySelectorAll('.calc-tab-btn');
    const views = document.querySelectorAll('.calc-view-panel');

    tabBtns.forEach(b => {
      if (b.getAttribute('data-calc-tab') === tabName) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    views.forEach(v => {
      if (v.id === `calc-view-${tabName}`) {
        v.style.display = 'block';
      } else {
        v.style.display = 'none';
      }
    });

    if (tabName === 'emi') {
      calculateEmiSchedule();
    }
  }

  /* ==========================================================================
     STANDARD ARITHMETIC CALCULATOR
     ========================================================================== */

  function appendCalcDigit(digit) {
    if (calcState.resetNext) {
      calcState.current = digit === '.' ? '0.' : digit;
      calcState.resetNext = false;
    } else {
      if (digit === '.') {
        if (calcState.current.includes('.')) return;
        calcState.current += '.';
      } else {
        calcState.current = calcState.current === '0' ? digit : calcState.current + digit;
      }
    }
    updateCalcDisplay();
  }

  function handleCalcAction(action) {
    switch (action) {
      case 'clear':
        calcState.current = '0';
        calcState.previous = '';
        calcState.operation = null;
        calcState.resetNext = false;
        break;

      case 'backspace':
        if (calcState.resetNext) {
          calcState.current = '0';
          calcState.resetNext = false;
        } else {
          calcState.current = calcState.current.length > 1 ? calcState.current.slice(0, -1) : '0';
        }
        break;

      case 'toggle-sign':
        if (calcState.current !== '0') {
          calcState.current = (parseFloat(calcState.current) * -1).toString();
        }
        break;

      case 'percent':
        calcState.current = (parseFloat(calcState.current) / 100).toString();
        break;

      case 'add':
      case 'subtract':
      case 'multiply':
      case 'divide':
        setCalcOperation(action);
        break;

      case 'equals':
        evaluateCalculation();
        break;
    }
    updateCalcDisplay();
  }

  function getOpSymbol(op) {
    switch (op) {
      case 'add': return '+';
      case 'subtract': return '−';
      case 'multiply': return '×';
      case 'divide': return '÷';
      default: return '';
    }
  }

  function setCalcOperation(op) {
    if (calcState.operation && !calcState.resetNext) {
      evaluateCalculation();
    }
    calcState.previous = calcState.current;
    calcState.operation = op;
    calcState.resetNext = true;
  }

  function evaluateCalculation() {
    if (!calcState.operation || calcState.previous === '') return;

    const prev = parseFloat(calcState.previous);
    const curr = parseFloat(calcState.current);
    let result = 0;

    switch (calcState.operation) {
      case 'add':
        result = prev + curr;
        break;
      case 'subtract':
        result = prev - curr;
        break;
      case 'multiply':
        result = prev * curr;
        break;
      case 'divide':
        if (curr === 0) {
          calcState.current = 'Error';
          calcState.previous = '';
          calcState.operation = null;
          calcState.resetNext = true;
          return;
        }
        result = prev / curr;
        break;
    }

    // Format cleanly
    const formattedResult = Math.round(result * 100000000) / 100000000;
    const historyItem = `${calcState.previous} ${getOpSymbol(calcState.operation)} ${calcState.current} = ${formattedResult}`;
    
    calcState.history.unshift(historyItem);
    if (calcState.history.length > 5) calcState.history.pop();
    renderCalcHistory();

    calcState.current = formattedResult.toString();
    calcState.previous = '';
    calcState.operation = null;
    calcState.resetNext = true;
  }

  function updateCalcDisplay() {
    const exprEl = document.getElementById('calc-expression');
    const resultEl = document.getElementById('calc-current-val');

    if (exprEl) {
      if (calcState.previous && calcState.operation) {
        exprEl.textContent = `${calcState.previous} ${getOpSymbol(calcState.operation)}`;
      } else {
        exprEl.textContent = '';
      }
    }

    if (resultEl) {
      // Format number display with commas if numeric
      const val = calcState.current;
      if (val === 'Error') {
        resultEl.textContent = 'Error';
      } else {
        const parts = val.split('.');
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        resultEl.textContent = parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
      }
    }
  }

  function renderCalcHistory() {
    const container = document.getElementById('calc-history-list');
    if (!container) return;

    if (calcState.history.length === 0) {
      container.innerHTML = '<span class="history-empty">No calculations yet</span>';
      return;
    }

    container.innerHTML = calcState.history.map(item => `
      <div class="calc-history-item" onclick="window.useCalcHistory('${item.split('=')[1].trim()}')">
        <span>${item}</span>
      </div>
    `).join('');
  }

  function useCalcHistory(val) {
    calcState.current = val;
    calcState.resetNext = true;
    updateCalcDisplay();
  }

  function handleCalcKeyboard(e) {
    const modal = document.getElementById('calculator-modal');
    if (!modal || !modal.classList.contains('open')) return;

    // Check if user is typing into an EMI form input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    if (e.key >= '0' && e.key <= '9') {
      appendCalcDigit(e.key);
    } else if (e.key === '.') {
      appendCalcDigit('.');
    } else if (e.key === '+') {
      handleCalcAction('add');
    } else if (e.key === '-') {
      handleCalcAction('subtract');
    } else if (e.key === '*' || e.key === 'x') {
      handleCalcAction('multiply');
    } else if (e.key === '/') {
      e.preventDefault();
      handleCalcAction('divide');
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      handleCalcAction('equals');
    } else if (e.key === 'Backspace') {
      handleCalcAction('backspace');
    } else if (e.key === 'Escape') {
      if (calcState.current !== '0') {
        handleCalcAction('clear');
      } else {
        closeCalculatorModal();
      }
    } else if (e.key === '%') {
      handleCalcAction('percent');
    }
  }

  /* ==========================================================================
     EMI & LOAN SCHEDULE CALCULATOR
     ========================================================================== */

  function setupEmiCalculator() {
    const principalInput = document.getElementById('emi-principal');
    const rateInput = document.getElementById('emi-rate');
    const tenureInput = document.getElementById('emi-tenure');
    const downInput = document.getElementById('emi-down-payment');
    const tenureUnit = document.getElementById('emi-tenure-unit');
    const transferBtn = document.getElementById('btn-transfer-emi-to-payment');

    const inputs = [principalInput, rateInput, tenureInput, downInput, tenureUnit];
    inputs.forEach(el => {
      if (el) el.addEventListener('input', calculateEmiSchedule);
    });

    // Preset tenure pills
    document.querySelectorAll('.tenure-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.tenure-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const months = pill.getAttribute('data-months');
        if (tenureInput) {
          tenureInput.value = months;
          if (tenureUnit) tenureUnit.value = 'months';
          calculateEmiSchedule();
        }
      });
    });

    if (transferBtn) {
      transferBtn.addEventListener('click', transferEmiToPaymentsModal);
    }
  }

  function calculateEmiSchedule() {
    const principalVal = parseFloat(document.getElementById('emi-principal')?.value) || 0;
    const downPayment = parseFloat(document.getElementById('emi-down-payment')?.value) || 0;
    const annualRate = parseFloat(document.getElementById('emi-rate')?.value) || 0;
    let tenureVal = parseInt(document.getElementById('emi-tenure')?.value, 10) || 12;
    const tenureUnit = document.getElementById('emi-tenure-unit')?.value || 'months';

    const netPrincipal = Math.max(0, principalVal - downPayment);
    const totalMonths = tenureUnit === 'years' ? tenureVal * 12 : tenureVal;

    let monthlyEmi = 0;
    let totalPayment = 0;
    let totalInterest = 0;

    if (netPrincipal > 0 && totalMonths > 0) {
      if (annualRate === 0) {
        // 0% No-cost EMI
        monthlyEmi = netPrincipal / totalMonths;
        totalInterest = 0;
        totalPayment = netPrincipal;
      } else {
        const monthlyRate = (annualRate / 12) / 100;
        monthlyEmi = (netPrincipal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        totalPayment = monthlyEmi * totalMonths;
        totalInterest = totalPayment - netPrincipal;
      }
    }

    // Display formatted metrics
    const elMonthlyEmi = document.getElementById('emi-result-monthly');
    const elNetPrincipal = document.getElementById('emi-result-principal');
    const elTotalInterest = document.getElementById('emi-result-interest');
    const elTotalAmount = document.getElementById('emi-result-total');
    const elInterestPct = document.getElementById('emi-result-interest-pct');

    if (elMonthlyEmi) elMonthlyEmi.textContent = window.CurrencyUtils ? window.CurrencyUtils.format(monthlyEmi) : `$${monthlyEmi.toFixed(2)}`;
    if (elNetPrincipal) elNetPrincipal.textContent = window.CurrencyUtils ? window.CurrencyUtils.format(netPrincipal) : `$${netPrincipal.toFixed(2)}`;
    if (elTotalInterest) elTotalInterest.textContent = window.CurrencyUtils ? window.CurrencyUtils.format(totalInterest) : `$${totalInterest.toFixed(2)}`;
    if (elTotalAmount) elTotalAmount.textContent = window.CurrencyUtils ? window.CurrencyUtils.format(totalPayment) : `$${totalPayment.toFixed(2)}`;

    if (elInterestPct) {
      const pct = totalPayment > 0 ? Math.round((totalInterest / totalPayment) * 100) : 0;
      elInterestPct.textContent = `${pct}% of total`;
    }
  }

  /**
   * Transfer calculated EMI directly into Page 2 (Add Payment Modal)
   */
  function transferEmiToPaymentsModal() {
    const principalVal = parseFloat(document.getElementById('emi-principal')?.value) || 0;
    const downPayment = parseFloat(document.getElementById('emi-down-payment')?.value) || 0;
    const annualRate = parseFloat(document.getElementById('emi-rate')?.value) || 0;
    let tenureVal = parseInt(document.getElementById('emi-tenure')?.value, 10) || 12;
    const tenureUnit = document.getElementById('emi-tenure-unit')?.value || 'months';

    const netPrincipal = Math.max(0, principalVal - downPayment);
    const totalMonths = tenureUnit === 'years' ? tenureVal * 12 : tenureVal;

    let monthlyEmi = 0;
    if (annualRate === 0) {
      monthlyEmi = netPrincipal / totalMonths;
    } else {
      const monthlyRate = (annualRate / 12) / 100;
      monthlyEmi = (netPrincipal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    closeCalculatorModal();

    // Switch to page-payments and open modal
    if (window.switchPage) window.switchPage('page-payments');

    const paymentModal = document.getElementById('payment-modal');
    if (paymentModal) {
      paymentModal.classList.add('open');

      const titleInput = document.getElementById('pay-title');
      const amountInput = document.getElementById('pay-amount');
      const catSelect = document.getElementById('pay-category');
      const modeSelect = document.getElementById('pay-mode');
      const isEmiCheck = document.getElementById('pay-is-emi');
      const totalAmountInput = document.getElementById('pay-total-amount');
      const tenureInput = document.getElementById('pay-tenure');
      const currentInstInput = document.getElementById('pay-curr-installment');
      const emiFieldsContainer = document.getElementById('emi-specific-fields');
      const notesInput = document.getElementById('pay-notes');

      if (titleInput) titleInput.value = `Asset Purchase EMI (${totalMonths} Months)`;
      if (amountInput) amountInput.value = monthlyEmi.toFixed(2);
      if (catSelect) catSelect.value = annualRate === 0 ? 'Credit Card EMI' : 'Loan EMI';
      if (modeSelect) modeSelect.value = annualRate === 0 ? 'credit_card_emi' : 'loan_emi';
      if (isEmiCheck) {
        isEmiCheck.checked = true;
        if (emiFieldsContainer) emiFieldsContainer.style.display = 'grid';
      }
      if (totalAmountInput) totalAmountInput.value = netPrincipal.toFixed(2);
      if (tenureInput) tenureInput.value = totalMonths;
      if (currentInstInput) currentInstInput.value = 1;
      if (notesInput) notesInput.value = `Calculated at ${annualRate}% APR. Principal: $${netPrincipal}.`;
    }
  }

  // Exports
  window.initCalculator = initCalculator;
  window.openCalculatorModal = openCalculatorModal;
  window.closeCalculatorModal = closeCalculatorModal;
  window.useCalcHistory = useCalcHistory;

  document.addEventListener('DOMContentLoaded', initCalculator);
})();

