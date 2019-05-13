const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://tianzhu:mimipao123%2C.%2F@cluster0-ekakp.mongodb.net/test?retryWrites=true";
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  console.log(collection);
  // perform actions on the collection object
  client.close();
});