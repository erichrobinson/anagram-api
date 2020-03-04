/**
 * Takes a word and returns a string of the charachters
 * in alphabetical order. Used to quickly find words that
 * are anagrams of eachother because both "care" and "acre"
 * would return "acer".
 */
export function sortByLetter(word) {
  return word.toLowerCase().split('').sort().join('')
}

/**
 * Checks if the first letter of a word is capitalized.
 * Used as a rough approximation of whether a word is
 * a proper noun.
 */
export function isProper(word) {
  return /^[A-Z]/.test(word)
}