jest.setTimeout(15000);

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  const WebView = (props) => React.createElement(View, props);
  return { WebView, default: WebView };
});

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