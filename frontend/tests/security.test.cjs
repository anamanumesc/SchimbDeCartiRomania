const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const cards = [];
let buttonHandler;
const elements = {
  booksGrid: { innerHTML: '', appendChild(card) { cards.push(card); } },
  countLabel: { textContent: '' }
};
const context = vm.createContext({
  URL, URLSearchParams, console,
  window: { location: { origin: 'https://example.com' } },
  localStorage: { getItem() { return null; } },
  document: {
    addEventListener() {},
    getElementById(id) { return elements[id]; },
    createElement() {
      return { querySelector() { return { addEventListener(event, fn) { buttonHandler = fn; } }; } };
    }
  }
});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8'), context);
const payload = '\'"><img src=x onerror=alert(1)>';
context.payload = payload;
vm.runInContext(`
  startTrade = (...args) => globalThis.tradeArgs = args;
  renderGrid([{
    id: 42, owner_id: 7, owner: {id: 7, username: payload},
    title: payload, author: payload, city: payload, genre: payload,
    condition: payload, volume_info: payload, is_series: true,
    cover_url: 'javascript:alert(1)'
  }], 'booksGrid');
`, context);
assert.equal(cards.length, 1);
assert.ok(!cards[0].innerHTML.includes(payload));
assert.ok(cards[0].innerHTML.includes('&lt;img'));
assert.ok(!cards[0].innerHTML.includes('javascript:'));
assert.equal(vm.runInContext(`safeCoverUrl('data:image/svg+xml,attack')`, context), '');
assert.equal(vm.runInContext(`safeCoverUrl('https://example.com/cover.jpg')`, context), 'https://example.com/cover.jpg');
buttonHandler({ stopPropagation() {} });
assert.equal(context.tradeArgs[0], 42);
assert.equal(context.tradeArgs[1], payload);
console.log('frontend escaped rendering and safe cover url tests passed');
