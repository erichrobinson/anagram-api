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

  // calc min, max, median
  app.get('/stats', async (req, res) => {
    const stats = await anagramApi.collection('words').aggregate([{
      $group: {
        _id: null,
        total: {
          $sum: "$length"
        }
      }
    }]).toArray()

    const documentCount = await anagramApi.collection('words').countDocuments();
    res.send(`docs: ${documentCount}, average: ${stats[0].total / documentCount}`)
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

// function getMedian(words) {
//   //even? odd?
//   const i = Math.round(words.length / 2)
//   let x = words.map(word => {
//     return word.toLowerCase()
//   })

//   console.log(x)
//   return x.sortByLetter()[i].length
// }

// // combine avg and median calls into a single iteration, possibly tied into the initial forEach on the response

// function getAvg(words) {
//   let total = 0;
//   words.forEach(word => {
//     // console.log(word)
//     total += word.length
//   })
//   const length = words.length
//   // console.log(`total: ${total} and length: ${length}`)
//   return total/length
// }

// app.get('/stats', (req, res) => {
//   MongoClient.connect(url, function(err, db) {
//     var dbo = db.db("anagram-api")
//     dbo.collection('words').find().toArray((err, response) => {
//       let min = 1, max = 1, words = []
//       response.forEach(obj => {
//         if(obj.word.length < min) {
//           min = obj.word.length;
//         } else if(obj.word.length > max) {
//           max = obj.word.length
//         }
//         words.push(obj.word)
//       })

//       const stats = {
//         min,
//         max,
//         median: getMedian(words),
//         average: getAvg(words),
//       }

//       res.send(stats)
//     })
//   })
// })
