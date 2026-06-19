/* =============================================
   BLOOMLAAND WALLET — JAVASCRIPT
   Features:
   - Sidebar toggle (mobile)
   - Balance card flip
   - Balance show/hide
   - Currency switcher (NGN ↔ USD)
   - Paystack payment integration
   - Flutterwave payment integration
   - Quick amount buttons
   - Send money flow
   - Service payment modal + wallet deduction
   - Transaction history with filter
   ============================================= */

/* ─── CONFIG ─── */
// Replace these with your real keys before going live
const PAYSTACK_PUBLIC_KEY = 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const FLUTTERWAVE_PUBLIC_KEY = 'FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxx-X';
const USER_EMAIL = 'adewale@bloomlaand.com';
const USER_NAME = 'Adewale Bloom';
const USER_PHONE = '+2348000000000';

/* ─── STATE ─── */
let state = {
  balance: 24500.00,
  balanceVisible: true,
  currency: 'NGN',
  exchangeRate: 1550, // 1 USD = 1550 NGN (update via API in production)
  transactions: [
    { id: 'tx001', type: 'credit', icon: '💳', title: 'Wallet Funded via Paystack', sub: 'Jan 10, 2025 · 09:14 AM', amount: 10000, status: 'success' },
    { id: 'tx002', type: 'service', icon: '📚', title: 'Classroom Access — Monthly', sub: 'Jan 8, 2025 · 02:30 PM', amount: -2500, status: 'success' },
    { id: 'tx003', type: 'debit', icon: '📤', title: 'Sent to @chidi', sub: 'Jan 7, 2025 · 11:45 AM', amount: -3000, status: 'success' },
    { id: 'tx004', type: 'credit', icon: '🌊', title: 'Wallet Funded via Flutterwave', sub: 'Jan 5, 2025 · 08:00 PM', amount: 20000, status: 'success' },
    { id: 'tx005', type: 'service', icon: '🛍️', title: 'MarketHub Listing — Monthly', sub: 'Jan 3, 2025 · 03:15 PM', amount: -1500, status: 'success' },
    { id: 'tx006', type: 'service', icon: '🎥', title: 'Webinar Pass — AI in Education', sub: 'Jan 2, 2025 · 10:00 AM', amount: -500, status: 'success' },
    { id: 'tx007', type: 'credit', icon: '💳', title: 'Wallet Funded via Paystack', sub: 'Dec 28, 2024 · 05:20 PM', amount: 28000, status: 'success' },
    { id: 'tx008', type: 'debit', icon: '📤', title: 'Sent to @fatima', sub: 'Dec 25, 2024 · 12:00 PM', amount: -5000, status: 'success' },
    { id: 'tx009', type: 'debit', icon: '📤', title: 'Sent to @emeka', sub: 'Dec 20, 2024 · 09:00 AM', amount: -1500, status: 'pending' },
  ],
  pendingServicePayment: null,
};

/* ─── DOM REFS ─── */
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const balanceCard = document.getElementById('balanceCard');
const flipCardBtn = document.getElementById('flipCardBtn');
const flipCardBackBtn = document.getElementById('flipCardBackBtn');
const toggleBalanceBtn = document.getElementById('toggleBalance');
const balanceValueEl = document.getElementById('balanceValue');
const currencySymbolEl = document.getElementById('currencySymbol');
const currencyBtns = document.querySelectorAll('.currency-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
const paystackBtn = document.getElementById('paystackBtn');
const flutterwaveBtn = document.getElementById('flutterwaveBtn');
const paystackAmountInput = document.getElementById('paystackAmount');
const flutterwaveAmountInput = document.getElementById('flutterwaveAmount');
const quickBtns = document.querySelectorAll('.quick-btn');
const searchRecipientBtn = document.getElementById('searchRecipient');
const recipientInput = document.getElementById('recipientInput');
const recipientPreview = document.getElementById('recipientPreview');
const sendAmountInput = document.getElementById('sendAmount');
const sendNoteInput = document.getElementById('sendNote');
const sendSummary = document.getElementById('sendSummary');
const sendBtn = document.getElementById('sendBtn');
const filterType = document.getElementById('filterType');
const filterMonth = document.getElementById('filterMonth');
const transactionList = document.getElementById('transactionList');
const historyEmpty = document.getElementById('historyEmpty');
const modalOverlay = document.getElementById('modalOverlay');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const modalBtn = document.getElementById('modalBtn');
const serviceModalOverlay = document.getElementById('serviceModalOverlay');
const serviceModalClose = document.getElementById('serviceModalClose');
const serviceModalCancel = document.getElementById('serviceModalCancel');
const serviceModalConfirm = document.getElementById('serviceModalConfirm');
const serviceModalTitle = document.getElementById('serviceModalTitle');
const serviceModalBody = document.getElementById('serviceModalBody');
const serviceModalDetail = document.getElementById('serviceModalDetail');

/* =============================================
   SIDEBAR (mobile)
   ============================================= */
function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

sidebarToggle?.addEventListener('click', openSidebar);
sidebarOverlay?.addEventListener('click', closeSidebar);

// Close sidebar when a nav link is clicked on mobile
sidebar?.querySelectorAll('.sidebar__link').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth < 900) closeSidebar();
  });
});

/* =============================================
   BALANCE CARD FLIP
   ============================================= */
