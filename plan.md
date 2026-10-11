# Splitter — Build Plan

## Stack

- `splitter.html` — UI, event handling, rendering, localStorage
- `logic.js` — pure functions only (balance calc, debt simplification); loaded by `test.html` via `<script src>` and inlined in `splitter.html` so the app stays a single file
- `test.html` — inline test runner, loads `logic.js` via `<script src>`
- CSS embedded in `<style>` inside `splitter.html`
- `index.html` — tiny entry page for GitHub Pages that redirects to `splitter.html`
- Data persisted in `localStorage`

---

## Data model

```js
// localStorage key: "splitter"
{
  members: ["Alice", "Bob", "Davide"],  // ordered list of names
  expenses: [
    {
      id: "uuid",
      description: "Dinner",
      amount: 90,           // total in euros (float)
      paidBy: "Alice",      // member name
      participants: ["Alice", "Bob", "Davide"],  // who splits it
      date: "2026-03-01"
    }
  ],
  settlements: [
    {
      id: "uuid",
      from: "Bob",    // who paid
      to: "Alice",    // who received
      amount: 30,
      date: "2026-03-01"
    }
  ]
}
```

---

## Core logic

### Balance calculation
1. For each expense, compute each participant's share: `amount / participants.length`
2. The payer is credited the full amount; each participant is debited their share
3. Net balance per person = total paid - total owed
4. For settlements: payer's balance increases, receiver's balance decreases

### Debt simplification
- Separate members into creditors (positive balance) and debtors (negative balance)
- Greedily match the largest debtor with the largest creditor
- Produce a short list of transactions that settles all debts (greedy, not guaranteed to be the absolute minimum)

---

## UI sections

### 1. Members panel
- List of current members
- Input + "Add" button to add a new member
- Remove button per member (disabled if member is referenced in expenses/settlements)

### 2. Add expense form
- Fields: description, amount, paid by (dropdown), participants (checkboxes, all checked by default)
- "Add expense" button
- Validation: amount > 0, at least one participant (the payer may or may not be one of the participants)

### 3. Expenses list
- Show all expenses, newest first
- Each row: date, description, amount, who paid, how many participants
- Delete button per expense

### 4. Balances panel
- Show net balance per member (positive = is owed money, negative = owes money)
- Show the simplified list of transactions needed to settle up

### 5. Settle up
- Dropdown: who pays, who receives, amount (pre-filled from simplified transactions)
- "Record settlement" button
- Settlements listed below with delete option

---

## Implementation steps

- [x] 1. `logic.js` — balance calculation + debt simplification as exported pure functions
- [x] 2. `test.html` — inline test runner covering all logic cases (see below)
- [x] 3. `splitter.html` skeleton with all sections
- [x] 4. localStorage read/write helpers
- [x] 5. Members: add, remove, render
- [x] 6. Expenses: add, delete, render
- [x] 7. Wire up balance + simplification from `logic.js`, render balances panel
- [x] 8. Settlements: add, delete, render
- [x] 9. Basic CSS styling (clean, readable, mobile-friendly)
- [x] 10. Edge cases: empty state, reset all data

---

## Testing (`test.html`)

Inline runner with no dependencies: each test calls an assertion helper and renders pass/fail in the page.

### Cases to cover

**`computeBalances(members, expenses, settlements)`**
- No expenses → all balances are 0
- One expense, one payer, all participate equally → payer is positive, others negative
- Payer is also a participant → their share is deducted from what they're owed
- Multiple expenses → balances accumulate correctly
- Settlement reduces debtor's debt and creditor's credit

**`simplifyDebts(balances)`**
- All zeroes → no transactions
- One debtor, one creditor → single transaction
- Multiple debtors and creditors → a short list of transactions (greedy)
- Rounding: no floating point artifacts (use amounts rounded to 2 decimal places)
- Already-settled group → empty result

---

## Out of scope

- Multiple groups
- Multiple split modes (percentages, exact amounts, shares)
- Export / import
- Currency selection
