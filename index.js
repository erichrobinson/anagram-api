import bodyParser from 'body-parser'
import express from 'express'
import { MongoClient } from 'mongodb'
import { isProper, sortByLetter } from './utilities/helpers'

MongoClient.connect('mongodb://localhost:27017/', (err, db) => {
  const anagramApi = db.db('anagram-api')
  const app = express()
  const port = 3000

  app.use(bodyParser.json())
  app.listen(port, () => console.log(`App listening on port: ${port}`))

  // this endpoint is slow
  app.get('/stats', async (req, res) => {
    async function getMedianWordLength(wordCount) {
      const sorted = await anagramApi.collection('words').find().sort( { length: 1 } ).toArray()
      const middleIndex = wordCount / 2
      let median
      
      if(wordCount % 2 === 0) {
        median = (sorted[middleIndex].length + sorted[middleIndex + 1].length) / 2
      } else {
        median = sorted[Math.round(middleIndex)]
      }

      return median
    }
    
    const stats = {}
    const aggregateData = await anagramApi.collection('words').aggregate([{
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

    stats.numberOfWords = await anagramApi.collection('words').countDocuments();
    stats.averageWordLength = +aggregateData[0].average.toFixed(1)
    stats.minWordLength = aggregateData[0].min
    stats.maxWordLength = aggregateData[0].max
    stats.medianWordLength = await getMedianWordLength(stats.numberOfWords)

    res.send(`${JSON.stringify(stats)}`)
  })

  // don't insert if it already exists
  // notify of records not inserted
  app.post('/words', async (req, res) => {
    const wordsToAdd = req.body.words.map(word => {
      return {
        word: word,
        sorted: sortByLetter(word),
        isProper: isProper(word)
      }
    })
    
    const result = await anagramApi.collection('words').insertMany(wordsToAdd)
    res.send(`Number of documents inserted: ${result.insertedCount}`)
  })

  // handle query param better
  // handle word not found
  app.delete('/words/:word', async (req, res) => {
    const deleteAnagrams = req.query.deleteAnagrams
    let response

    if(deleteAnagrams) {
      response = await anagramApi.collection('words').deleteMany({ sorted: sortByLetter(req.params.word) })
    } else {
      response = await anagramApi.collection('words').deleteOne({ word: req.params.word })
    }

    res.send(`Number of documents deleted: ${response.deletedCount}`)
  })

  // may need to filter out words that are alike but proper "god" and "God"
  // handle word not found
  app.get('/words/:word', async (req,res) => {
    const anagrams = await anagramApi.collection('words').find({
      word: { $ne: req.params.word },
      sorted: sortByLetter(req.params.word)
    }).toArray()

    res.send(anagrams.map(record => record.word))
  })
})