flipCardBtn?.addEventListener('click', () => balanceCard.classList.add('flipped'));
flipCardBackBtn?.addEventListener('click', () => balanceCard.classList.remove('flipped'));

/* =============================================
   BALANCE SHOW / HIDE
   ============================================= */
toggleBalanceBtn?.addEventListener('click', () => {
  state.balanceVisible = !state.balanceVisible;
  renderBalance();
  toggleBalanceBtn.textContent = state.balanceVisible ? '👁' : '🙈';
});

function formatAmount(amount, currency) {
  const symbols = { NGN: '₦', USD: '$' };
  const formatted = Math.abs(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${symbols[currency] || '₦'}${formatted}`;
}

function renderBalance() {
  if (!state.balanceVisible) {
    balanceValueEl.textContent = '••••••';
    return;
  }
  const displayBalance = state.currency === 'USD'
    ? (state.balance / state.exchangeRate).toFixed(2)
    : state.balance.toFixed(2);
  balanceValueEl.textContent = parseFloat(displayBalance).toLocaleString('en-NG', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

/* =============================================
   CURRENCY SWITCHER
   ============================================= */
currencyBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    state.currency = btn.dataset.currency;
    currencyBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    currencySymbolEl.textContent = state.currency === 'USD' ? '$' : '₦';
    renderBalance();
    updateStatCards();
  });
});

function updateStatCards() {
  const sym = state.currency === 'USD' ? '$' : '₦';
  const rate = state.currency === 'USD' ? state.exchangeRate : 1;

  const totalIn = state.transactions
    .filter(t => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);

  const totalOut = state.transactions
    .filter(t => t.amount < 0 && t.type !== 'service')
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  document.getElementById('totalIn').textContent =
    `${sym} ${(totalIn / rate).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  document.getElementById('totalOut').textContent =
    `${sym} ${(totalOut / rate).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  document.getElementById('pendingVal').textContent = `${sym} 0.00`;
}

/* =============================================
   TABS
   ============================================= */
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${target}`)?.classList.add('active');

    if (target === 'history') renderTransactions();
    if (target === 'escrow')  { renderEscrowVault(); renderEscrows(); }
  });
});

/* =============================================
   QUICK AMOUNT BUTTONS
   ============================================= */
quickBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    if (target) target.value = btn.dataset.amount;

    // Highlight selected quick btn within its group
    const siblings = btn.closest('.quick-amounts').querySelectorAll('.quick-btn');
    siblings.forEach(s => s.classList.remove('selected'));
    btn.classList.add('selected');
  });
});

/* =============================================
   PAYSTACK PAYMENT
   ============================================= */
paystackBtn?.addEventListener('click', () => {
  const amount = parseFloat(paystackAmountInput?.value);
  if (!amount || amount < 100) {
    shakeElement(paystackAmountInput);
    showToast('Please enter a minimum of ₦100', 'error');
    return;
  }

  // Check if real key is configured
  if (PAYSTACK_PUBLIC_KEY.includes('xxxx')) {
    simulatePayment('paystack', amount, 'NGN');
    return;
  }

  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: USER_EMAIL,
    amount: amount * 100, // Paystack uses kobo
    currency: 'NGN',
    ref: `BL-PSK-${Date.now()}`,
    metadata: {
      custom_fields: [
        { display_name: 'User', variable_name: 'user', value: USER_NAME },
        { display_name: 'Wallet Action', variable_name: 'action', value: 'fund_wallet' }
      ]
    },
    callback: function (response) {
      creditWallet(amount, 'NGN', 'Paystack', response.reference);
    },
    onClose: function () {
      showToast('Payment cancelled.', 'info');
    }
  });

  handler.openIframe();
});

/* =============================================
   FLUTTERWAVE PAYMENT
   ============================================= */
flutterwaveBtn?.addEventListener('click', () => {
  const amount = parseFloat(flutterwaveAmountInput?.value);
  const currency = document.getElementById('flwCurrency')?.value || 'NGN';

  if (!amount || amount < 1) {
    shakeElement(flutterwaveAmountInput);
    showToast('Please enter a valid amount', 'error');
    return;
  }

  // Check if real key is configured
  if (FLUTTERWAVE_PUBLIC_KEY.includes('xxxx')) {
    simulatePayment('flutterwave', amount, currency);
    return;
  }

  FlutterwaveCheckout({
    public_key: FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: `BL-FLW-${Date.now()}`,
    amount: amount,
    currency: currency,
    payment_options: 'card, mobilemoney, ussd, banktransfer',
    customer: {
      email: USER_EMAIL,
      phone_number: USER_PHONE,
      name: USER_NAME,
    },
    customizations: {
      title: 'Bloomlaand Wallet',
      description: 'Fund your Bloomlaand wallet',
      logo: '',
    },
    callback: function (response) {
      if (response.status === 'successful') {
        // Convert to NGN if not already
        const ngnAmount = currency === 'NGN' ? amount : amount * state.exchangeRate;
        creditWallet(ngnAmount, currency, 'Flutterwave', response.transaction_id);
      }
    },
    onclose: function () {
      showToast('Payment window closed.', 'info');
    }
  });
});

/* =============================================
   SIMULATE PAYMENT (demo mode — no real key)
   ============================================= */
