const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin : [
        "http://localhost:3000","https://inventory-management-two-sigma.vercel.app"

    ],
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
    
    app.post('/jwt', async (req,res)=>{
        const user = req.body;
        const token = jwt.sign(user , process.env.ACCESS_TOKEN_SECRET , {expiresIn : '1h'});
        res.send({token});
    })

    // middlewere
    const verifyToken = (req,res,next)=>{
        // console.log('inside the token',req.headers);
        // console.log('requiatst stle',req);
        if(!req.headers.authorization){
            return res.status(401).send({message: 'unauthorize access athorization'})
        }
        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
        if(err){
          return res.status(401).send({message: 'unauthorize access'})
        }
        req.decoded = decoded;
        // console.log('decode',decoded)
        next();
      })
    }

    // use verify admin after verifyToken
    const verifyAdmin = async(req,res,next)=>{
    const email = req.decoded.email;
    const query = {email : email};
    const user = await userCollection.findOne(query);
    const isAdmin = user?.role === 'admin';
    if(!isAdmin){
        return res.status(403).send({message: 'forbiden access'});
    }
    // console.log('admin re role t--',user?.role, 'kp',email,'inds',user)
    next()
    }

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

    app.get('/isLogged/:email', async (req,res)=>{
        const email = req.params.email;
        const query = {email : email};
        // console.log(email)
        const axistUser = await userCollection.findOne(query)
        // console.log('exis ',axistUser)
        if(axistUser){
            return res.status(200).send(axistUser)
        }
        res.status(401).send({message : "User not found."})
    })

    app.get('/users', async(req,res)=>{
        const result = await userCollection.find().toArray()
        res.send(result)
    })

    app.get('/isAdmin/:user', async(req,res)=>{
        const email = req.params.user;
        // console.log(email)
        const query = { email : email}
        const result = await userCollection.findOne(query)
        res.send(result)
    })

    app.get('/allUsers', async(req,res)=>{
        const result = await userCollection.find().toArray()
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

    app.get('/products', verifyToken,verifyAdmin, async(req, res) => {
        const page = parseInt(req.query.page)
        const size = parseInt(req.query.size)
        const currentPage = page -1;
        const search = req.query?.search;
        const query = {}
 
        const total = await productCollection.countDocuments(query)
        if(search){
           query.name=search;
        }
        const result = await productCollection.find(query)
        .skip(currentPage * size)
        .limit(size)
        .toArray();

        res.send({result,metaData:{
            currentPage : page,
            pageSize : page,
            totalItem : total,
        }});

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