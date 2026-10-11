// Command-line check, no dependencies:  node check.js
//  1. runs the test suite of test.html against logic.js (same code, no browser needed)
//  2. checks that the copy of the logic inlined in splitter.html is identical to logic.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const scriptOf = (html, n) => html.split('<script>')[n].split('</script>')[0];
let failed = false;

// 1. test.html
const logic = read('logic.js');
const stub = () => ({ appendChild() {}, style: {}, textContent: '' });
const sandbox = { document: { getElementById: stub, createElement: stub }, console };
vm.createContext(sandbox);
vm.runInContext(logic + '\n' + scriptOf(read('test.html'), 1) + '\n;globalThis.__results = results;', sandbox);
const results = sandbox.__results;
for (const r of results.filter(r => !r.pass)) {
  console.log('FAIL', r.group + ': ' + r.label);
  console.log('  expected:', JSON.stringify(r.expected));
  console.log('  actual:  ', JSON.stringify(r.actual));
  failed = true;
}
console.log(`test.html: ${results.filter(r => r.pass).length} / ${results.length} tests passed`);

// 2. logic.js vs the copy inside splitter.html (comments and whitespace are ignored)
const normalize = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/\s+/g, '');
const inlined = scriptOf(read('splitter.html'), 1);
if (normalize(inlined) === normalize(logic)) {
  console.log('splitter.html: inlined logic is identical to logic.js');
} else {
  console.log('FAIL splitter.html: inlined logic differs from logic.js — update both together');
  failed = true;
}

process.exit(failed ? 1 : 0);