function simulatePayment(provider, amount, currency) {
  const btn = provider === 'paystack' ? paystackBtn : flutterwaveBtn;
  const originalText = btn.querySelector('span').textContent;
  btn.querySelector('span').textContent = 'Processing...';
  btn.disabled = true;

  setTimeout(() => {
    btn.querySelector('span').textContent = originalText;
    btn.disabled = false;

    const ngnAmount = currency === 'NGN' ? amount : amount * state.exchangeRate;
    const ref = `BL-${provider.toUpperCase().slice(0, 3)}-${Date.now()}`;
    creditWallet(ngnAmount, currency, provider === 'paystack' ? 'Paystack' : 'Flutterwave', ref);
  }, 1800);
}

/* =============================================
   CREDIT WALLET
   ============================================= */
function creditWallet(amountNGN, originalCurrency, provider, ref) {
  state.balance += amountNGN;

  const newTx = {
    id: `tx${Date.now()}`,
    type: 'credit',
    icon: provider === 'Flutterwave' ? '🌊' : '💳',
    title: `Wallet Funded via ${provider}`,
    sub: formatDate(new Date()) + ` · Ref: ${ref}`,
    amount: amountNGN,
    status: 'success'
  };

  state.transactions.unshift(newTx);
  renderBalance();
  updateStatCards();

  if (provider === 'Paystack') paystackAmountInput.value = '';
  else flutterwaveAmountInput.value = '';

  // Clear quick btn selection
  document.querySelectorAll('.quick-btn.selected').forEach(b => b.classList.remove('selected'));

  showPaymentModal(
    '✓',
    'Wallet Funded!',
    `Your Bloomlaand wallet has been credited successfully.`,
    `
      <div><span>Amount:</span> <strong>${formatAmount(amountNGN, 'NGN')}</strong></div>
      <div><span>Provider:</span> <strong>${provider}</strong></div>
      <div><span>Reference:</span> <strong>${ref}</strong></div>
      <div><span>New Balance:</span> <strong>${formatAmount(state.balance, 'NGN')}</strong></div>
    `
  );
}

/* =============================================
   SEND MONEY
   ============================================= */
// Mock user database
const mockUsers = {
  '@chidi': { name: 'Chidi Okonkwo', id: 'BL-10234', role: 'Student', avatar: 'C' },
  'bl-10234': { name: 'Chidi Okonkwo', id: 'BL-10234', role: 'Student', avatar: 'C' },
  '@fatima': { name: 'Fatima Bello', id: 'BL-11892', role: 'Tutor', avatar: 'F' },
  '@emeka': { name: 'Emeka Nwosu', id: 'BL-20011', role: 'Business Owner', avatar: 'E' },
  '@adaeze': { name: 'Adaeze Obi', id: 'BL-30145', role: 'Creator', avatar: 'A' },
};

let foundRecipient = null;

searchRecipientBtn?.addEventListener('click', searchRecipient);
recipientInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchRecipient(); });

function searchRecipient() {
  const query = recipientInput.value.trim().toLowerCase();
  if (!query) return;

  const user = mockUsers[query] || mockUsers[`@${query}`];

  if (user) {
    foundRecipient = user;
    document.getElementById('recipientAvatar').textContent = user.avatar;
    document.getElementById('recipientName').textContent = user.name;
    document.getElementById('recipientId').textContent = `${user.id} · ${user.role}`;
    recipientPreview.style.display = 'flex';
    showToast(`Found: ${user.name}`, 'success');
  } else {
    foundRecipient = null;
    recipientPreview.style.display = 'none';
    showToast('User not found. Check the username or wallet ID.', 'error');
  }
}

// Show summary as amount is typed
sendAmountInput?.addEventListener('input', () => {
  const amount = parseFloat(sendAmountInput.value) || 0;
  if (amount > 0 && foundRecipient) {
    document.getElementById('summaryAmount').textContent = formatAmount(amount, 'NGN');
    document.getElementById('summaryTotal').textContent = formatAmount(amount, 'NGN');
    sendSummary.style.display = 'block';
  } else {
    sendSummary.style.display = 'none';
  }
});

sendBtn?.addEventListener('click', () => {
  if (!foundRecipient) {
    showToast('Please search for a recipient first.', 'error');
    shakeElement(recipientInput);
    return;
  }

  const amount = parseFloat(sendAmountInput.value);
  if (!amount || amount < 50) {
    showToast('Minimum send amount is ₦50.', 'error');
    shakeElement(sendAmountInput);
    return;
  }

  if (amount > state.balance) {
    showToast('Insufficient wallet balance.', 'error');
    shakeElement(sendAmountInput);
    return;
  }

  // Deduct & record
  state.balance -= amount;
  const note = sendNoteInput.value.trim() || 'Transfer';
  const ref = `BL-SEND-${Date.now()}`;

  state.transactions.unshift({
    id: ref,
    type: 'debit',
    icon: '📤',
    title: `Sent to ${foundRecipient.name}`,
    sub: formatDate(new Date()) + ` · ${note}`,
    amount: -amount,
    status: 'success'
  });

  renderBalance();
  updateStatCards();

  showPaymentModal(
    '📤',
    'Money Sent!',
    `Your transfer to ${foundRecipient.name} was successful.`,
    `
      <div><span>Recipient:</span> <strong>${foundRecipient.name} (${foundRecipient.id})</strong></div>
      <div><span>Amount:</span> <strong>${formatAmount(amount, 'NGN')}</strong></div>
      <div><span>Note:</span> <strong>${note}</strong></div>
      <div><span>Reference:</span> <strong>${ref}</strong></div>
      <div><span>New Balance:</span> <strong>${formatAmount(state.balance, 'NGN')}</strong></div>
    `
  );

  // Reset form
  sendAmountInput.value = '';
  sendNoteInput.value = '';
  recipientInput.value = '';
  recipientPreview.style.display = 'none';
  sendSummary.style.display = 'none';
  foundRecipient = null;
});

