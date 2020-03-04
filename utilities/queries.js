import { isProper, sortByLetter } from './helpers'

/** Simple helper to assist in readability */
function buildResponse(status, message, data = []) {
  return {
    status,
    message,
    data
  }
}

/**
 * Deletes one or more record(s) from the "words" collection.
 * If delteAnagrams flag is false, only delete the word that was passed in.
 * If deleteAnagrams flag is true, delete the word that was passed in and
 * any anagrams that exist.
 * 
 * Returns the result of the deletion.
 */
export async function deleteWord(db, word = '', deleteAnagrams = false) {
  let result
  let deletedWords

  try {
    if(deleteAnagrams) {
      deletedWords = await db.collection('words').deleteMany({ sorted: sortByLetter(word) })
    } else {
      deletedWords = await db.collection('words').deleteOne({ word })
    }

    result = buildResponse(
      200,
      `${deletedWords.deletedCount} word(s) ${deleteAnagrams ? 'and anagrams' : ''} sucesfully deleted`
    )

  } catch(err) {
    console.error(`Error in deleteWord for ${word}: ${err}`)
    result = buildResponse(
      500,
      `An error ocurred: ${error}`
    )
  }
  
  return result
}

/**
 * Queries the database for all worts that are alphabetically sorted in the same way.
 * Optinally can exclude words that are proper nouns and can limit the results to
 * a given number.
 * 
 * Returns an array of words that are anagrams of the source word.
 */
export async function getAnagrams(db, word = '', excludeProper = false, limit = 1000) {
  let result
  let anagrams
  const query = {
    word: { $ne: word },
    sorted: sortByLetter(word)
  }

  if(excludeProper) query.isProper = false

  try {
    anagrams = await db.collection('words').find(query).limit(limit).toArray()
    result = buildResponse(
      200,
      `${anagrams.length} anagrams found for the word ${word}.`,
      anagrams.map(record => record.word)
    )
  } catch(err) {
    console.error(`Error in getAnagrams for ${word}: ${err}`)
    result = buildResponse(
      500,
      `An error ocurred: ${err}`
    )
  }

  return result
}

/**
 * Returns the median word length for the entire words collection
 */
async function getMedianWordLength(db, wordCount) {
  let median

  try {
    const sorted = await db.collection('words').find().sort( { length: 1 } ).toArray()
    const middleIndex = wordCount / 2
    
    if(wordCount % 2 === 0) {
      median = (sorted[middleIndex].length + sorted[middleIndex + 1].length) / 2
    } else {
      median = sorted[Math.round(middleIndex)].length
    }
  } catch(err) {
    console.error(`Error in getMedianWordLength: ${err}`)
  }

  return median
}

/**
 * Retrieves interesting statistical attributes of the words collection 
 * 
 * Returns object containing: total number of words, max length,
 * min length, average length, median length
 */
export async function getStats(db) {
  let result
  const stats = {}

  try {
    const aggregateData = await db.collection('words').aggregate([{
      $group: {
        _id: null,
        average: {
          $avg: '$length',
        },
        min: {
          $min: '$length',
        },
        max: {
          $max: '$length'
        }
      }
    }]).toArray()
  
    stats.numberOfWords = await db.collection('words').countDocuments();
    stats.averageWordLength = +aggregateData[0].average.toFixed(1)
    stats.minWordLength = aggregateData[0].min
    stats.maxWordLength = aggregateData[0].max
    stats.medianWordLength = await getMedianWordLength(db, stats.numberOfWords)

    result = buildResponse(
      200,
      "Data sucessfully retrieved",
      stats
    )
  } catch(err) {
    console.error(`Error in getStats: ${error}`)
    result = buildResponse(
      500,
      `Error retrieving data: ${error}`
    )
  }
  
  return result
}

/**
 * Takes an array of words, queries the database for a duplicate entry and
 * inserts any unique words
 * 
 * Returns  
 */
export async function insertWords(db, words = []) {
  const wordsToAdd = []
  let result

  try {
    for(let i = 0; i < words.length; i++) {
      const word = words[i]
      const recordExists = await db.collection('words').findOne({ word })
  
      if(!recordExists) {
        wordsToAdd.push({
          word,
          sorted: sortByLetter(word),
          isProper: isProper(word),
          length: word.length
        })
      }
    }
    
    if(wordsToAdd.length) {
      await db.collection('words').insertMany(wordsToAdd)
    }

    result = buildResponse(
      200,
      `${wordsToAdd.length} word(s) succesfully added to the dictionary. ${words.length} word(s) already existed in the dictionary.`,
      words
    )
  }
  catch(err) {
    console.error(`Error in insertWords for ${words}: ${err}`)
    result = buildResponse(
      500,
      `An error occurred: ${err}`
    )
  }

  return result
}

/**
 * Takes an array of words and determines if they are all
 * anagrams of eachother. This is determined by finding the
 * sorted value of the first word and using that value as a filter
 * condition. If the length of the source array and the filtered
 * array match, the words were all anagrams.
 * 
 * Returns boolean that represents whether all the supplied words 
 * are anagrams of eachother
 */
export function wordsAreAnagrams(words = []) {
  let result

  if(words.length <= 1) {
    result = true;
  } else {
    const firstWordSorted = sortByLetter(words[0])
    const sortedWords = words.filter(word => firstWordSorted === sortByLetter(word))

    result = words.length === sortedWords.length
  }

  let message = words.length > 1 ? 
    `The words ${result ? 'are' : 'are not'} anagrams.` : 
    'Less than two words supplied. Please pass in an array of 2 or more words in the request body.'

  return buildResponse(
    200,
    message,
    words
  )
}