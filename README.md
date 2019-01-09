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

#### Prepare seed data

```json
{
  "users": {
    "_model": "User",
    "foo": {
      "firstName": "Foo",
      "name": "Bar",
      "email": "foo@bar.com"
    }
  }
}
```

#### Using 'mongoose-data-seeder' to load seed data into Mongo database

```JavaScript
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

    const MongooseDataSeeder = require('mongoose-data-seeder')
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

#### Loading seed data with referential relationship

For loading documents that have a reference to another document, please see the original Sam Verschueren's [mongoose-seeder](https://github.com/SamVerschueren/mongoose-seeder) project


### License

MIT © Jian Wu