/* =============================================
   SERVICE PAYMENTS
   ============================================= */
document.querySelectorAll('.service-card__btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.service-card');
    const service = card.dataset.service;
    const amount = parseInt(card.dataset.amount);

    state.pendingServicePayment = { service, amount };

    serviceModalTitle.textContent = 'Confirm Payment';
    serviceModalBody.textContent = `Pay for ${service} from your Bloomlaand wallet?`;
    serviceModalDetail.innerHTML = `
      <div><span>Service:</span> <strong>${service}</strong></div>
      <div><span>Amount:</span> <strong>${formatAmount(amount, 'NGN')}</strong></div>
      <div><span>Wallet Balance:</span> <strong>${formatAmount(state.balance, 'NGN')}</strong></div>
      <div><span>Balance After:</span> <strong>${formatAmount(state.balance - amount, 'NGN')}</strong></div>
    `;

    serviceModalOverlay.classList.add('open');
  });
});

serviceModalConfirm?.addEventListener('click', () => {
  const { service, amount } = state.pendingServicePayment;

  if (amount > state.balance) {
    serviceModalOverlay.classList.remove('open');
    showToast('Insufficient balance. Please fund your wallet first.', 'error');
    // Switch to fund tab
    document.querySelector('[data-tab="fund"]').click();
    return;
  }

  state.balance -= amount;
  const ref = `BL-SVC-${Date.now()}`;

  state.transactions.unshift({
    id: ref,
    type: 'service',
    icon: getServiceIcon(service),
    title: `${service} — Payment`,
    sub: formatDate(new Date()),
    amount: -amount,
    status: 'success'
  });

  renderBalance();
  updateStatCards();
  serviceModalOverlay.classList.remove('open');

  showPaymentModal(
    '✓',
    'Payment Successful!',
    `You now have access to ${service}.`,
    `
      <div><span>Service:</span> <strong>${service}</strong></div>
      <div><span>Amount Paid:</span> <strong>${formatAmount(amount, 'NGN')}</strong></div>
      <div><span>Reference:</span> <strong>${ref}</strong></div>
      <div><span>New Balance:</span> <strong>${formatAmount(state.balance, 'NGN')}</strong></div>
    `
  );

  state.pendingServicePayment = null;
});

serviceModalClose?.addEventListener('click', () => serviceModalOverlay.classList.remove('open'));
serviceModalCancel?.addEventListener('click', () => serviceModalOverlay.classList.remove('open'));
serviceModalOverlay?.addEventListener('click', (e) => {
  if (e.target === serviceModalOverlay) serviceModalOverlay.classList.remove('open');
});

function getServiceIcon(service) {
  const icons = {
    'Classroom Access': '📚',
    'MarketHub Listing': '🛍️',
    'SkillHub Pro': '🎯',
    'Webinar Pass': '🎥',
    'LinguaBloom': '🌍',
    'Library Premium': '📖',
  };
  return icons[service] || '⭐';
}

/* =============================================
   TRANSACTION HISTORY
   ============================================= */
filterType?.addEventListener('change', renderTransactions);
filterMonth?.addEventListener('change', renderTransactions);

function renderTransactions() {
  const typeFilter = filterType?.value || 'all';
  const monthFilter = filterMonth?.value || '';

  let filtered = state.transactions.filter(tx => {
    if (typeFilter === 'credit' && tx.type !== 'credit') return false;
    if (typeFilter === 'debit' && tx.type !== 'debit') return false;
    if (typeFilter === 'service' && tx.type !== 'service') return false;
    // Month filter would parse tx.sub date in production
    return true;
  });

  transactionList.innerHTML = '';

  if (filtered.length === 0) {
    historyEmpty.style.display = 'block';
    return;
  }

  historyEmpty.style.display = 'none';

  filtered.forEach(tx => {
    const isCredit = tx.amount > 0;
    const amountClass = isCredit ? 'tx-amount--credit' : (tx.type === 'service' ? 'tx-amount--service' : 'tx-amount--debit');
    const amountSign = isCredit ? '+' : '-';
    const iconClass = isCredit ? 'tx-icon--credit' : (tx.type === 'service' ? 'tx-icon--service' : 'tx-icon--debit');

    const el = document.createElement('div');
    el.className = 'tx-item';
    el.innerHTML = `
      <div class="tx-icon ${iconClass}">${tx.icon}</div>
      <div class="tx-info">
        <strong>${tx.title}</strong>
        <span>${tx.sub}</span>
      </div>
      <div>
        <div class="tx-amount ${amountClass}">${amountSign}${formatAmount(Math.abs(tx.amount), 'NGN')}</div>
        <div style="text-align:right;margin-top:4px;">
          <span class="tx-status tx-status--${tx.status}">${tx.status}</span>
        </div>
      </div>
    `;
    transactionList.appendChild(el);
  });
}

