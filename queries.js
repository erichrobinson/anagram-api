import { isProper, sortByLetter } from './utilities/helpers'

export async function deleteWord(db, word, deleteAnagrams = false) {
  let result

  if(deleteAnagrams) {
    result = await db.collection('words').deleteMany({ sorted: sortByLetter(word) })
  } else {
    result = await db.collection('words').deleteOne({ word })
  }

  return result
}

export async function getAnagrams(db, word, excludeProper = false, limit = 1000) {
  const query = {
    word: { $ne: word },
    sorted: sortByLetter(word)
  }

  if(excludeProper) query.isProper = false

  const anagrams = await db.collection('words').find(query).limit(limit).toArray()
  return anagrams.map(record => record.word)
}

async function getMedianWordLength(db, wordCount) {
  const sorted = await db.collection('words').find().sort( { length: 1 } ).toArray()
  const middleIndex = wordCount / 2
  let median
  
  if(wordCount % 2 === 0) {
    median = (sorted[middleIndex].length + sorted[middleIndex + 1].length) / 2
  } else {
    median = sorted[Math.round(middleIndex)].length
  }

  return median
}

export async function getStats(db) {
  const stats = {}
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
  
  return stats
}

export async function insertWords(db, words) {
  const wordsToAdd = words.map(word => {
    return {
      word: word,
      sorted: sortByLetter(word),
      isProper: isProper(word)
    }
  })
  
  return await db.collection('words').insertMany(wordsToAdd)
}