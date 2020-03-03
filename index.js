import bodyParser from 'body-parser'
import express from 'express'
import { MongoClient } from 'mongodb'
import { deleteWord, getAnagrams, getStats, insertWords, wordsAreAnagrams } from './queries'

MongoClient.connect('mongodb://localhost:27017/', (err, db) => {
  const anagramApi = db.db('anagram-api')
  const app = express()
  const port = 3000

  app.use(bodyParser.json())
  app.listen(port, () => console.log(`App listening on port: ${port}`))

  app.post('/checkWords', async (req, res) => {
    const result = await wordsAreAnagrams(req.body.words)
    res.send(`Words are all anagrams?: ${result}`)
  })

  // this endpoint is slow
  app.get('/stats', async (req, res) => {
    const stats = await getStats(anagramApi)
    res.send(`${JSON.stringify(stats)}`)
  })

  // don't insert if it already exists
  // notify of records not inserted
  app.post('/words', async (req, res) => {
    console.log('req', req.body)
    const result = await insertWords(anagramApi, req.body.words)
    res.send(`Number of documents inserted: ${result.insertedCount}`)
  })

  // handle query param better
  // handle word not found
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