/* =============================================
   PAYMENT MODAL
   ============================================= */
function showPaymentModal(icon, title, body, detail) {
  document.getElementById('modalIcon').textContent = icon;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').textContent = body;
  document.getElementById('modalDetail').innerHTML = detail;

  // Style detail rows
  document.querySelectorAll('#modalDetail div').forEach(div => {
    div.style.cssText = 'display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(0,0,0,0.05);font-size:13px;';
  });

  modalOverlay.classList.add('open');
}

modalClose?.addEventListener('click', closeModal);
modalBtn?.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

function closeModal() {
  modalOverlay.classList.remove('open');
}

/* =============================================
   TOAST NOTIFICATIONS
   ============================================= */
function showToast(message, type = 'info') {
  // Remove existing toasts
  document.querySelectorAll('.bl-toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = 'bl-toast';

  const colors = {
    success: { bg: 'var(--green-deep)', icon: '✓' },
    error: { bg: '#E05252', icon: '✕' },
    info: { bg: '#3B5FCC', icon: 'ℹ' },
  };

  const c = colors[type] || colors.info;

  toast.style.cssText = `
    position: fixed;
    bottom: 28px;
    right: 28px;
    background: ${c.bg};
    color: white;
    padding: 14px 20px;
    border-radius: 12px;
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 500;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    animation: toast-in 0.3s cubic-bezier(0.4,0,0.2,1);
    max-width: 320px;
  `;

  toast.innerHTML = `
    <span style="width:22px;height:22px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">${c.icon}</span>
    ${message}
  `;

  // Add keyframe if not present
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes toast-in { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      @keyframes toast-out { from { opacity:1; transform:translateY(0); } to { opacity:0; transform:translateY(10px); } }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toast-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* =============================================
   HELPERS
   ============================================= */
function shakeElement(el) {
  if (!el) return;
  el.style.animation = 'none';
  el.offsetHeight; // reflow

  if (!document.getElementById('shake-style')) {
    const s = document.createElement('style');
    s.id = 'shake-style';
    s.textContent = `@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }`;
    document.head.appendChild(s);
  }

  el.style.animation = 'shake 0.4s ease';
  el.style.borderColor = 'var(--red)';
  el.style.boxShadow = '0 0 0 3px rgba(224,82,82,0.15)';

  setTimeout(() => {
    el.style.animation = '';
    el.style.borderColor = '';
    el.style.boxShadow = '';
  }, 800);
}

function formatDate(date) {
  return date.toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric'
  }) + ' · ' + date.toLocaleTimeString('en-NG', {
    hour: '2-digit', minute: '2-digit'
  });
}

/* ─── ESCROW STATE ─── */
let escrowState = {
  vault: 0, // total funds currently locked in escrow
  escrows: [
    // Pre-seeded example so user can see a live escrow immediately
    {
      id: 'ESC-001',
      desc: 'Website redesign — 5 pages',
      seller: { name: 'Emeka Nwosu', id: 'BL-20011', avatar: 'E', role: 'Business Owner' },
      amount: 15000,
      status: 'held', // held | disputed | released | auto-released
      createdAt: Date.now() - 1000 * 60 * 60 * 14, // 14 hours ago
      autoReleaseHours: 72,
      timerInterval: null,
      disputeReason: null,
      disputeDetails: null,
    }
  ],
  activeEscrowId: null, // ID of escrow being actioned in modal
};

/* ─── ESCROW DOM REFS ─── */
const escrowVaultAmount   = document.getElementById('escrowVaultAmount');
const escrowSellerInput   = document.getElementById('escrowSellerInput');
const escrowSearchBtn     = document.getElementById('escrowSearchBtn');
const escrowSellerPreview = document.getElementById('escrowSellerPreview');
const escrowSellerAvatar  = document.getElementById('escrowSellerAvatar');
const escrowSellerName    = document.getElementById('escrowSellerName');
const escrowSellerId      = document.getElementById('escrowSellerId');
const escrowDesc          = document.getElementById('escrowDesc');
const escrowAmount        = document.getElementById('escrowAmount');
const escrowTimer         = document.getElementById('escrowTimer');
const startEscrowBtn      = document.getElementById('startEscrowBtn');
const escrowList          = document.getElementById('escrowList');
const escrowEmpty         = document.getElementById('escrowEmpty');

const escrowActionOverlay = document.getElementById('escrowActionOverlay');
const escrowActionClose   = document.getElementById('escrowActionClose');
const escrowActionIcon    = document.getElementById('escrowActionIcon');
const escrowActionTitle   = document.getElementById('escrowActionTitle');
const escrowActionDetail  = document.getElementById('escrowActionDetail');
const escrowModalStatus   = document.getElementById('escrowModalStatus');
const escrowModalTimer    = document.getElementById('escrowModalTimer');
const escrowModalActions  = document.getElementById('escrowModalActions');
const escrowReleaseBtn    = document.getElementById('escrowReleaseBtn');
const escrowDisputeBtn    = document.getElementById('escrowDisputeBtn');

const disputeModalOverlay = document.getElementById('disputeModalOverlay');
const disputeModalClose   = document.getElementById('disputeModalClose');
const disputeCancel       = document.getElementById('disputeCancel');
const disputeSubmit       = document.getElementById('disputeSubmit');
const disputeReason       = document.getElementById('disputeReason');
const disputeDetails      = document.getElementById('disputeDetails');

let foundEscrowSeller = null;

/* ─── ESCROW: SEARCH SELLER ─── */
escrowSearchBtn?.addEventListener('click', searchEscrowSeller);
escrowSellerInput?.addEventListener('keydown', e => { if (e.key === 'Enter') searchEscrowSeller(); });

function searchEscrowSeller() {
  const query = escrowSellerInput.value.trim().toLowerCase();
  if (!query) return;
  const user = mockUsers[query] || mockUsers[`@${query}`];

  if (user) {
    foundEscrowSeller = user;
    escrowSellerAvatar.textContent = user.avatar;
    escrowSellerName.textContent   = user.name;
    escrowSellerId.textContent     = `${user.id} · ${user.role}`;
    escrowSellerPreview.style.display = 'flex';
    showToast(`Found: ${user.name}`, 'success');
  } else {
    foundEscrowSeller = null;
    escrowSellerPreview.style.display = 'none';
    showToast('User not found. Check the username or wallet ID.', 'error');
  }
}

/* ─── ESCROW: START ─── */
startEscrowBtn?.addEventListener('click', () => {
  if (!foundEscrowSeller) {
    showToast('Please find a seller first.', 'error');
    shakeElement(escrowSellerInput);
    return;
  }
  const desc   = escrowDesc?.value.trim();
  const amount = parseFloat(escrowAmount?.value);
  const hours  = parseInt(escrowTimer?.value) || 72;

  if (!desc) {
    showToast('Please describe the transaction.', 'error');
    shakeElement(escrowDesc);
    return;
  }
  if (!amount || amount < 500) {
    showToast('Minimum escrow amount is ₦500.', 'error');
    shakeElement(escrowAmount);
    return;
  }
  if (amount > state.balance) {
    showToast('Insufficient wallet balance.', 'error');
    shakeElement(escrowAmount);
    return;
  }

  // Deduct from wallet, add to vault
  state.balance    -= amount;
  escrowState.vault += amount;

  const newEscrow = {
    id: `ESC-${Date.now()}`,
    desc,
    seller: { ...foundEscrowSeller },
    amount,
    status: 'held',
    createdAt: Date.now(),
    autoReleaseHours: hours,
    timerInterval: null,
    disputeReason: null,
    disputeDetails: null,
  };

  escrowState.escrows.unshift(newEscrow);

  // Log in transaction history
  state.transactions.unshift({
    id: newEscrow.id,
    type: 'debit',
    icon: '🔒',
    title: `Escrow Locked — ${desc}`,
    sub: formatDate(new Date()) + ` · Seller: ${foundEscrowSeller.name}`,
    amount: -amount,
    status: 'success',
  });

  renderBalance();
  updateStatCards();
  renderEscrowVault();
  renderEscrows();

  // Reset form
  escrowSellerInput.value = '';
  escrowDesc.value        = '';
  escrowAmount.value      = '';
  escrowSellerPreview.style.display = 'none';
  foundEscrowSeller = null;

  showToast(`₦${amount.toLocaleString()} locked in escrow for "${desc}"`, 'success');

  // Start countdown timer for auto-release
  startAutoReleaseTimer(newEscrow);
});

/* ─── ESCROW: AUTO-RELEASE TIMER ─── */
function startAutoReleaseTimer(escrow) {
  if (escrow.status !== 'held') return;

  escrow.timerInterval = setInterval(() => {
    const elapsed  = Date.now() - escrow.createdAt;
    const limitMs  = escrow.autoReleaseHours * 60 * 60 * 1000;
    if (elapsed >= limitMs && escrow.status === 'held') {
      clearInterval(escrow.timerInterval);
      autoReleaseEscrow(escrow);
    }
    // Re-render cards to update countdown
    renderEscrows();
  }, 60000); // update every minute
}

function autoReleaseEscrow(escrow) {
  escrow.status = 'auto-released';
  escrowState.vault  = Math.max(0, escrowState.vault - escrow.amount);

  state.transactions.unshift({
    id: `AUTO-${escrow.id}`,
    type: 'debit',
    icon: '⏱️',
    title: `Escrow Auto-Released — ${escrow.desc}`,
    sub: formatDate(new Date()) + ` · Released to ${escrow.seller.name}`,
    amount: -escrow.amount,
    status: 'success',
  });

  renderBalance();
  renderEscrowVault();
  renderEscrows();
  showToast(`Escrow auto-released to ${escrow.seller.name}`, 'info');
}

/* ─── ESCROW: RENDER VAULT AMOUNT ─── */
function renderEscrowVault() {
  // Recalculate vault from active held/disputed escrows
  escrowState.vault = escrowState.escrows
    .filter(e => e.status === 'held' || e.status === 'disputed')
    .reduce((sum, e) => sum + e.amount, 0);

  if (escrowVaultAmount) {
    escrowVaultAmount.textContent = `₦ ${escrowState.vault.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  }

  // Update pendingVal stat card too
  const pendingEl = document.getElementById('pendingVal');
  if (pendingEl) {
    pendingEl.textContent = `₦ ${escrowState.vault.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  }
}

/* ─── ESCROW: RENDER ESCROW CARDS ─── */
function renderEscrows() {
  if (!escrowList) return;
  escrowList.innerHTML = '';

  const active = escrowState.escrows;

  if (active.length === 0) {
    if (escrowEmpty) escrowEmpty.style.display = 'block';
    return;
  }
  if (escrowEmpty) escrowEmpty.style.display = 'none';

  active.forEach(escrow => {
    const card = document.createElement('div');
    card.className = `escrow-card ${
      escrow.status === 'disputed'      ? 'escrow-card--disputed'  :
      escrow.status === 'released' || escrow.status === 'auto-released' ? 'escrow-card--released' : ''
    }`;

    const timeLeft  = getTimeLeft(escrow);
    const isUrgent  = timeLeft.hours < 6 && escrow.status === 'held';
    const canAction = escrow.status === 'held';

    card.innerHTML = `
      <div class="escrow-card__header">
        <span class="escrow-card__title">${escrow.desc}</span>
        <span class="escrow-card__amount">₦${escrow.amount.toLocaleString()}</span>
      </div>
      <div class="escrow-card__meta">
        <span>👤 ${escrow.seller.name}</span>
        <span>🆔 ${escrow.seller.id}</span>
        <span>📅 ${formatDate(new Date(escrow.createdAt))}</span>
      </div>
      <div class="escrow-card__footer">
        <div>
          <span class="escrow-status escrow-status--${escrow.status === 'auto-released' ? 'auto' : escrow.status}">
            ${escrow.status === 'held'          ? '🔒 Funds Held'      :
              escrow.status === 'disputed'      ? '⚠️ In Dispute'      :
              escrow.status === 'released'      ? '✓ Released'         :
              '⏱️ Auto-Released'}
          </span>
        </div>
        ${canAction ? `
          <span class="escrow-card__timer ${isUrgent ? 'escrow-card__timer--urgent' : ''}">
            ⏳ ${timeLeft.label}
          </span>
        ` : ''}
        ${canAction ? `
          <div class="escrow-card__actions">
            <button class="escrow-action-btn escrow-action-btn--dispute" data-id="${escrow.id}">⚠️ Dispute</button>
            <button class="escrow-action-btn escrow-action-btn--release" data-id="${escrow.id}">✓ Release</button>
          </div>
        ` : ''}
      </div>
    `;

    // Card click opens detail modal
    card.addEventListener('click', (e) => {
      if (e.target.closest('.escrow-action-btn')) return;
      openEscrowModal(escrow.id);
    });

    // Inline action buttons
    card.querySelector('.escrow-action-btn--release')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openEscrowModal(escrow.id);
    });
    card.querySelector('.escrow-action-btn--dispute')?.addEventListener('click', (e) => {
      e.stopPropagation();
      escrowState.activeEscrowId = escrow.id;
      openDisputeModal();
    });

    escrowList.appendChild(card);
  });
}

