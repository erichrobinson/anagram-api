import bodyParser from 'body-parser'
import express from 'express'
import { MongoClient } from 'mongodb'
import { deleteWord, getAnagrams, getStats, insertWords, wordsAreAnagrams } from './utilities/queries'

MongoClient.connect('mongodb://localhost:27017/', (err, db) => {
  const anagramApi = db.db('anagram-api')
  const app = express()
  const port = 3000

  app.use(bodyParser.json())
  app.listen(port, () => console.log(`App listening on port: ${port}`))

  app.post('/anagrams', (req, res) => {
    const result = wordsAreAnagrams(req.body.words)
    res.send(`Words are all anagrams?: ${result}`)
  })

  // this endpoint is slow
  app.get('/stats', async (req, res) => {
    const stats = await getStats(anagramApi)
    res.send(`${JSON.stringify(stats)}`)
  })

  // challenge: don't insert words that already exist...checking for the existence of the record
  app.post('/words', async (req, res) => {
    const result = await insertWords(anagramApi, req.body.words)
    res.send(result)
    // res.send(`Number of documents inserted: ${result.insertedCount}`)
  })

  app.delete('/words/:word', async (req, res) => {
    const result = await deleteWord(anagramApi, req.params.word, req.query.deleteAnagrams)
    res.send(`Number of documents deleted: ${result.deletedCount}`)
  })

  // may need to filter out words that are alike but proper "god" and "God"
  // handle word not found
  app.get('/words/:word', async (req,res) => {
    const anagrams = await getAnagrams(anagramApi, req.params.word, req.query.excludeProper, req.query.limitResults)
    res.send(anagrams)
  })
})
