const express = require('express')
const app = express()
const cors = require('cors')
const port = 5000
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://samisiam851:IzxHVRpaCCZiyoO9@cluster0.lkouiuy.mongodb.net/?retryWrites=true&w=majority";

const corsConfig = {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}
app.use(cors(corsConfig))
app.options("", cors(corsConfig))

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get('/', (req, res) => {
    res.send('user server running')
})

async function run() {
    try {

        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const database = client.db("ElectraHaven")
        const products = database.collection("products")



        app.get('/products', async (req, res) => {
            let cursor = products.find();
            let result = await cursor.toArray();
            console.log(result);
            res.send(result);

        })

        app.get('/products/inverter', async (req, res) => {
            const query = { type: 'inverter' };
            let cursor = products.find(query);
            let result = await cursor.toArray();
            console.log(result);
            res.send(result);
        })
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: id };
            let result = products.findOne(query);
            console.log(result);
            res.send(result);
        })

        app.get('/products/solar-panel', async (req, res) => {
            const query = { type: 'solar panel' };
            let cursor = products.find(query);
            let result = await cursor.toArray();
            console.log(result);
            res.send(result);
        })





    } finally {

        //   await client.close();
    }
}

run().catch(console.dir);



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})