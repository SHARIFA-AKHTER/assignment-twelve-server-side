const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 3000;
const stripe= require('stripe')(process.env.STRIPE_SECRET_KEY)

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
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("ManageMate").collection("users");
    const requestsCollection = client.db("ManageMate").collection("requests");
    const extraCollection = client.db("ManageMate").collection("extra");
    const pendingCollection = client.db("ManageMate").collection("pending");
    const mostRequestedCollection = client.db("ManageMate").collection("mostRequested");
    const limitedStockCollection = client.db("ManageMate").collection("limitedStock");
    const pieChartCollection = client.db("ManageMate").collection("pieChart");
    const birthdaysCollection = client.db("ManageMate").collection("birthdays");
    const assetsCollection = client.db("ManageMate").collection("assets");

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

    // Hr-pending
    app.get("/pending", async (req, res) => {
      const result = await pendingCollection.find().toArray();
      res.send(result);
    });

    // mostRequested
    app.get("/mostRequested", async (req, res) => {
      const result = await mostRequestedCollection.find().toArray();
      res.send(result);
    });

    // limited stock
    app.get("/limitedStock", async (req, res) => {
      const result = await limitedStockCollection.find().toArray();
      res.send(result);
    });

    // // pieChart
    // app.get("/pieChart", async (req, res) => {
    //   const result = await pieChartCollection.find().toArray();
    //   res.send(result);
    // });

    app.get("/pieChart", async (req, res) => {
      try {
        console.log("Fetching data from pieChart collection...");
        const result = await pieChartCollection.find().toArray();
        console.log("Result:", result);  
        res.send(result);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
      }
    });

    // birthdays
    app.get("/birthdays", async (req, res) => {
      const result = await birthdaysCollection.find().toArray();
      res.send(result);
    });

    // assets
    app.get("/assets", async (req, res) => {
      const result = await assetsCollection.find().toArray();
      res.send(result);
    });

    // return
    app.patch("/assets/return/:id", async (req, res) => {
      const { id } = req.params;
    
      try {
        const asset = await assetsCollection.findById(id);
    
        if (!asset || asset.status !== "approved" || asset.assetType !== "returnable") {
          return res.status(400).json({ message: "Cannot return this asset" });
        }
    
        asset.status = "returned";
        await asset.save();
        res.json({ message: "Asset returned successfully" });
      } catch (error) {
        res.status(500).json({ message: "Error returning asset", error });
      }
    });

    // Cancel an asset request
    app.patch("/assets/cancel/:id", async (req, res) => {
      const { id } = req.params;

      try {
        // Find the asset by ID
        const asset = await assetsCollection.findOne({ _id: new ObjectId(id) });

        if (!asset || asset.status !== "pending") {
          return res
            .status(400)
            .json({ message: "Cannot cancel this request" });
        }

        // Update the asset status to "cancelled"
        const result = await assetsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: "cancelled" } }
        );

        if (result.modifiedCount === 1) {
          res.json({ message: "Request cancelled successfully" });
        } else {
          res.status(400).json({ message: "Failed to cancel request" });
        }
      } catch (error) {
        res.status(500).json({ message: "Error cancelling request", error });
      }
    });

   //payment intent
   app.post('/create-payment-intent', async(req, res)=>{
    const {price} =req.body;
    const amount = parseInt(price * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      payment_method_types: ['card']
    })
    res.send({
      clientSecret: paymentIntent.client_secret
    })
   })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("ManageMate server is up and running!");
});

app.listen(port, () => {
  console.log(`ManageMate server is live on port ${port}`);
});
