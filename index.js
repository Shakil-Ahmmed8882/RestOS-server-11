const express = require("express");
const app = express();
var jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const cors = require("cors");
const cookieParser = require("cookie-parser");
ACCESS_TOKEN = '4309dc9bbdfd1b9140ac84fc1678da930b2996d5f3143c41998df82a597b3c939747514b88dc019b1a73f3f610f0fcb2caad09f60cd82728a033238556491c27'

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
  console.log(token)
  if (!token) {
    res.status(401).send({ message: "Unauthorized access" });
  }
  jwt.verify(token, ACCESS_TOKEN, (err, decoded) => {
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
      const size = parseInt(req.query.size) || 9; 

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
      app.get("/food/:id", verifyToken, async (req, res) => {

      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await foodColleciton.findOne(query);
      res.send(result);
    });

    // added food collection
    app.get("/added-food", async (req, res) => {
      try {
        const { email } = req.query;
        const { id } = req.query;

        let query = {}

        if(email){
           query = {add_by:email}
        }

        if(id){
          query = {_id:new ObjectId(id)}
        }



        const result = await addedFoodCollection
          .find(query)
          .toArray();
          console.log(result)
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    // Get Ordered list
    app.get("/ordered-list", async (req, res) => {
      const {email} = req.query
      try {
        const result = await orderedList.find({email:email}).toArray()
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    // get single data to update
    app.get('/food/:name',async(req,res)=>{
      const {name} = req.params

      console.log(name)

      const result = await foodColleciton.findOne({_id:new ObjectId(id)})
      res.send(result)
    })


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

      const isExist = await orderedList.findOne({email:food.email,foodName:food.foodName})
      
      if(isExist){
        return res.send({isExist:true})
      } 
      const result = await orderedList.insertOne(food);
      res.send(result);
    });


    // update food
    app.put('/update-food/:id',async(req,res)=>{
      const {id} = req.params
      const food = req.body

      const optionns = {upsert:true}
      const updatedDoc = {
        $set: {
          name:food.name,
          img:food.img,
          category:food.category,
          price:food.price,
          quantity:food.quantity,
          add_by:food.add_by,
          origin:food.origin,
          description:food.description,
          orderedDate:food.orderedDate,
          email:food.email,
          foodCategory:food.foodCategory,
          foodImage:food.foodImage,
          foodName:food.foodName,
          food_origin:food.food_origin,
          made_by:food.made_by,
          orders:food.orders,
        },
      };
        const result = await addedFoodCollection.updateOne({_id:new ObjectId(id)},updatedDoc,optionns)
        res.send(result)

      })

    // update orders count
    app.patch("/modify-orders", async (req, res) => {
      const { id } = req.body;
      const orders = req.body.orders;
      // const orders = req.body.orders
      console.log('orders is ', orders);

      const query = { _id: new ObjectId(id) };

      const updatedDoc = {
        $set: {
          orders: orders,
        },
      };
      const result = await foodColleciton.updateOne(query, updatedDoc);
      res.send(result);
      });


    // delete ordered food
    app.delete('/cancel-ordered-food/:id',async(req,res)=> {
      const {id} = req.params


      const result = await orderedList.deleteOne({_id:new ObjectId(id)})
      res.send(result)
    })




    //  Authetication
    app.post('/jwt',async(req,res)=>{
      const user = req.body

      const token = jwt.sign(user, ACCESS_TOKEN, { expiresIn: '1h' });
      res
      .cookie('token',token,{
        httpOnly:true,
        secure:false
      }).send({success:true})
    })

  

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
