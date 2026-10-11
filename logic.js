const MAX_AMOUNT = 1e9;

function round2(x) { return Math.round(x * 100) / 100; }

function toCents(x) { return Math.round(x * 100); }

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function validAmount(x) { return typeof x === 'number' && Number.isFinite(x) && x > 0 && x <= MAX_AMOUNT; }

/**
 * Compute the net balance for each member.
 * Positive = is owed money. Negative = owes money.
 * Entries that cannot be applied (invalid amount, no participants, people who
 * are not members) are ignored instead of corrupting the balances.
 *
 * Works in whole cents so the balances always add up to exactly zero.
 * When an expense does not divide evenly, the leftover cents go one each to
 * the participants, starting from the payer (if they take part).
 */
function computeBalances(members, expenses, settlements) {
  const cents = Object.create(null);
  for (const m of members) cents[m] = 0;
  const known = name => Object.prototype.hasOwnProperty.call(cents, name);

  for (const expense of expenses) {
    const { amount, paidBy, participants } = expense;
    if (!validAmount(amount) || !Array.isArray(participants) || participants.length === 0) continue;
    if (!known(paidBy) || !participants.every(known)) continue;

    const total = toCents(amount);
    const order = participants.slice();
    const payerAt = order.indexOf(paidBy);
    if (payerAt > 0) order.unshift(order.splice(payerAt, 1)[0]);

    const base = Math.floor(total / order.length);
    const extra = total - base * order.length;

    cents[paidBy] += total;
    order.forEach((p, i) => { cents[p] -= base + (i < extra ? 1 : 0); });
  }

  for (const s of settlements) {
    if (!validAmount(s.amount) || !known(s.from) || !known(s.to)) continue;
    const c = toCents(s.amount);
    cents[s.from] += c;
    cents[s.to] -= c;
  }

  const balances = Object.create(null);
  for (const m of members) balances[m] = cents[m] / 100;

  return balances;
}

/**
 * Produce a short list of transactions that settles all debts
 * (greedy: largest debtor pays largest creditor; the fewest possible
 * transactions is not guaranteed).
 */
function simplifyDebts(balances) {
  const creditors = [];
  const debtors = [];

  for (const [name, balance] of Object.entries(balances)) {
    if (!Number.isFinite(balance)) continue;
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
    if (!(amount > 0)) break;
    transactions.push({ from: debtors[di].name, to: creditors[ci].name, amount: amount / 100 });
    debtors[di].amount -= amount;
    creditors[ci].amount -= amount;
    if (debtors[di].amount === 0) di++;
    if (creditors[ci].amount === 0) ci++;
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
