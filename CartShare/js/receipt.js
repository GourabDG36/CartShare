/**
 * receipt.js
 * -----------------------------------------------------------------------
 * Builds the printable receipt into #receipt-print right before printing.
 * That element is display:none on screen and only shown by the
 * @media print rules in style.css, which also hide everything else —
 * so the printed page contains ONLY the receipt.
 * -----------------------------------------------------------------------
 */

function buildReceiptHtml(room) {
  const totals = computeTotals(room);
  const now = new Date();

  const rows = room.items.map((item) => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td class="cell-num">${item.quantity}</td>
      <td class="cell-num">${formatMoney(item.price)}</td>
      <td class="cell-num">${formatMoney(item.quantity * item.price)}</td>
    </tr>
  `).join('');

  const contributionRows = totals.contributions.map((c) => `
    <tr><td>${escapeHtml(c.name)}</td><td class="cell-num">${formatMoney(c.total)}</td></tr>
  `).join('');

  return `
    <div class="receipt-doc">
      <header class="receipt-doc__header">
        <h1>CartShare Receipt</h1>
        <p>Room <strong>${escapeHtml(room.code)}</strong> · ${now.toLocaleString()}</p>
      </header>

      <section>
        <h2>Participants</h2>
        <p>${room.participants.map((p) => escapeHtml(p.name)).join(', ') || '—'}</p>
      </section>

      <section>
        <h2>Items</h2>
        <table class="receipt-table">
          <thead><tr><th>Item</th><th class="cell-num">Qty</th><th class="cell-num">Price</th><th class="cell-num">Total</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4">No items in cart.</td></tr>'}</tbody>
        </table>
      </section>

      <section>
        <h2>Contribution summary</h2>
        <table class="receipt-table">
          <thead><tr><th>Participant</th><th class="cell-num">Amount</th></tr></thead>
          <tbody>${contributionRows || '<tr><td colspan="2">No contributions yet.</td></tr>'}</tbody>
        </table>
      </section>

      <footer class="receipt-doc__total">
        <span>Total (${totals.totalItems} item${totals.totalItems === 1 ? '' : 's'})</span>
        <span>${formatMoney(totals.totalValue)}</span>
      </footer>
    </div>
  `;
}

function printReceipt(room) {
  document.getElementById('receipt-print').innerHTML = buildReceiptHtml(room);
  window.print();
}
