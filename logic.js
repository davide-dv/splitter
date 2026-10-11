const EPS = 0.005;
const MAX_AMOUNT = 1e9;

function round2(x) { return Math.round(x * 100) / 100; }

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function validAmount(x) { return typeof x === 'number' && Number.isFinite(x) && x > 0 && x <= MAX_AMOUNT; }

/**
 * Compute the net balance for each member.
 * Positive = is owed money. Negative = owes money.
 * Entries that cannot be applied (invalid amount, no participants, people who
 * are not members) are ignored instead of corrupting the balances.
 */
function computeBalances(members, expenses, settlements) {
  const balances = Object.create(null);
  for (const m of members) balances[m] = 0;
  const known = name => Object.prototype.hasOwnProperty.call(balances, name);

  for (const expense of expenses) {
    const { amount, paidBy, participants } = expense;
    if (!validAmount(amount) || !Array.isArray(participants) || participants.length === 0) continue;
    if (!known(paidBy) || !participants.every(known)) continue;
    const share = amount / participants.length;
    balances[paidBy] += amount;
    for (const p of participants) balances[p] -= share;
  }

  for (const s of settlements) {
    if (!validAmount(s.amount) || !known(s.from) || !known(s.to)) continue;
    balances[s.from] += s.amount;
    balances[s.to] -= s.amount;
  }

  for (const m of members) balances[m] = round2(balances[m]);

  return balances;
}

/**
 * Produce a short list of transactions that settles all debts
 * (greedy: largest debtor pays largest creditor).
 */
function simplifyDebts(balances) {
  const creditors = [];
  const debtors = [];

  for (const [name, balance] of Object.entries(balances)) {
    if (!Number.isFinite(balance)) continue;
    if (balance > EPS)   creditors.push({ name, amount: balance });
    else if (balance < -EPS) debtors.push({ name, amount: -balance });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let di = 0, ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const amount = round2(Math.min(debtors[di].amount, creditors[ci].amount));
    if (!(amount > 0)) break;
    transactions.push({ from: debtors[di].name, to: creditors[ci].name, amount });
    debtors[di].amount -= amount;
    creditors[ci].amount -= amount;
    if (debtors[di].amount < EPS) di++;
    if (creditors[ci].amount < EPS) ci++;
  }

  return transactions;
}

/**
 * Turn whatever was read from storage into a safe state object.
 * Keeps the stored format; drops entries that would break the app.
 */
function sanitizeState(raw) {
  const out = { members: [], expenses: [], settlements: [] };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;

  const isName = x => typeof x === 'string' && x.length > 0;
  if (Array.isArray(raw.members)) {
    for (const m of raw.members) if (isName(m) && !out.members.includes(m)) out.members.push(m);
  }
  const has = name => out.members.includes(name);
  const text = x => typeof x === 'string' ? x : '';

  if (Array.isArray(raw.expenses)) {
    for (const e of raw.expenses) {
      if (!e || typeof e !== 'object' || !validAmount(e.amount)) continue;
      if (!has(e.paidBy) || !Array.isArray(e.participants) || e.participants.length === 0) continue;
      if (!e.participants.every(has)) continue;
      out.expenses.push({
        id: text(e.id) || uid(), description: text(e.description), amount: e.amount,
        paidBy: e.paidBy, participants: e.participants.slice(), date: text(e.date),
      });
    }
  }

  if (Array.isArray(raw.settlements)) {
    for (const s of raw.settlements) {
      if (!s || typeof s !== 'object' || !validAmount(s.amount) || !has(s.from) || !has(s.to)) continue;
      out.settlements.push({
        id: text(s.id) || uid(), from: s.from, to: s.to, amount: s.amount, date: text(s.date),
      });
    }
  }

  return out;
}
