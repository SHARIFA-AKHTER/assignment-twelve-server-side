const express = require("express");
const app = express();
require("dotenv").config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

//middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://assignment-twelve-5e80a.web.app/',
    'https://assignment-twelve-5e80a.firebaseapp.com/'
     ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

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
    // await client.connect();

    const userCollection = client.db("ManageMate").collection("users");
    const employeeCollection = client.db("ManageMate").collection("employee");
    const requestsCollection = client.db("ManageMate").collection("requests");
    const extraCollection = client.db("ManageMate").collection("extra");
    const pendingCollection = client.db("ManageMate").collection("pending");
    const mostRequestedCollection = client
      .db("ManageMate")
      .collection("mostRequested");
    const limitedStockCollection = client
      .db("ManageMate")
      .collection("limitedStock");
    const pieChartCollection = client.db("ManageMate").collection("pieChart");
    const birthdaysCollection = client.db("ManageMate").collection("birthdays");
    const assetsCollection = client.db("ManageMate").collection("assets");

    // users related api
    // app.get("/users", async (req, res) => {
    //   const result = await userCollection.find().toArray();
    //   res.send(result);  
    // });

    const getNavbar = (user) => {
      const serviceProviderLogo = "https://i.ibb.co.com/gZR7QnFc/company-logo.png";

      // Declare role
      let role;
      // Determine the role based on userId (you can modify this logic as needed)
      if (parseInt(user.userId) === 1) {
        role = "employee";
      } else if (parseInt(user.userId) === 2) {
        role = "hr_manager";
      } else {
        role = "guest";
      }
      // Set the logo based on the role or company
      const companyLogo = user.company ? `https://i.ibb.co.com/XZc9cpfR/${user.company}-logo-com.jpg` : serviceProviderLogo;

      // Return the navbar based on the role
      if (role === "guest") {
        return { logo: serviceProviderLogo, menu: ["Home", "Join as Employee", "Join as HR Manager", "Login"] };
      } else if (role === "employee") {
        return {
          logo: companyLogo,
          menu: ["Home", "My Assets", "My Team", "Request for an Asset", "Profile"],
          user: { name: user.name, profilePicture: user.profilePicture },
        };
      } else if (role === "hr_manager") {
        return {
          logo: companyLogo,
          menu: ["Home", "Asset List", "Add an Asset", "All Requests", "My Employee List", "Add an Employee", "Profile"],
          user: { name: user.name, profilePicture: user.profilePicture },
        };
      }
      return null;
    };
    app.get("/users", async (req, res) => {
      const userId = parseInt(req.query.userId) || 2;
      console.log("Requested userId:", userId);
      try {

        // Fetch user from DB
        const user = await userCollection.findOne({ userId: userId });

        if (!user) {
          console.log("User not found, returning default guest navbar.");
          return res.json(getNavbar({ userId: 3, name: "Guest", profilePicture: "", company: null }));
        }

        console.log("Fetched User from DB:", user);

        // Get navbar data
        const navbar = getNavbar(user);
        res.json(navbar);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });


    //Auth related apis
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, 'process.env.JWT_SECRET', { expiresIn: '1hr' });
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: false,

        })
        .send({ success: true });
    })


    // Get All Employees
    app.get('/employee', async (req, res) => {
      const result = await employeeCollection.find().toArray();
      res.send(result)
    })
    // Get Single Employee
    app.get('/employee/:id', async (req, res) => {
      const id = req.params.id;
      const employee = await employeeCollection.findOne({ _id: id });
      res.send(employee);
    })

    // Add Employee
    app.post("/employee", async (req, res) => {
      const newEmployee = req.body;
      const result = await employeeCollection.insertOne(newEmployee);
      res.send(result);
    });


    // Update Employee
    app.put("/employee/:id", async (req, res) => {
      const id = req.params.id;
      const updatedEmployee = req.body;
      const result = await employeeCollection.updateOne(
        { _id: id },
        { $set: updatedEmployee }
      );
      res.send(result);
    });

    app.delete("/employee/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await employeeCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
          res.send({ success: true, message: "Employee deleted successfully" });
        } else {
          res.status(404).send({ success: false, message: "Employee not found" });
        }
      } catch (error) {
        res.status(500).send({ success: false, message: "Server error", error });
      }
    });

    // addEmplyeeFor
    app.get("/unaffiliated-employees", async (req, res) => {
      const employees = await employeeCollection.find({ company: null }).toArray();
      res.send(employees);
    });

    app.post("/add-employees", async (req, res) => {
      const { employeeIds } = req.body;
      await employeeCollection.updateMany(
        { _id: { $in: employeeIds } },
        { $set: { company: "HR_MANAGER_COMPANY" } }
      );
      res.send({ message: "Employees added successfully!" });
    });


    // ✅ Get All Requests (with optional search filter)
    app.get("/requests", async (req, res) => {
      try {
        const searchQuery = req.query.search || "";
        const filter = searchQuery
          ? {
            $or: [
              { requesterName: { $regex: searchQuery, $options: "i" } },
              { requesterEmail: { $regex: searchQuery, $options: "i" } },
            ],
          }
          : {};

        const result = await requestsCollection.find(filter).toArray();
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch requests" });
      }
    });


    // ✅ Update Request Status
    app.patch("/requests/:id", async (req, res) => {
      try {
        const { status } = req.body;
        const id = req.params.id;

        const result = await requestsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "Request not found or update failed" });
        }

        res.json({ message: `Request ${status} successfully` });
      } catch (error) {
        res.status(500).json({ error: "Failed to update request status" });
      }
    });


    // ✅ Add New Request
    app.post("/requests", async (req, res) => {
      try {
        const newRequest = req.body;
        const result = await requestsCollection.insertOne(newRequest);
        res.json({ message: "Request added successfully", requestId: result.insertedId });
      } catch (error) {
        res.status(500).json({ error: "Failed to add request" });
      }
    });

    // Fetch Pending Requests
    app.get("/pending", async (req, res) => {
      try {
        const result = await pendingCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch pending requests" });
      }
    });

    // Approve Request
    app.put("/pending/:id", async (req, res) => {
      try {
        const result = await pendingCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { status: "Approved" } }
        );
        res.json({ message: "Request Approved", result });
      } catch (error) {
        res.status(500).json({ error: "Failed to approve request" });
      }
    });

    // Reject Request (Delete)
    app.delete("/pending/:id", async (req, res) => {
      try {
        await pendingCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ message: "Request Rejected and Deleted Successfully" });
      } catch (error) {
        res.status(500).json({ error: "Failed to reject request" });
      }
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

    // profile
    app.put("/users/update-profile/:userId", async (req, res) => {
      const { userId } = req.params;
      const { fullName } = req.body;

      try {
        // Find the user by ID and update the fullName
        const user = await userCollection.findOneAndUpdate(
          { _id: userId },
          { $set: { fullName } },
          { new: true }
        );

        if (!user) {
          return res
            .status(404)
            .json({ success: false, message: "User not found" });
        }

        res.json({
          success: true,
          message: "Profile updated successfully",
          user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
          },
        });
      } catch (error) {
        console.error("Error updating profile:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    });

    // Get all assets
    app.get("/assets", async (req, res) => {
      try {
        const { name, status, assetType } = req.query;

        // Build query based on filters
        const query = {};
        if (name) query.assetName = { $regex: name, $options: "i" };
        if (status) query.status = status;
        if (assetType) query.assetType = assetType;

        const result = await assetsCollection.find(query).toArray();
        res.json(result);
      } catch (error) {
        res.status(500).json({ message: "Error fetching assets", error });
      }
    });

    //  Update API
    app.put("/assets/:id", async (req, res) => {
      try {
        const updatedAsset = await assetsCollection.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true }
        );

        if (!updatedAsset) {
          return res.status(404).json({ message: "Asset not found" });
        }

        res.json(updatedAsset);
      } catch (error) {
        res.status(500).json({ error: "Update failed" });
      }
    });
    app.delete("/assets/:id", async (req, res) => {
      try {
        const assetId = new ObjectId(req.params.id);
        const deletedAsset = await assetsCollection.deleteOne({ _id: assetId });

        if (deletedAsset.deletedCount === 0) {
          return res.status(404).json({ message: "Asset not found" });
        }

        res.json({ message: "Asset deleted successfully" });
      } catch (error) {
        res.status(500).json({ error: "Delete failed" });
      }
    });
    // Add assets post
    app.post("/assets", async (req, res) => {
      try {
        const { name, type, quantity } = req.body;

        if (!name || !type || !quantity) {
          return res.status(400).json({ message: "All fields are required" });
        }

        const newAsset = { name, type, quantity: parseInt(quantity) };
        const result = await assetsCollection.insertOne(newAsset);

        res.status(201).json({ message: "Asset added successfully", asset: result });
      } catch (error) {
        res.status(500).json({ error: "Failed to add asset" });
      }
    });

    //payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.get("/extra", async (req, res) => {
      try {
        const extras = await extraCollection.find().toArray();
        res.json(extras);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch extra sections", error: err.message });
      }
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
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
