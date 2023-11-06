const express = require("express");
const app = express();
var jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const cors = require("cors");
const cookieParser = require('cookie-parser')


//|| MONGODB connection
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sk8jxpx.mongodb.net/?retryWrites=true&w=majority`;

//middle ware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173","http://localhost:5174"],
    credentials: true,
  })
);
app.use(cookieParser())


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
  }
});

async function run() {
  try {

    //Creating database and colleciton 
    const database = client.db("RestOS");
    const foodColleciton = database.collection("FoodCollection");
    const userCollection = database.collection("Users");
    const addedFoodCollection = database.collection("AddedFoodCollection");



    // GET ALL FOODS
    app.get("/foods", async (req, res) => {
      try{
        const result = await foodColleciton.find().toArray();
        res.send(result);
      }
      catch(err){
        console.log(err)
      }
    });

    // 6 TOP SELLING FOOD
    app.get("/top-selling-food", async (req, res) => {
      try{
        const result = await foodColleciton.find().sort({ orders: -1 }).limit(6).toArray();
        res.send(result);
      }
      catch(err){
        console.log(err)
      }
    });

    // Get single food
    app.get('/food/:id',async(req,res)=> {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      console.log(id)

      const result = await foodColleciton.findOne(query)
      res.send(result)
    })

    // Store user in database
    app.post('/user',async(req,res)=>{
      const user = req.body
      const result = await userCollection.insertOne(user)
      res.send(result)
      
    })

    // Add food item 
    app.post('/add-food',async(req,res)=>{
      const food = req.body
      const result = await addedFoodCollection.insertOne(food)
      res.send(result)      
    })

    // added food collection
    app.get("/added-food", async (req, res) => {
      try {
        const { email } = req.query;
        console.log(email)
        const result = await addedFoodCollection.find({ add_by: email }).toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
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