/* ─── ESCROW: TIME LEFT HELPER ─── */
function getTimeLeft(escrow) {
  const limitMs  = escrow.autoReleaseHours * 60 * 60 * 1000;
  const elapsed  = Date.now() - escrow.createdAt;
  const remaining = Math.max(0, limitMs - elapsed);
  const hours    = Math.floor(remaining / (1000 * 60 * 60));
  const mins     = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  if (remaining === 0) return { hours: 0, label: 'Releasing soon…' };
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return { hours, label: `Auto-releases in ${days}d ${hours % 24}h` };
  }
  return { hours, label: `Auto-releases in ${hours}h ${mins}m` };
}

/* ─── ESCROW: OPEN DETAIL MODAL ─── */
function openEscrowModal(id) {
  const escrow = escrowState.escrows.find(e => e.id === id);
  if (!escrow) return;
  escrowState.activeEscrowId = id;

  escrowActionIcon.textContent  = escrow.status === 'disputed' ? '⚠️' : escrow.status === 'released' || escrow.status === 'auto-released' ? '✓' : '🔒';
  escrowActionTitle.textContent = escrow.desc;

  escrowActionDetail.innerHTML = `
    <div><span>Seller:</span> <strong>${escrow.seller.name} (${escrow.seller.id})</strong></div>
    <div><span>Amount:</span> <strong>₦${escrow.amount.toLocaleString()}</strong></div>
    <div><span>Started:</span> <strong>${formatDate(new Date(escrow.createdAt))}</strong></div>
    <div><span>Auto-release:</span> <strong>${escrow.autoReleaseHours} hours after start</strong></div>
    ${escrow.disputeReason ? `<div><span>Dispute Reason:</span> <strong>${escrow.disputeReason}</strong></div>` : ''}
  `;
  document.querySelectorAll('#escrowActionDetail div').forEach(div => {
    div.style.cssText = 'display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(0,0,0,0.05);font-size:13px;';
  });

  const statusLabels = {
    'held':          '<span style="color:var(--gold-dark);background:rgba(232,184,75,0.12);padding:5px 14px;border-radius:100px;font-size:12px;font-weight:700;">🔒 Funds Held Securely</span>',
    'disputed':      '<span style="color:var(--red);background:rgba(224,82,82,0.1);padding:5px 14px;border-radius:100px;font-size:12px;font-weight:700;">⚠️ Under Dispute Review</span>',
    'released':      '<span style="color:var(--green-ok);background:rgba(61,184,122,0.12);padding:5px 14px;border-radius:100px;font-size:12px;font-weight:700;">✓ Funds Released</span>',
    'auto-released': '<span style="color:var(--text-muted);background:rgba(107,122,109,0.1);padding:5px 14px;border-radius:100px;font-size:12px;font-weight:700;">⏱️ Auto-Released</span>',
  };
  escrowModalStatus.innerHTML = statusLabels[escrow.status] || '';

  const timeLeft = getTimeLeft(escrow);
  escrowModalTimer.textContent = escrow.status === 'held' ? `⏳ ${timeLeft.label}` : '';

  // Show/hide action buttons based on status
  const canAction = escrow.status === 'held';
  escrowModalActions.style.display = canAction ? 'flex' : 'none';

  escrowActionOverlay.classList.add('open');
}

