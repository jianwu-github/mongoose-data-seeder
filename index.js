/**
 * @fileOverview MongooseDataSeeder is a utitly class to seed new MongoDB with a set of collections using Mongoose
 *
 * This code is refactored from {@link https://github.com/SamVerschueren/mongoose-seeder/blob/master/test/models/User.js|mongoose-seeder} by {@link https://github.com/SamVerschueren|Sam Verschueren}
 *
 * @author Jian Wu
 */
const mongoose = require('mongoose')
const vm = require('vm')

class MongooseDataSeeder {
  constructor (dropCollection = false) {
    this.dropCollection = dropCollection

    this.chunks = {}
    this.sandbox = vm.createContext()

    this.clearChunks = this.clearChunks.bind(this)
    this.cloneDeep = this.cloneDeep.bind(this)
    this.asyncSeries = this.asyncSeries.bind(this)
    this.done = this.done.bind(this)
    this.requireDeps = this.requireDeps.bind(this)
    this.parseValue = this.parseValue.bind(this)
    this.unwind = this.unwind.bind(this)
    this.findReference = this.findReference.bind(this)
    this.seed = this.seed.bind(this)
    this.load = this.load.bind(this)
  }

  clearChunks() {
    this.chunks = {}
  }

  cloneDeep(obj) {
    return JSON.parse(JSON.stringify(obj))
  }

  asyncSeries(tasks) {
    if (!(tasks instanceof Array) || tasks.length === 0) {
      return Promise.reject(new Error(`Please pass tasks array into this function.`))
    }

    try {
      if (tasks.length === 1) {
        return tasks[0].call(this, 1)
      }

      tasks = tasks.reduce((task, nextTask, index) => {
        if (index === 1) {
          task = typeof task === 'function'
            ? task.call(this, index)
            : Promise.resolve(task)
        }

        return task.then(() => typeof nextTask === 'function'
          ? nextTask.call(this, index + 1)
          : Promise.resolve(nextTask))
      })
    } catch (err) {
      return Promise.reject(err)
    }
    return tasks
  }

  done(err, result) {
    return err
      ? Promise.reject(err)
      : Promise.resolve(result)
  }

  /**
   * This method downloads all dependencies if there are any.
   * The dependencies are defined by field _dependencies of the source
   * object with data
   *
   * @param data The data that should be seeded.
   */
  requireDeps(data) {
    try {
      const deps = data._dependencies
      // Remove the dependencies property
      delete data._dependencies

      if (!deps) {
        return
      }

      Object.entries(deps).forEach(([key, value]) => {
        // Do nothing if the dependency is already defined
        if (this.sandbox[key]) {
          return
        }

        this.sandbox[key] = module.parent.require(value)
      })

      return
    } catch (err) {
      return err
    }
  }

  /**
   * Parsing the given value in parent.
   *
   * If the value is an object it will unwind that object as well.
   *
   * If the value is a reference (value starting with ->), then it will
   * find the reference to that object.
   *
   * @param parent
   * @param value
   * @returns parsed value
   */
  parseValue(parent, value) {
    if (typeof value === 'object' && !(value instanceof Array)) {
      return this.unwind(value)
    } else if (value instanceof Array) {
      return value.map(val => this.parseValue(parent, val))
    } else if (typeof value === 'string' && ~value.indexOf('=')) {
      // Evaluate the expression
      try {
        // Assign the object to the _this property
        // Create a new combined context
        const context = vm.createContext(Object.assign({
          '_this': parent
        }, this.sandbox))

        // Run in the new context
        return vm.runInContext(value.substr(1).replace(/this\./g, '_this.'), context)
      } catch (err) {
        return value
      }
    } else if (typeof value === 'string' && ~value.indexOf('->')) {
      return this.findReference(value.substr(2))
    }

    return value
  }

  /**
   * Unwinding an object and iterates over every property in the object.
   *
   * It will then parse the value of the property in order to search for references
   * and make a reference to the correct object.
   *
   * @param modelData
   */
  unwind(modelData) {
    return Object.keys(modelData)
      .map(key => {
        return {[key]: this.parseValue(modelData, modelData[key])}
      })
      .reduce((items, item) => {
        return Object.assign(items, item)
      }, {})
  }

  /**
   * Finding the _id associated with the object represented by the reference provided.
   *
   * @param ref The string representation of the reference
   */
  findReference(ref) {
    const keys = ref.split('.')
    let key = keys.shift()
    let result = this.chunks[key]

    if (!result) {
      throw new TypeError(`Could not read property "${key}" from undefined`)
    }

    // Iterate over all the keys and find the property
    while ((key = keys.shift())) {
      result = result[key]
    }

    if (typeof result === 'object' && !(result instanceof Array)) {
      // Test if the result we have is an object. This means the user wants to reference
      // to the _id of the object.
      if (!result._id) {
        // If no _id property exists, throw a TypeError that the property could not be found
        throw new TypeError(`Could not read property "_id" of ${JSON.stringify(result)}`)
      }

      return result._id
    }

    return result
  }

  /**
   * Seeding the MongoDB with given collections
   *
   * @param data
   */
  seed(data) {
    const depsErr = this.requireDeps(data)

    if (depsErr) {
      return Promise.reject(depsErr)
    }

    const tasks = Object.keys(data).map(key => () => {
      this.chunks[key] = {}
      const value = data[key]

      try {
        if (!value._model) {
          // Throw an error if the model could not be found
          throw new Error('Please provide a _model property that describes which database model should be used.')
        }

        const modelName = value._model

        // Remove model and unique properties
        delete value._model

        // retrieve the model depending on the name provided
        const Model = mongoose.model(modelName)

        return Promise.resolve()
          .then(() => {
            if (this.dropCollections) {
              // Drop the collection
              return mongoose.connection.db
                .listCollections({name: Model.collection.name}).toArray()
                .then(collections => {
                  const isExitst = collections.length > 0

                  return isExitst
                    ? mongoose.connection.dropCollection(Model.collection.name)
                    : Promise.resolve()
                })
            }

            return Promise.resolve()
          })
          .then(() => {
            const innerTasks = Object.keys(value).map(innerKey => () => {
              const modelData = value[innerKey]
              const items = this.unwind(modelData)

              if (Model.schema.paths['_id']) {
                // If the schema has "_id" field and seed data did not populate "_id" field,
                // we'll populate this "_id" field using mongoose ObjectId.
                if (!items['_id']) {
                  items['_id'] = mongoose.Types.ObjectId()
                }
              }

              // Create the model
              return Model.create(items)
                .then(result => {
                  this.chunks[key][innerKey] = result

                  return Promise.resolve()
                })
            })

            return this.asyncSeries(innerTasks)
          })
      } catch (err) {
        // If the model does not exist, stop the execution
        return Promise.reject(err)
      }
    })

    return this.asyncSeries(tasks)
      .then(() => {
        return this.done(null, this.chunks)
      })
      .catch(err => this.done(err))
  }

  load(data) {
    return this.seed(this.cloneDeep(data))
  }

}

module.exports = MongooseDataSeeder
