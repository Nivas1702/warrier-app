/**
 * WARRIER - Utility Functions (Date Math, Formatting, Expiry Detectors)
 */

const DateUtils = {
  /**
   * Parse a date string in DD/MM/YYYY format or YYYY-MM-DD into a JS Date object
   */
  parseDate(dateStr) {
    if (!dateStr) return new Date();
    if (dateStr.includes('-')) {
      // Format: YYYY-MM-DD
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    // Format: DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(dateStr);
  },

  /**
   * Format a JS Date object into DD/MM/YYYY
   */
  formatDDMMYYYY(date) {
    if (!date || isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  },

  /**
   * Calculate warranty expiry date from purchase date + warranty duration (months or years)
   */
  calculateExpiryDate(purchaseDateStr, warrantyValue, warrantyUnit) {
    const purchaseDate = this.parseDate(purchaseDateStr);
    const expiry = new Date(purchaseDate.getTime());
    const val = parseInt(warrantyValue, 10) || 0;

    if (warrantyUnit === 'years') {
      expiry.setFullYear(expiry.getFullYear() + val);
    } else {
      // Months
      expiry.setMonth(expiry.getMonth() + val);
    }

    return expiry;
  },

  /**
   * Get difference between today and a target date in days and humanized representation
   */
  getRemainingInfo(targetDate) {
    const now = new Date();
    // Normalize to midnight
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysAgo = Math.abs(diffDays);
      return {
        status: 'expired',
        daysLeft: diffDays,
        isExpired: true,
        isWarning: false,
        text: `Expired ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`,
        badgeClass: 'expired',
        label: 'Expired'
      };
    }

    // Convert days into months and days
    const approxMonths = Math.floor(diffDays / 30);
    const remDays = diffDays % 30;

    let timeText = '';
    if (approxMonths > 0) {
      timeText = `${approxMonths} mo${approxMonths > 1 ? 's' : ''}${remDays > 0 ? `, ${remDays} d` : ''} left`;
    } else {
      timeText = `${diffDays} day${diffDays === 1 ? '' : 's'} left`;
    }

    // Reminder threshold: usually 1 to 2 months before expiry (<= 60 days)
    const isWarning = diffDays <= 60;

    return {
      status: isWarning ? 'warning' : 'safe',
      daysLeft: diffDays,
      isExpired: false,
      isWarning: isWarning,
      text: timeText,
      badgeClass: isWarning ? 'warning' : 'safe',
      label: isWarning ? 'Expiring Soon' : 'Active Warranty'
    };
  },

  /**
   * Get payment due info (for bills, rent, EMIs)
   */
  getDueInfo(dueDateStr, status) {
    if (status === 'paid') {
      return {
        status: 'paid',
        text: 'Paid & Settled',
        class: 'paid',
        urgent: false,
        days: 0
      };
    }

    const targetDate = this.parseDate(dueDateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'overdue',
        text: `Overdue by ${Math.abs(diffDays)}d! (Late Fee Alert)`,
        class: 'urgent',
        urgent: true,
        days: diffDays
      };
    } else if (diffDays === 0) {
      return {
        status: 'today',
        text: 'Due Today! Pay now',
        class: 'urgent',
        urgent: true,
        days: 0
      };
    } else if (diffDays <= 3) {
      return {
        status: 'urgent',
        text: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`,
        class: 'urgent',
        urgent: true,
        days: diffDays
      };
    } else if (diffDays <= 7) {
      return {
        status: 'soon',
        text: `Due in ${diffDays} days`,
        class: 'soon',
        urgent: false,
        days: diffDays
      };
    } else {
      return {
        status: 'normal',
        text: `Due in ${diffDays} days`,
        class: 'soon',
        urgent: false,
        days: diffDays
      };
    }
  }
};

const CurrencyUtils = {
  format(amount) {
    const symbol = window.StorageService ? window.StorageService.getCurrency() : '$';
    const num = parseFloat(amount) || 0;
    return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

window.DateUtils = DateUtils;
window.CurrencyUtils = CurrencyUtils;
