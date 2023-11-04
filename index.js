const express = require("express");
const app = express();
var jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const cors = require("cors");
const cookieParser = require('cookie-parser')

//middle ware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173","http://localhost:5174"],
    credentials: true,
  })
);
app.use(cookieParser())

// MiddleWares
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


//|| MONGODB connection
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://shakilahmmed8882:7aSz3nq3EGaqFdeJ@cluster0.sk8jxpx.mongodb.net/?retryWrites=true&w=majority";

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

    const database = client.db("RestOS");
    const foodColleciton = database.collection("FoodCollection");

    
    app.get("/food", async (req, res) => {
      try{
        const result = await foodColleciton.find().toArray();
        res.send(result);
      }
      catch(err){
        console.log(err)
      }
    });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);


app.get("/", async (req, res) => {
  try{
    res.send('Resturant operating system server is running');
  }
  catch(err){
    console.log(err)
  }
});


// Start the server on the specified port.
app.listen(port, () => {
  console.log(`Server is running on port:${port}`);
});
