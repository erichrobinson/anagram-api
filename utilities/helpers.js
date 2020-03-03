export function sortByLetter(word) {
  return word.toLowerCase().split('').sort().join('')
}

export function isProper(word) {
  return /^[A-Z]/.test(word)
}