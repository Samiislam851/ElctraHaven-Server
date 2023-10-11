const express = require('express')
require('dotenv').config();
const { ObjectId } = require('mongodb');
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const port = 5000
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const mongoId = process.env.MONGO_ID
const mongoPass = process.env.MONGO_PASSWORD
const uri = `mongodb+srv://${mongoId}:${mongoPass}@cluster0.lkouiuy.mongodb.net/?retryWrites=true&w=majority`;

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
        // products.drop();
        const usersCollection = database.collection("users")
        const cart = database.collection("cart")
        const ordersCollection = database.collection("orders")
        // ordersCollection.drop();
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

        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find();
            const users = await cursor.toArray()
            console.log('all users', users);
            res.send(users);
        })
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

        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const options = {upsert : true}
            const updateDoc = {
                $set: {
                    role: 'admin',
                    grade: '2'
                },
            };

            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);

        })
        app.patch('/users/customer/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'customer',
                    grade: '0'
                },
            };

            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);

        })

        app.delete('/users/delete/:id', async (req, res) => {
            const id = req.params.id
            const query = {_id : new ObjectId(id)};
            const result = usersCollection.deleteOne(query);
            res.send(result)


        })


        ////////////////////////////////////// USER LEVEL COUNT //////////////////////////////////////


        app.get('/user-level/:email', async (req, res) => {

            const email = req.params.email;

            const order = await ordersCollection.findOne({ email: email });


            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1;


            const totalOrdersOfThisMonth = [];
            if (order?.orders) {
                for (x of order?.orders) {

                    console.log('x...............', x);
                    const dateString = x.orderDate;
                    const orderDate = new Date(dateString);
                    const month = orderDate.getMonth() + 1;
                    if (month == currentMonth) {
                        totalOrdersOfThisMonth.push(x)
                    }
                }

            }




            // console.log('orders of this month ', totalOrdersOfThisMonth);





            // Create a Set to store unique orderDate values
            const uniqueOrderDates = new Set();

            // Create an array to store objects with unique orderDate values
            const uniqueOrderObjects = [];




            //keeping count of price of orders

            let totalPrice = 0;

            // Iterate through the array of orders
            totalOrdersOfThisMonth.forEach((order) => {
                // console.log('payment status for this order is : ', order.paymentStatus);



                //TODO : code the front-end to make the paymentStatus dynamic for successful payment and get the result and uncomment  the if condition bellow


                // if (order.paymentStatus == 'paid') {
                const orderDate = order.orderDate;

                // If the orderDate is not in the Set, it's unique, so add it to the Set and push the object to the result array
                if (!uniqueOrderDates.has(orderDate)) {
                    uniqueOrderDates.add(orderDate);
                    uniqueOrderObjects.push(order);
                }

                console.log('price of order.... ', order.totalPrice, 'totalPrice = ', totalPrice);
                totalPrice += order.totalPrice
            }
                // }
            );

            const ordersOfThisMonth = uniqueOrderObjects.length;
            console.log(ordersOfThisMonth, 'orders..... this month', 'and total price', totalPrice);
            let userLevel = 1;

            if (ordersOfThisMonth >= 10 && ordersOfThisMonth < 20 && totalPrice >= 1000000 && totalPrice < 2000000) {
                userLevel = 2


            } else if (ordersOfThisMonth >= 20 && ordersOfThisMonth < 30 && totalPrice >= 2000000 && totalPrice < 3000000) {
                userLevel = 3
            } else if (ordersOfThisMonth >= 30 && totalPrice > 3000000) {
                userLevel = 4
            }
            console.log('user Level ', userLevel);

            res.send({ userLevel: userLevel })

        })

        //////////////////////////////////////////////  PRODUCTS ////////////////////////////////////////////

        app.get('/products', async (req, res) => {
            let cursor = products.find();
            let result = await cursor.toArray();

            res.send(result);

        })


        app.post('/addproduct', async (req, res) => {
            const dataInserted = req.body;


            const result = await products.insertOne(dataInserted);
            res.send(result);
        })


        app.get('/inverters/all', async (req, res) => {
            const query = { type: 'inverter' };
            let cursor = products.find(query);
            let result = await cursor.toArray();

            res.send(result);
        })
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id
         
            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ error: 'Invalid ObjectId' });
              }
            const query = { _id: new ObjectId(id) };
            let result = await products.findOne(query);
            // console.log('the cart data....................!', result);
            res.send(result);
        })

        app.get('/solar-panels/all', async (req, res) => {

            console.log('solarpanel api hitted .................');
            const query = { type: 'solar panel' };
            let cursor = products.find(query);
            let result = await cursor.toArray();

            res.send(result);
        })





        app.put('/update-product/:productId', async (req, res) => {
            const productId = req.params.productId;
            const updatedProduct = req.body;
            const query = { _id: new ObjectId(productId) };



            const existingProduct = await products.findOne(query)
            console.log('existing product', existingProduct);
            console.log('updated product', updatedProduct);

            const updateData = {
                $set: {}
            };
            for (const key in updatedProduct) {


                if (existingProduct[key] !== updatedProduct[key] && key != "_id") {
                    updateData.$set[key] = updatedProduct[key];
                }


            }




            console.log('set update after set', updateData);


            try {

                const updatedProduct = await products.updateOne(
                    query, updateData
                );


                console.log(updatedProduct);
                res.status(200).json(updatedProduct);
            } catch (error) {
                console.error('Error updating product:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });





        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id
            console.log('delete API hit......!!!', id);
            const query = { _id: new ObjectId(id) }
            const result = await products.deleteOne(query);
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

        /////////////////////////////////////////// SEARCH ///////////////////////////////////////////







        app.get('/search', async (req, res) => {
            const { searchTerm } = req.query;
            console.log('search Term = ', searchTerm);




            try {
                const query = {
                    $or: [
                        { brand: { $regex: searchTerm, $options: "i" } },
                        { modelNumber: { $regex: searchTerm, $options: "i" } },
                        { type: { $regex: searchTerm, $options: "i" } },
                    ]
                };





                const cursor = products.find(query);
                const result = await cursor.toArray();
                console.log('result :  ', result);
                res.send(result);
            } catch (error) {
                console.error('Error executing search query:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }





        })





    } finally {

        //   await client.close();
    }
}

run().catch(console.dir);



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})