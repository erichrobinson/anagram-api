import fs from 'fs'
import { MongoClient } from 'mongodb'
import { isProper, sortByLetter } from '../utilities/helpers'

function generateSeedData() {
  return fs.readFileSync('./dictionaries/default.txt', 'utf8').split('\n').map(word => {
    if(word.length) {
      return {
        length: word.length,
        word: word,
        sorted: sortByLetter(word),
        isProper: isProper(word)
      }
    }
  })
}

MongoClient.connect('mongodb://localhost:27017', async (err, db) => {
  const anagramApi = db.db('anagram-api')

  try {
    await anagramApi.dropCollection('words')
    const result = await anagramApi.collection('words').insertMany(generateSeedData())
    const index = await anagramApi.collection('words').createIndex({ sorted: 1, isProper: 1, length: 1 })
    console.log(`Number of documents inserted: ${result.insertedCount}\nIndex created: ${index}`)
  } catch(err) {
    console.error(`Error seeding DB: ${err}`)
  }

  db.close()
})
