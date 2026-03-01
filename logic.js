const EPS = 0.005;

function round2(x) { return Math.round(x * 100) / 100; }

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

/**
 * Compute the net balance for each member.
 * Positive = is owed money. Negative = owes money.
 */
function computeBalances(members, expenses, settlements) {
  const balances = {};
  for (const m of members) balances[m] = 0;

  for (const expense of expenses) {
    const share = expense.amount / expense.participants.length;
    balances[expense.paidBy] += expense.amount;
    for (const p of expense.participants) balances[p] -= share;
  }

  for (const s of settlements) {
    balances[s.from] += s.amount;
    balances[s.to] -= s.amount;
  }

  for (const m of members) balances[m] = round2(balances[m]);

  return balances;
}

/**
 * Produce the minimal list of transactions needed to settle all debts.
 */
function simplifyDebts(balances) {
  const creditors = [];
  const debtors = [];

  for (const [name, balance] of Object.entries(balances)) {
    if (balance > EPS)   creditors.push({ name, amount: balance });
    else if (balance < -EPS) debtors.push({ name, amount: -balance });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let di = 0, ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const amount = round2(Math.min(debtors[di].amount, creditors[ci].amount));
    transactions.push({ from: debtors[di].name, to: creditors[ci].name, amount });
    debtors[di].amount -= amount;
    creditors[ci].amount -= amount;
    if (debtors[di].amount < EPS) di++;
    if (creditors[ci].amount < EPS) ci++;
  }

  return transactions;
}
