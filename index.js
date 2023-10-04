const express = require('express')
const { ObjectId } = require('mongodb');
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const port = 5000
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://samisiam851:IzxHVRpaCCZiyoO9@cluster0.lkouiuy.mongodb.net/?retryWrites=true&w=majority";

////////////////////////////////////////// JWT verification //////////////////////////////////////////////////
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, 'dafea91334ce03e49042a919e62de4bd212fc5d3c5c1e08656122279bb16bbadca7be7506441ff2e209f59235ab8dc4eb21ee5ae96d9816168c68e22ed9247d9', (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}



//////////////////////////////////// CORS & body parser  Middleware//////////////////////////////////////////////////////



const corsConfig = {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}
app.use(cors(corsConfig))
app.options("", cors(corsConfig))





app.use(bodyParser.json());



/////////////////////////////////// MONGODB client creation /////////////////////////////////////////////////////////// 
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
        const usersCollection = database.collection("users")
        const cart = database.collection("cart")
        const ordersCollection = database.collection("orders")

        ///////////////////////////////////////////// USERS /////////////////////////////////////////////////
        app.post('/users', async (req, res) => {
            const { fname, lname, phone, email, photoURL, role } = req.body;
            const user = {
                fname: fname,
                lname: lname,
                phone: phone,
                email: email,
                photoURL: photoURL,
                role: role
            }

            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: 'user already exists', data: existingUser })
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const userData = await usersCollection.findOne({ email: email });
            res.send(userData);
        })
        app.put('/user/update-address/:id', async (req, res) => {
            const id = req.params.id;
            const address = req.body;
            console.log('PUT API HIT...!!!  the data is : ', id, address);
            const filter = {
                _id: new ObjectId(id)
            }
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    address: address
                },
            };

            const userUpdate = await usersCollection.findOneAndUpdate(filter, updateDoc, options);
            const user = await usersCollection.findOne(filter)

            res.send(user);

            console.log('updated user.....', user);
        })




        //////////////////////////////////// USER LEVEL COUNT //////////////////////////////////


        app.get('user-level/:email', async (req, res) => {

            const email = req.params.email;

            const orders = ordersCollection.findOne({ userEmail: email });

        })

        //////////////////////////////////////////////  PRODUCTS ////////////////////////////////////////////

        app.get('/products', async (req, res) => {
            let cursor = products.find();
            let result = await cursor.toArray();

            res.send(result);

        })

        app.get('/products/inverter', async (req, res) => {
            const query = { type: 'inverter' };
            let cursor = products.find(query);
            let result = await cursor.toArray();

            res.send(result);
        })
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id
            // console.log('here id', id);
            const query = { _id: new ObjectId(id) };
            let result = await products.findOne(query);
            // console.log('the cart data....................!', result);
            res.send(result);
        })

        app.get('/products/solar-panel', async (req, res) => {
            const query = { type: 'solar panel' };
            let cursor = products.find(query);
            let result = await cursor.toArray();

            res.send(result);
        })

        ///////////////////////////////////////// CART /////////////////////////////////////////


        app.post('/cart', async (req, res) => {
            const { userEmail, productId } = req.body
            console.log('from cart post', userEmail, productId);
            const query = {
                $and: [
                    { productId: productId },
                    { userEmail: userEmail }
                ]
            }
            let productAlreadyExists = null;
            productAlreadyExists = await cart.findOne(query);
            if (productAlreadyExists) {
                res.send({ message: 'Already this product is in your cart', acknowledged: false })
            } else {
                const result = await cart.insertOne(req.body);
                res.send(result);
            }

        })



        app.get('/cart/:email', async (req, res) => {
            const email = req.params.email
            console.log('the cart data..................................!', email);
            const query = { userEmail: email }
            const cursor = cart.find(query)
            const allCartProducts = await cursor.toArray()
            // console.log(allCartProducts);
            res.send(allCartProducts);
        })

        app.patch(`/cart/:id`, async (req, res) => {
            const id = req.params.id
            const quantity = req.body.newQuantity
            console.log('product Id and quantity', id, quantity);
            const query = { productId: id };
            const cartItem = await cart.findOne(query);
            if (!cartItem) {
                return res.status(404).json({ message: 'Cart item not found' })
            }


            cartItem.quantity = quantity;

            const result = await cart.updateOne(query, { $set: { quantity: quantity } })

            res.status(200).json({ message: 'quantity updated successfully', data: result })
        })

        app.delete('/cart/product/:id', async (req, res) => {
            const id = req.params.id;
            console.log('delete API hit......!!!', id);
            const query = { _id: new ObjectId(id) }
            const result = await cart.deleteOne(query);
            res.send(result);
        })
        app.delete('/cart/:email', async (req, res) => {
            const email = req.params.email;
            console.log('Cart delete API hit......!!!', email);
            const query = { userEmail: email }
            const result = await cart.deleteMany(query);
            res.send(result);
        })


        //////////////////////////// ORDERS ////////////////////////////


        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            console.log('user id :', id);


            const query = { userId: new ObjectId(id) };
            const result = await ordersCollection.findOne(query);
            res.send(result);




        })




        app.put('/orders/:id', async (req, res) => {
            const userId = req.params.id
            const products = req.body
            const user = await usersCollection.findOne({ _id: new ObjectId(userId) })

            const orderData = {
                userId: user._id,
                name: user.fname + " " + user.lname,
                email: user.email,
                orders: products
            }



            const query = { userId: new ObjectId(userId) }
            const order = await ordersCollection.findOne(query);

            if (order) {
                const existingOrders = order.orders;

                products.map(product => {
                    existingOrders.push(product);
                })
                const query = { userId: new ObjectId(userId) }
                const updateDoc = {
                    $set: {
                        orders: existingOrders,
                    }
                }

                const options = { upsert: true };
                const result = await ordersCollection.updateOne(query, updateDoc, options)
                res.send(result);

            } else {
                const result = await ordersCollection.insertOne(orderData);
                res.send(result);
            }
        })




        app.put('/orders/cancel/:orderId/:userId', async (req, res) => {

            const orderId = req.params.orderId;
            const userId = req.params.userId;

            const query = {
                userId: new ObjectId(userId),
                'orders.orderId': orderId
            }

            const update = {
                $set: { 'orders.$.status': 'Cancelled' }
            }




            // order.orders.map(item => {

            //     if (item.orderId === orderId) {
            //         console.log('orderStatus before', item.status);
            //         item.status = 'Cancelled';
            //         console.log('orderStatus after', item.status);
            //     }
            // })


            const result = await ordersCollection.updateOne(query, update)
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