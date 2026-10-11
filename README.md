# Splitter

A simple, single-file HTML app that runs entirely in your browser. No accounts, no server, no sign-up — just open the file and start splitting expenses with friends.

Instead of inviting friends to a platform, you define them as named labels (e.g. "Alice", "Bob") and manage everything yourself.

## Usage

**Open `splitter.html`** in any browser — double-click it, no server needed.

Or use it online (GitHub Pages): <https://davide-dv.github.io/splitter/> — the page redirects to the app, which is also available directly at <https://davide-dv.github.io/splitter/splitter.html>.

To share it with friends, just send them the `splitter.html` file.

## Features

- **No accounts** — define friends as simple labels
- **One group** — manage one shared trip or context at a time
- **Add expenses** — record who paid, the amount, and which friends are involved (split equally among selected participants)
- **Partial splits** — each expense can involve any subset of the group
- **Simplified settlements** — debts are reduced to a small number of payments (a greedy match of the biggest debtor with the biggest creditor; usually the fewest, but not guaranteed to be the absolute minimum)
- **Settle up** — record payments between friends to clear debts
- **Persistent** — all data is saved in `localStorage`, so it survives page refreshes

## How it works

1. Add the names of the people in your group
2. Add expenses: pick who paid, enter the total, select who's involved
3. The app calculates who owes whom and simplifies the debts
4. When someone pays back, record the settlement — balances update automatically

## Files

| File | Purpose |
|------|---------|
| `splitter.html` | The app — fully self-contained, share this |
| `index.html` | Entry page for GitHub Pages: redirects to `splitter.html` (the app itself does not need it) |
| `logic.js` | Pure logic functions (balance calc, debt simplification) — used by tests |
| `test.html` | Test suite — open in a browser to verify the logic |
| `plan.md` | Original build plan and data model |

## Technical details

- `splitter.html` is fully self-contained — no external dependencies
- Data stored in `localStorage`
- Works offline
- `logic.js` exists separately only to support `test.html`; its code is inlined in `splitter.html`

## License

Released under the GNU General Public License v3.0 — see [`LICENSE`](LICENSE).