/* ─── ESCROW: RELEASE FUNDS ─── */
escrowReleaseBtn?.addEventListener('click', () => {
  const escrow = escrowState.escrows.find(e => e.id === escrowState.activeEscrowId);
  if (!escrow || escrow.status !== 'held') return;

  escrow.status = 'released';
  clearInterval(escrow.timerInterval);
  escrowState.vault = Math.max(0, escrowState.vault - escrow.amount);

  state.transactions.unshift({
    id: `REL-${escrow.id}`,
    type: 'debit',
    icon: '✅',
    title: `Escrow Released — ${escrow.desc}`,
    sub: formatDate(new Date()) + ` · Paid to ${escrow.seller.name}`,
    amount: -escrow.amount,
    status: 'success',
  });

  escrowActionOverlay.classList.remove('open');
  renderBalance();
  updateStatCards();
  renderEscrowVault();
  renderEscrows();

  showPaymentModal(
    '✓',
    'Funds Released!',
    `₦${escrow.amount.toLocaleString()} has been sent to ${escrow.seller.name}'s wallet.`,
    `
      <div><span>Recipient:</span> <strong>${escrow.seller.name}</strong></div>
      <div><span>Amount:</span> <strong>₦${escrow.amount.toLocaleString()}</strong></div>
      <div><span>Transaction:</span> <strong>${escrow.desc}</strong></div>
    `
  );
});

