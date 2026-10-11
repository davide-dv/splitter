function round2(x) { return Math.round(x * 100) / 100; }

function toCents(x) { return Math.round(x * 100); }

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

/**
 * Compute the net balance for each member.
 * Positive = is owed money. Negative = owes money.
 *
 * Works in whole cents so the balances always add up to exactly zero.
 * When an expense does not divide evenly, the leftover cents go one each to
 * the participants, starting from the payer (if they take part).
 */
function computeBalances(members, expenses, settlements) {
  const cents = {};
  for (const m of members) cents[m] = 0;

  for (const expense of expenses) {
    const total = toCents(expense.amount);
    const order = expense.participants.slice();
    const payerAt = order.indexOf(expense.paidBy);
    if (payerAt > 0) order.unshift(order.splice(payerAt, 1)[0]);

    const base = Math.floor(total / order.length);
    const extra = total - base * order.length;

    cents[expense.paidBy] += total;
    order.forEach((p, i) => { cents[p] -= base + (i < extra ? 1 : 0); });
  }

  for (const s of settlements) {
    const c = toCents(s.amount);
    cents[s.from] += c;
    cents[s.to] -= c;
  }

  const balances = {};
  for (const m of members) balances[m] = cents[m] / 100;

  return balances;
}

/**
 * Produce the minimal list of transactions needed to settle all debts.
 */
function simplifyDebts(balances) {
  const creditors = [];
  const debtors = [];

  for (const [name, balance] of Object.entries(balances)) {
    const c = toCents(balance);
    if (c > 0)      creditors.push({ name, amount: c });
    else if (c < 0) debtors.push({ name, amount: -c });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let di = 0, ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const amount = Math.min(debtors[di].amount, creditors[ci].amount);
    transactions.push({ from: debtors[di].name, to: creditors[ci].name, amount: amount / 100 });
    debtors[di].amount -= amount;
    creditors[ci].amount -= amount;
    if (debtors[di].amount === 0) di++;
    if (creditors[ci].amount === 0) ci++;
  }

  return transactions;
}
