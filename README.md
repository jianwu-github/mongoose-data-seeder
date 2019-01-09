# mongoose-data-seeder
This package is refactored from origianl Sam Verschueren's [mongoose-seeder](https://github.com/SamVerschueren/mongoose-seeder) package, I only did minor code change to make it as ES6 class and working with mongoose 5.x.

I need do this refactoring due to an internal MERN project, I publish this package hoping it might be useful for someone who also need seed a MongoDB for his or her project using Node and MongoDB with Mongoose.

## Install
```
$ npm install mongoose-data-seeder
```

## How to use

### Start a local mongo instance using docker and create a 'test' db
```
$ docker run -d --name local-mongo -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=mongoadmin -e MONGO_INITDB_ROOT_PASSWORD=welcome -e MONGO_INITDB_DATABASE=test mongo:3.6
```
