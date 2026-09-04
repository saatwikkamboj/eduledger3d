// Converts a rupee amount into words using the Indian numbering system
// (Thousand / Lakh / Crore), e.g. 512345.50 -> "Five Lakh Twelve Thousand
// Three Hundred Forty Five Rupees and Fifty Paise Only"

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${TENS[t]}${o ? ' ' + ONES[o] : ''}`.trim();
}

function threeDigits(n) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let out = '';
  if (h) out += `${ONES[h]} Hundred`;
  if (rest) out += `${out ? ' ' : ''}${twoDigits(rest)}`;
  return out;
}

function integerToWords(num) {
  if (num === 0) return 'Zero';
  let n = Math.floor(num);
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = n;

  const parts = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));
  return parts.join(' ').trim();
}

function amountToWords(amount) {
  const safe = Math.max(0, Number(amount) || 0);
  const rupees = Math.floor(safe);
  const paise = Math.round((safe - rupees) * 100);

  let words = `${integerToWords(rupees)} Rupee${rupees === 1 ? '' : 's'}`;
  if (paise > 0) {
    words += ` and ${integerToWords(paise)} Paise`;
  }
  words += ' Only';
  return words;
}

module.exports = { amountToWords, integerToWords };
