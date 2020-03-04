# Getting Started

Pull the project from GitHub: `https://github.com/erichrobinson/anagram-api.git`

Install Homebrew from instructions: `https://brew.sh/`\
Install MongoDB: `brew tap mongodb/brew`

In Terminal, navigate to the the anagram-api project directory

`yarn`\
`yarn run seed-db`\
`yarn run start`

# Testing and API Usage:
During development, all test calls were run through Postman. When passing data into an endpoint through the request body, make sure to supply a valid JSON array and to have the JSON(application/json) option selected

**POST** localhost:3000/anagrams/\
body.words = ['array', 'of', 'words']

**POST** localhost:3000/words/\
body.words = ['array', 'of', 'words']

**GET** localhost:3000/stats/

**GET** localhost:3000/words/:word\
?excludeProper=boolean\
?limitResults=integer

**DELETE** localhost:3000/words/:word\
?deleteAnagrams=boolean

All endpoints follow REST conventions for naming and return values. Responses in the shape:\
<code><pre>
{
status: 200,
message: "Some message",
data: [] || {}
}
</code></pre>

# Implementation Notes
## Tech Details
Light stack featuring Node, Express and MongoDB

MongoDB is the only technology where I considered other solutions. Ultimately, I chose it because I new the data was going to be in a simple structure and I had previous experience. Comfort certainly played a factor and while I haven't actively worked with MongoDB in over a year, I knew it would be easier to implement a solution using it rather than a new technology. 

It's always a fine line between working with technologies you know and being more productive vs experimenting with new platform and taking a temporary productivity hit for unknown gains. Since this was on a tight deadline, I went with a solution I was confident could both deliver the tech requirements and allow me to finish ahead of schedule.

Initially I was using Mongoose as well, but when I was seeding the DB the new model objects weren't being garbage collected quickly enough and the available memory would run out before the seeding finished. Rather than wrestle with Mongoose, I moved on without it. You should never be tied to
using a specific technology just because you have some amount of sunk time.

I considered exploring Redis to help with query speed but my memory issues with Mongoose gave me pause and I was concerned about running into similar issues when dealing with large datasets. Additionally, as I began working through some of the optional endpoints, I wondered if a relational database would have been better. I attempted to build out a basic relationship in MongoDB but creating a secondary collection to hold anagrams, but the seeding process took too long.

I tried to rely primarily on vanilla JS and Mongo's query APIs to achieve most tasks. Using a library like lodash may have made some of the data massaging easier, but for something like this I felt like it was better to stick with the fundamentals.

# Features to Add in the Future
1. Additional collection "anagrams" that would allow for faster lookup and for cleaner implementation of the other optional endpoints
2. Front end "playground" so you can experiment with the API outside in a more user friendly manner
3. More robust handling of proper nouns
4. Better handling of words that have both a proper and common variant i.e. God and god
5. Allow dictionary to be passed in from the CLI or other UI rather than hardcoded
6. Provide some sort of validation for the dictionary before seeding
7. More descriptive messages for API responses
8. Tests


# Tradeoffs, Limitations, Edge cases
1. API response speed vs ensuring data integrity. During the initial implementation, I didn't prevent duplicate records. The API was fast, especially after the initial run. Adding a check to make sure only unique records were inserted caused a big performance hit and is *not* a scalable solution. 
2. API response speed on `/stats` endpoint can take ~4 seconds. Another slow endpoint that is bogged down by the need to iterate over the entire collection multiple times. This would be one of the first issues I tried to solve. My dev machine is older, so this endpoint may be constrained by the CPU. Possible that a different environment could deliver better results. There may also be a way to reduce the complexity to a single iteration.
