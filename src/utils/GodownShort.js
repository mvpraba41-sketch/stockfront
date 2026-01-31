// src/utils/godownShort.js
export const shortenGodown = (name) => {
  if (!name) return '';
  return name
    .replace(/_godown|_shop/g, '')               // Remove _godown / _shop
    .split('_')
    .map(word => {
      const w = word.trim();
      if (!w) return '';
      const num = w.match(/\d+$/);                 // Capture trailing number
      if (num) {
        const letters = w.slice(0, -num[0].length);
        return letters.charAt(0).toUpperCase() + num[0];
      }
      return w.charAt(0).toUpperCase();
    })
    .join('');
};