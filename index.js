const express = require("express");
const app = express();
var jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const cors = require("cors");
const cookieParser = require("cookie-parser");

//|| MONGODB connection
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sk8jxpx.mongodb.net/?retryWrites=true&w=majority`;

//middle ware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(cookieParser());

// verify token
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    res.status(401).send({ message: "Unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Unathorized access" });
    }
    req.user = decoded;
    next();
  });
};

// Creating a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    //Creating database and colleciton
    const database = client.db("RestOS");
    const foodColleciton = database.collection("FoodCollection");
    const userCollection = database.collection("Users");
    const addedFoodCollection = database.collection("AddedFoodCollection");
    const orderedList = database.collection("OrderedList");

    // GET ALL FOODS (Pagination)
    app.get("/foods", async (req, res) => {
      // getting current page 
      const page = parseInt(req.query.page) || 1; 
      const size = parseInt(req.query.size); 

      const skip = (page - 1) * size;
      

      try {
        const result = await foodColleciton.find().skip(skip).limit(size).toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    // Pagination following 2 routes
    app.get("/total-food-count", async (req, res) => {
      try {
        const totalItems = await foodColleciton.estimatedDocumentCount();
        console.log(totalItems);
        res.send({ count: totalItems });
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Server error" });
      }
    });


    // 6 TOP SELLING FOOD
    app.get("/top-selling-food", async (req, res) => {
      try {
        const result = await foodColleciton
          .find()
          .sort({ orders: -1 })
          .limit(6)
          .toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    // Get single food
    app.get("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await foodColleciton.findOne(query);
      res.send(result);
    });

    // added food collection
    app.get("/added-food", async (req, res) => {
      try {
        const { email } = req.query;
        console.log(email);
        const result = await addedFoodCollection
          .find({ add_by: email })
          .toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    // Check if the order is duplicated
    app.get("/duplicate-order/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await orderedList.findOne({ _id: id }, { _id: 1 });
        if (result) {
          res.send({ matched: true });
        } else {
          res.send({ matched: false });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Server error" });
      }
    });

    // Get Ordered list
    app.get("/ordered-list", async (req, res) => {
      try {
        const result = await orderedList.find().toArray()
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });


    // Store user in database
    app.post("/user", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // Add food item
    app.post("/add-food", async (req, res) => {
      const food = req.body;
      const result = await addedFoodCollection.insertOne(food);
      res.send(result);
    });

    // Add ordered food
    app.post("/add-ordered-food", async (req, res) => {
      const food = req.body;
      console.log(food);
      const result = await orderedList.insertOne(food);
      res.send(result);
    });

    // update orders count
    app.patch("/orders-count", async (req, res) => {
      const { id } = req.body;
      const orders = req.body.orders;
      // const orders = req.body.orders
      console.log(orders);

      const query = { _id: new ObjectId(id) };

      const updatedDoc = {
        $set: {
          orders: orders,
        },
      };
      const result = await foodColleciton.updateOne(query, updatedDoc);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  try {
    res.send("Resturant operating system server is running");
  } catch (err) {
    console.log(err);
  }
});

// Start the server on the specified port.
app.listen(port, () => {
  console.log(`Server is running on port:${port}`);
});
