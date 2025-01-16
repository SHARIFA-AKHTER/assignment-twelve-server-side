const express = require('express');
const app = express();
require('dotenv').config()
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000

//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5di9a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("ManageMate").collection("users");
    const  requestsCollection = client.db("ManageMate").collection("requests");
    const  extraCollection = client.db("ManageMate").collection("extra");

     // users related api
     app.get("/users", async (req, res) => {
        const result = await userCollection.find().toArray();
        res.send(result);
      });

       //  requests api
       app.get("/requests", async (req, res) => {
        const result = await requestsCollection.find().toArray();
        res.send(result);
      });

       app.get("/extra", async (req, res) => {
        const result = await extraCollection.find().toArray();
        res.send(result);
      });
    

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req, res) =>{
    res.send('ManageMate server is up and running!')
})

app.listen(port, () =>{
    console.log(`ManageMate server is live on port ${port}`)
})

