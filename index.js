import bodyParser from 'body-parser'
import express from 'express'
import { MongoClient } from 'mongodb'
import { deleteWord, getAnagrams, getStats, insertWords, wordsAreAnagrams } from './utilities/queries'

MongoClient.connect('mongodb://localhost:27017/', (err, db) => {
  const anagramApi = db.db('anagram-api')
  const app = express()
  const port = 3000

  app.use(bodyParser.json())
  app.listen(port, () => console.log(`AnagramAPI listening on port: ${port}`))

  app.post('/anagrams', (req, res) => {
    const result = wordsAreAnagrams(req.body.words)
    res.status(result.status).json({
      message: result.message,
      data: result.data
    })
  })

  app.get('/stats', async (req, res) => {
    const result = await getStats(anagramApi)
    res.status(result.status).json({
      message: result.message,
      data: result.data
    })
  })

  app.post('/words', async (req, res) => {
    const result = await insertWords(anagramApi, req.body.words)
    res.status(result.status).json({
      message: result.message,
      data: result.data
    })
  })

  app.delete('/words/:word', async (req, res) => {
    const deleteAnagrams = (!req.query.deleteAnagrams || req.query.deleteAnagrams.toLowerCase() === 'false') ? false : true

    const result = await deleteWord(anagramApi, req.params.word, deleteAnagrams)
    res.status(result.status).json({
      message: result.message
    })
  })

  app.get('/words/:word', async (req,res) => {
    const excludeProper = (!req.query.excludeProper || req.query.excludeProper.toLowerCase() === 'false') ? false : true
    const limitResults = (!req.query.limitResults || +req.query.limitResults === NaN) ? 1000 : +req.query.limitResults
    
    const result = await getAnagrams(anagramApi, req.params.word, excludeProper, limitResults)
    res.status(result.status).json({
      message: result.message,
      data: result.data
    })
  })
})
