const command = require('commander')
const mongoose = require('mongoose')

const MongooseDataSeeder = require('./index')

const dbUrl = 'mongodb://mongoadmin:welcome@localhost:27017/?authMechanism=DEFAULT&authSource=admin'

// create or import mongoose schema
const TeamSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: {type: String, required: true},
  company: {type: String},
})

mongoose.model('teams', TeamSchema)

const UserSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  firstName: {type: String, required: true},
  name: {type: String, required: true},
  fullName: {type: String},
  email: {type: String, required: true},
  birthday: {type: Date},
  teamId: {type: mongoose.Schema.Types.ObjectId, ref: 'teams'}
})

mongoose.model('users', UserSchema)

command
  .version('1.0.0')
  .option('-d --data [jsonfile]', 'seed data in json file')
  .parse(process.argv)

const jsonDataFile = command.data ? command.data : './data.json'
const dropCollection = true

// connect to MongoDB
mongoose.connect(dbUrl, {dbName: 'test', autoIndex: false}, function(err){
  if (err) {
    console.log(`Failed to connect to MongoDB at ${dbUrl}`)
    console.log(err)
    process.exit(1)
  } else {
    console.log(`Connected to MongoDB, Prepare to load seed data from ${jsonDataFile} ...`)

    const seedData = require(jsonDataFile)

    const mongoSeeder = new MongooseDataSeeder({dropCollection: true})

    mongoSeeder
      .load(seedData)
      .then(function(dbData) {
        console.log("seedData is loaded into test database!")
        console.log(dbData)

        process.exit(0)
      })
      .catch(function(err) {
        console.log("Failed to load seedData into test database")
        console.log(err)

        process.exit(0)
      })
  }
})

