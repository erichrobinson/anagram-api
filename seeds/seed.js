import fs from 'fs'
import { Db, MongoClient } from 'mongodb'
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
  try {
    const anagramApi = db.db('anagram-api')
    const collections = await anagramApi.collections()

    if(collections.length) {
      anagramApi.dropDatabase()
    } 

    console.log('Seeding database. This could take a few seconds...')
    const result = await db.db('anagram-api').collection('words').insertMany(generateSeedData())
    const index = await anagramApi.collection('words').createIndex({ sorted: 1, isProper: 1, length: 1 })
    console.log(`Number of documents inserted: ${result.insertedCount}\nIndex created: ${index}`)
    
    db.close()
  } catch(err) {
    console.error(`Error seeding DB: ${err}`)
  }
})
