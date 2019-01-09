const mongoose = require('mongoose')

const dbUrl = 'mongodb://mongoadmin:welcome@localhost:27017/?authMechanism=DEFAULT&authSource=admin'

// create or import mongoose schema
const UserSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  firstName: {type: String, required: true},
  name: {type: String, required: true},
  fullName: {type: String},
  email: {type: String, required: true},
  birthday: {type: Date}
})

mongoose.model('User', UserSchema)

// connect to MongoDB
mongoose.connect(dbUrl, {dbName: 'test', autoIndex: false}, function(err){
  if (err) {
    console.log(`Failed to connect to MongoDB at ${dbUrl}`)
    console.log(err)
    process.exit(1)
  } else {
    console.log("Connected to MongoDB, Prepare to seed data ...")

    const seedData = require('./data')

    const MongooseDataSeeder = require('../index')
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

