# mongoose-data-seeder
This package is refactored from origianl Sam Verschueren's [mongoose-seeder](https://github.com/SamVerschueren/mongoose-seeder) package, I only did minor code change to make it as ES6 class and working with mongoose 5.x.

I need do this refactoring due to an internal MERN project, I publish this package hoping it might be useful for someone who also need seed a MongoDB for his or her project using Node and MongoDB with Mongoose.

## Install
```
$ npm install mongoose-data-seeder
```

## How to use

#### Start a local mongo instance using docker and create a 'test' db
```
$ docker run -d --name local-mongo -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=mongoadmin -e MONGO_INITDB_ROOT_PASSWORD=welcome -e MONGO_INITDB_DATABASE=test mongo:3.6
```

#### Create seed data project
```
$ npm init
```

#### Install required packages
```
$ npm install --save mongo mongoose mongoose-data-seeder commander
```

#### Prepare seed data "data.json" including document referencing another document

```json
{
  "teams": {
    "_model": "teams",
    "teamA": {
      "name": "Team A",
      "company": "Startup"
    }
  },
  "users": {
    "_model": "users",
    "user1": {
      "firstName": "Joe",
      "name": "User One",
      "email": "foo@bar.com",
      "teamId": "->teams.teamA._id"
    }
  }
}
```

If you want to know more about loading documents that have a reference to another document, please see the original Sam Verschueren's [mongoose-seeder](https://github.com/SamVerschueren/mongoose-seeder) project


#### Create test-seeder.js using 'mongoose-data-seeder' to load seed data into Mongo database

```JavaScript
const command = require('commander')
const mongoose = require('mongoose')

const MongooseDataSeeder = require('mongoose-data-seeder')

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
```

#### Running script to load seed data into MongoDB
```
$ node test-seeder.js --data [path to data.json file]
```

### License

MIT © Jian Wu
