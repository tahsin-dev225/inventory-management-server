const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin : ["http://localhost:3000"],
    credentials:true
  }));
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.udxqu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();
    const userCollection = client.db("inventory-management").collection("users");
    const productCollection = client.db("inventory-management").collection("products");
    

    app.post('/users', async(req,res)=>{
        const user = req.body;
        const query = {email : user.email};
        const axistUser = await userCollection.findOne(query)
        if(axistUser){
            return res.status(401).send({message : "User already axist"})
        }
        const result = await userCollection.insertOne(user);
        res.send(result)
    })

    app.get('/users', async(req,res)=>{
        const result = await userCollection.find().toArray()
        res.send(result)
    })

    app.get('/isAdmin/:user', async(req,res)=>{
        const email = req.params.user;
        console.log(email)
        const query = { email : email}
        const result = await userCollection.findOne(query)
        res.send(result)
    })

    app.post('/products', async (req,res)=>{
        const product = req.body;
        const newName = product.name;
        const query = {name : newName}
        const matchedName = await productCollection.findOne(query)
        if(matchedName){
            return res.status(409).send({message : "This product name exist name should be uniqe."})
        }
        const result = await productCollection.insertOne(product)
        res.send(result)
    })

    // app.get('/products', async (req,res)=>{
    //     const result = await productCollection.find().toArray();
    //     res.send(result)
    // })
    
    // app.get('/products/:name', async (req,res)=>{
    //     const name = req.params.name;
    //     const query = {name : name}
    //     const result = await productCollection.findOne(query)
    //     res.send(result)
    // })

    app.get('/products', async(req, res) => {
        const page = parseInt(req.query.page - 1)
        const size = parseInt(req.query.size)
  
        console.log('pagination', page, size)
        const result = await productCollection.find()
        .skip(page * size)
        .limit(size)
        .toArray();
        res.send(result);
      })

} finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req,res) =>{
    res.send('Inventory is running ');
});

app.listen(port , ()=>{
    console.log(`Inventory is running on port : ${port}`)
})