/* ─── ESCROW: OPEN DISPUTE ─── */
escrowDisputeBtn?.addEventListener('click', () => {
  escrowActionOverlay.classList.remove('open');
  openDisputeModal();
});

function openDisputeModal() {
  if (disputeReason) disputeReason.value = '';
  if (disputeDetails) disputeDetails.value = '';
  disputeModalOverlay.classList.add('open');
}

/* ─── ESCROW: SUBMIT DISPUTE ─── */
disputeSubmit?.addEventListener('click', () => {
  const reason  = disputeReason?.value;
  const details = disputeDetails?.value.trim();

  if (!reason) {
    showToast('Please select a dispute reason.', 'error');
    return;
  }
  if (!details || details.length < 10) {
    showToast('Please provide more detail about the issue.', 'error');
    shakeElement(disputeDetails);
    return;
  }

  const escrow = escrowState.escrows.find(e => e.id === escrowState.activeEscrowId);
  if (!escrow) return;

  escrow.status         = 'disputed';
  escrow.disputeReason  = reason;
  escrow.disputeDetails = details;
  clearInterval(escrow.timerInterval); // freeze auto-release during dispute

  state.transactions.unshift({
    id: `DISP-${escrow.id}`,
    type: 'debit',
    icon: '⚠️',
    title: `Dispute Raised — ${escrow.desc}`,
    sub: formatDate(new Date()) + ' · Under review',
    amount: 0,
    status: 'pending',
  });

  disputeModalOverlay.classList.remove('open');
  renderEscrows();

  showPaymentModal(
    '⚠️',
    'Dispute Submitted',
    `Your dispute has been filed. Funds are frozen until our trust team resolves the issue within 24–48 hours.`,
    `
      <div><span>Transaction:</span> <strong>${escrow.desc}</strong></div>
      <div><span>Amount Frozen:</span> <strong>₦${escrow.amount.toLocaleString()}</strong></div>
      <div><span>Reason:</span> <strong>${reason}</strong></div>
      <div><span>Review Time:</span> <strong>24–48 hours</strong></div>
    `
  );
});

/* Dispute modal close handlers */
disputeModalClose?.addEventListener('click', () => disputeModalOverlay.classList.remove('open'));
disputeCancel?.addEventListener('click',     () => disputeModalOverlay.classList.remove('open'));
disputeModalOverlay?.addEventListener('click', e => {
  if (e.target === disputeModalOverlay) disputeModalOverlay.classList.remove('open');
});

/* Escrow action modal close */
escrowActionClose?.addEventListener('click', () => escrowActionOverlay.classList.remove('open'));
escrowActionOverlay?.addEventListener('click', e => {
  if (e.target === escrowActionOverlay) escrowActionOverlay.classList.remove('open');
});

/* ─── INIT ESCROW ON PAGE LOAD ─── */
function initEscrow() {
  renderEscrowVault();
  renderEscrows();
  // Start timers for any pre-seeded held escrows
  escrowState.escrows.forEach(e => {
    if (e.status === 'held') startAutoReleaseTimer(e);
  });
}


function init() {
  renderBalance();
  updateStatCards();
  renderTransactions();
  initEscrow();

  // Set default filter month to current month
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (filterMonth) filterMonth.value = monthStr;

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      serviceModalOverlay.classList.remove('open');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);