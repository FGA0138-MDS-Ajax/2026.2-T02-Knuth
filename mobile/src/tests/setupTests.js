jest.setTimeout(15000);

const originalError = console.error;

console.error = function (...args) {
  const texto = args
    .map((a) => (typeof a === 'string' ? a : ''))
    .join(' ');
  if (/not wrapped in act/i.test(texto)) {
    return;
  }
  originalError.apply(console, args);
};