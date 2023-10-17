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
const sslcStoreId = process.env.SSLC_STORE_ID
const sslcApiKey = process.env.SSLC_SECRET_KEY

const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
pdfMake.vfs = pdfFonts.pdfMake.vfs;


const SSLCommerzPayment = require('sslcommerz-lts')
const store_id = sslcStoreId
const store_passwd = sslcApiKey
const is_live = false //true for live, false for sandbox

const uri = `mongodb+srv://${mongoId}:${mongoPass}@cluster0.lkouiuy.mongodb.net/?retryWrites=true&w=majority`;

////////////////////////////////////////// JWT verification //////////////////////////////////////////////////
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt?.verify(token, 'dafea91334ce03e49042a919e62de4bd212fc5d3c5c1e08656122279bb16bbadca7be7506441ff2e209f59235ab8dc4eb21ee5ae96d9816168c68e22ed9247d9', (err, decoded) => {
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





app.use(bodyParser?.json());



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

        await client?.connect();
        await client?.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment?. You successfully connected to MongoDB!");

        const database = client?.db("ElectraHaven")
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

            const query = { email: user?.email }
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
        app.get('/adminNumber', async (req, res) => {

            const user = await usersCollection.findOne({
                $and: [
                    { role: 'admin' },
                    { grade: '1' }
                ]
            });

            console.log('admin ', user.bankingPhone);
            res.send(user.bankingPhone);
        })
        app.put('/user/update-address/:id', async (req, res) => {
            const id = req.params.id;
            const address = req.body;
            console.log('PUT API HIT?...!!!  the data is : ', id, address);
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

            console.log('updated user?.....', user);
        })

        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true }
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
            const query = { _id: new ObjectId(id) };
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
                // console.log('payment status for this order is : ', order?.paymentStatus);



                //TODO : code the front-end to make the paymentStatus dynamic for successful payment and get the result and uncomment  the if condition bellow


                // if (order?.paymentStatus == 'paid') {
                const orderDate = order?.orderDate;

                // If the orderDate is not in the Set, it's unique, so add it to the Set and push the object to the result array
                if (!uniqueOrderDates.has(orderDate)) {
                    uniqueOrderDates.add(orderDate);
                    uniqueOrderObjects.push(order);
                }

                console.log('price of order?.... ', order?.totalPrice, 'totalPrice = ', totalPrice);
                totalPrice += order?.totalPrice
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
            console.log('delete API hit?......!!!', id);
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
            productAlreadyExists = await cart?.findOne(query);
            if (productAlreadyExists) {
                res.send({ message: 'Already this product is in your cart', acknowledged: false })
            } else {
                const result = await cart?.insertOne(req.body);
                res.send(result);
            }

        })



        app.get('/cart/:email', async (req, res) => {
            const email = req.params.email

            const query = { userEmail: email }
            const cursor = cart?.find(query)
            const allCartProducts = await cursor.toArray()
            // console.log(allCartProducts);
            res.send(allCartProducts);
        })

        app.patch(`/cart/:id`, async (req, res) => {
            const id = req.params.id
            const quantity = req.body.newQuantity
            console.log('product Id and quantity', id, quantity);
            const query = { productId: id };
            const cartItem = await cart?.findOne(query);
            if (!cartItem) {
                return res.status(404).json({ message: 'Cart item not found' })
            }


            cartItem.quantity = quantity;

            const result = await cart?.updateOne(query, { $set: { quantity: quantity } })

            res.status(200).json({ message: 'quantity updated successfully', data: result })
        })

        app.delete('/cart/product/:id', async (req, res) => {
            const id = req.params.id;
            console.log('delete API hit?......!!!', id);
            const query = { _id: new ObjectId(id) }
            const result = await cart?.deleteOne(query);
            res.send(result);
        })
        app.delete('/cart/:email', async (req, res) => {
            const email = req.params.email;
            console.log('Cart delete API hit?......!!!', email);
            const query = { userEmail: email }
            const result = await cart?.deleteMany(query);
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

            const newOrderData = {
                userId: user?._id,
                name: user?.fname + " " + user?.lname,
                email: user?.email,
                orders: products
            }



            const query = { userId: new ObjectId(userId) }
            const order = await ordersCollection.findOne(query);

            if (order) {
                const existingOrders = order?.orders;

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
                const result = await ordersCollection.insertOne(newOrderData);
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
                $set: {
                    'orders.$.status': 'Cancelled',
                    'orders.$.paymentStatus': 'Cancelled'
                }
            }




            // order?.orders.map(item => {

            //     if (item.orderId == orderId) {
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


        ///////////////////////////////////////////////// PAYMENT GATEWAY ////////////////////////////////////


        app.post('/payment', async (req, res) => {


            const transactionId = new ObjectId().toString();
            const bodyData = req.body;
            const address = bodyData.userMongoData.address;
            const product = bodyData.product;
            const customer = bodyData.userMongoData
            const customerOrder = await ordersCollection.findOne({ email: customer?.email })

            const utcDate = new Date();
            utcDate.setHours(utcDate.getHours() + 6);

            const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };

            const paymentDate = utcDate.toLocaleString('en-US', options)
            console.log('current time........!', currentDate);

            const order = customerOrder.orders.find(e => e.orderId == bodyData.orderId)
            console.log('The order..', order);

            const data = {
                total_amount: order.totalPrice,
                currency: 'BDT',
                tran_id: transactionId, // use unique tran_id for each api call
                success_url: `http://localhost:5000/payment/success/${transactionId}`,
                fail_url: `http://localhost:5000/payment/failed/${transactionId}`,
                cancel_url: `http://localhost:5000/payment/cancel/${transactionId}`,
                ipn_url: `http://localhost:5000/payment/ipn/${transactionId}`,
                shipping_method: 'Courier',
                product_name: product.modelNumber,
                product_category: product.type,
                product_profile: 'electrical',
                cus_name: customer.fname,
                cus_email: customer.email,
                cus_add1: address.division,
                cus_add2: address.district,
                cus_city: address.district,
                cus_state: 'a',
                cus_postcode: address.postalCode,
                cus_country: 'Bangladesh',
                cus_phone: address.phone,
                cus_fax: 'a',
                ship_name: address.fullName,
                ship_add1: address.division + ", " + address.district + ", " + address.subDistrict + ", " + address.house + ", " + address.street + ", " + address.landmark,
                ship_add2: 'a',
                ship_city: 'a',
                ship_state: 'a',
                ship_postcode: address.postalCode,
                ship_country: 'Bangladesh',
            };

            console.log(store_id, store_passwd, is_live);
            const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
            sslcz.init(data).then(apiResponse => {
                // Redirect the user to payment gateway
                let GatewayPageURL = apiResponse.GatewayPageURL

                res.send({ url: GatewayPageURL })
                console.log('Redirecting to: ', GatewayPageURL)
            });


            app.post('/payment/success/:transactionId', async (req, res) => {
                const tranId = req.params.transactionId;
                order.paymentStatus = 'paid'
                order.paymentMethod = 'online'
                order.transactionId = tranId;
                order.paymentDate = paymentDate;
                console.log('updated order....', order);
                console.log('updated customer Orders ....', customerOrder.orders);


                const result = await ordersCollection.updateOne(
                    { email: customer?.email },
                    {
                        $set: {
                            orders: customerOrder.orders
                        }
                    }


                )
                if (result.modifiedCount > 0) {
                    res.redirect(`http://localhost:5173/payment/success/${tranId}`)
                }

            })



            app.post('/payment/failed/:transactionId', async (req, res) => {
                const tranId = req.params.transactionId;

                const newOrders = customerOrder.orders.filter(e => e.orderId != bodyData.orderId)

                // Updating `customerOrder.orders` with the filtered array
                customerOrder.orders = newOrders;




                console.log('updated customer Orders ....', customerOrder.orders);


                const result = await ordersCollection.updateOne(
                    { email: customer?.email },
                    {
                        $set: {
                            orders: customerOrder.orders
                        }
                    }


                )
                if (result.modifiedCount > 0) {
                    res.redirect(`http://localhost:5173/payment/failed/${tranId}`)
                }

            })




            app.post('/payment/cancel/:transactionId', async (req, res) => {
                const tranId = req.params.transactionId;
                const newOrders = customerOrder.orders.filter(e => e.orderId != bodyData.orderId)
                // Updating `customerOrder.orders` with the filtered array
                customerOrder.orders = newOrders;
                console.log('updated customer Orders ....', customerOrder.orders);


                const result = await ordersCollection.updateOne(
                    { email: customer?.email },
                    {
                        $set: {
                            orders: customerOrder.orders
                        }
                    })

                res.redirect(`http://localhost:5173/payment/cancel/${tranId}`);
            });




        })


        app.post('/payment/ipn/:transactionId', (req, res) => {
            // Get and process the IPN data from SSLCommerz
            const ipnData = req.body;

            // Process the IPN data (e.g., update order status based on the IPN data)
            // You can access the payment details in the 'ipnData' object
            console.log('Received IPN notification. Transaction ID:', ipnData.tran_id);

            // Send an empty response (200 OK) to acknowledge receipt of the IPN
            res.status(200).send('IPN received successfully');
        });

        ///////////////////////////////////////Custom Payment//////////////////////////////

        app.put(`/payment/mobile-banking/:id`, async (req, res) => {
            const orderId = req.params.id
            const data = req.body


            const userOrder = await ordersCollection.findOne({ email: data.user.email });
            const order = userOrder.orders.find(order => order.orderId == orderId)
            console.log(order);



            if (order.paymentServiceProvider) {
                console.log('payment service provider', order.paymentServiceProvider);
                res.send({ message: 'Already payment is done. If there is any confusion with this. Kindly contact us through the contact section' })
            } else {
                order['paymentServiceProvider'] = data.paymentServiceProvider;
                order['transactionCount'] = data.transactionCount;
                order['transactions'] = data.transactions;
                order['transactionPhoneNumber'] = data.phoneNumber;
                order['paymentDate'] = new Date().toString();
                order.paymentStatus = 'requested';
                order.paymentMethod = 'mobileBanking';
                order.status = 'placed'

                console.log('order after adding data', order);


                const result = await ordersCollection.updateOne(
                    { email: data.user.email },
                    {
                        $set: {
                            orders: userOrder.orders
                        }
                    }

                )

                res.send(result);

            }



        })
        app.put(`/payment/card/:id`, async (req, res) => {
            const orderId = req.params.id
            const data = req.body


            const userOrder = await ordersCollection.findOne({ email: data.user.email });
            const order = userOrder.orders.find(order => order.orderId == orderId)
            console.log(order);



            if (order.paymentServiceProvider) {
                console.log('payment service provider', order.paymentServiceProvider);
                res.send({ message: 'Already payment is done. If there is any confusion with this. Kindly contact us through the contact section' })
            } else {



                order['providedNumber'] = data.phoneNumber;
                order['cardNumber'] = data.cardAccountNumber;
                order['providedName'] = data.name;
                order['providedBank'] = data.bank;
                order['paymentDate'] = new Date().toString();
                order.paymentStatus = 'requested';
                order.paymentMethod = 'card';
                order.status = 'placed'

                console.log('order after adding data', order);


                const result = await ordersCollection.updateOne(
                    { email: data.user.email },
                    {
                        $set: {
                            orders: userOrder.orders
                        }
                    }

                )

                res.send(result);

            }



        })


        ///////////////////////////////////////// ORDER TRACKING FOR ADMIN ////////////////////////////////


        app.get('/orders/payment-status/pending', async (req, res) => {
            console.log('api hit........................!!!!!!!!!!!!!');
            const cursor = ordersCollection.aggregate([
                {
                    $unwind: "$orders" // Unwind the "orders" array
                },
                {
                    $match: {
                        "orders.paymentStatus": "pending"
                    }
                },
                {
                    $group: {
                        _id: null,
                        filteredOrders: { $push: "$orders" }
                    }
                }
            ]);
            const orders = await cursor.toArray();

            if (orders[0]) {
                console.log(orders[0].filteredOrders);
                res.send(orders[0].filteredOrders);
            } else {
                res.send(null)
            }
        })
        app.get('/orders/payment-status/paid', async (req, res) => {
            console.log('api hit........................!!!!!!!!!!!!!');
            const cursor = ordersCollection.aggregate([
                {
                    $unwind: "$orders" // Unwind the "orders" array
                },
                {
                    $match: {
                        "orders.paymentStatus": "paid"
                    }
                },
                {
                    $group: {
                        _id: null,
                        filteredOrders: { $push: "$orders" }
                    }
                }
            ]);
            const orders = await cursor.toArray();

            if (orders[0]) {
                console.log(orders[0].filteredOrders);
                res.send(orders[0].filteredOrders);
            } else {
                res.send(null)
            }
        })
        app.get('/orders/payment-status/requested', async (req, res) => {
            console.log('api hit........................!!!!!!!!!!!!!');
            const cursor = ordersCollection.aggregate([
                {
                    $unwind: "$orders" // Unwind the "orders" array
                },
                {
                    $match: {
                        "orders.paymentStatus": "requested"
                    }
                },
                {
                    $group: {
                        _id: null,
                        filteredOrders: { $push: "$orders" }
                    }
                }
            ]);
            const orders = await cursor.toArray();

            if (orders[0]) {
                console.log(orders[0].filteredOrders);
                res.send(orders[0].filteredOrders);
            } else {
                res.send(null)
            }
        })
        app.get('/orders/payment-status/cancelled', async (req, res) => {
            console.log('api hit........................!!!!!!!!!!!!!');
            const cursor = ordersCollection.aggregate([
                {
                    $unwind: "$orders" // Unwind the "orders" array
                },
                {
                    $match: {
                        "orders.paymentStatus": "Cancelled"
                    }
                },
                {
                    $group: {
                        _id: null,
                        filteredOrders: { $push: "$orders" }
                    }
                }
            ]);
            const orders = await cursor.toArray();

            if (orders[0]) {
                console.log(orders[0].filteredOrders);
                res.send(orders[0].filteredOrders);
            } else {
                res.send(null)
            }
        })
        app.get('/orders/payment-status/problem', async (req, res) => {
            console.log('api hit........................!!!!!!!!!!!!!');
            const cursor = ordersCollection.aggregate([
                {
                    $unwind: "$orders" // Unwind the "orders" array
                },
                {
                    $match: {
                        "orders.paymentStatus": "problem found"
                    }
                },
                {
                    $group: {
                        _id: null,
                        filteredOrders: { $push: "$orders" }
                    }
                }
            ]);
            const orders = await cursor.toArray();

            if (orders[0]) {
                console.log(orders[0].filteredOrders);
                res.send(orders[0].filteredOrders);
            } else {
                res.send(null)
            }
        })



        app.put('/cancelOrder/admin', async (req, res) => {
            const newOrderData = req.body;


            const allOrdersByUser = await ordersCollection.findOne({ email: newOrderData.userEmail })

            const order = allOrdersByUser?.orders.find(e => e.orderId == newOrderData.orderId)

            order.status = 'Cancelled';
            order.paymentStatus = 'Cancelled';
            const result = await ordersCollection.updateOne(
                { email: newOrderData.userEmail },
                {
                    $set: {
                        orders: allOrdersByUser.orders
                    }
                }

            )
            res.send(result);

        })
        app.put('/paymentReceived/admin', async (req, res) => {
            const newOrderData = req.body;


            const allOrdersByUser = await ordersCollection.findOne({ email: newOrderData.userEmail })

            const order = allOrdersByUser?.orders.find(e => e.orderId == newOrderData.orderId)
            if (order.status != "paid") {
                order.status = 'paid';
                order.paymentStatus = 'paid';
                const result = await ordersCollection.updateOne(
                    { email: newOrderData.userEmail },
                    {
                        $set: {
                            orders: allOrdersByUser.orders
                        }
                    }

                )
                res.send(result);
            } else {
                res.send({ message: 'Already updated as paid' })
            }


        })

        app.put('/problematic-order/admin', async (req, res) => {
            const newOrderData = req.body;


            const allOrdersByUser = await ordersCollection.findOne({ email: newOrderData.userEmail })

            const order = allOrdersByUser?.orders.find(e => e.orderId == newOrderData.orderId)
            if (order.status != "paid") {
                order.status = 'could not start shipping problem found';
                order['feedBack'] = newOrderData.feedBack;
                order.paymentStatus = 'problem found';
                const result = await ordersCollection.updateOne(
                    { email: newOrderData.userEmail },
                    {
                        $set: {
                            orders: allOrdersByUser.orders
                        }
                    }

                )
                res.send(result);
             
            } else {
                res.send({ message: 'Already updated as paid' })
            }


        })






        /////////////////////////////////// order details ////////////////////////

        app.get('/orderdetails-pdf/download/:orderId/:email', async (req, res) => {

            const orderId = req.params.orderId;
            const userEmail = req.params.email;

            const allOrdersByUser = await ordersCollection.findOne({ email: userEmail })

            const order = allOrdersByUser?.orders.find(e => e.orderId == orderId)
            const product = await products.findOne({ _id: new ObjectId(order.productId) })








            const documentDefinition = {

                content: [
                    {
                        text: 'ElectraHaven',
                        style: 'header1',
                        alignment: 'center',
                        margin: [0, 30],
                    },
                    {
                        text: 'Order Details',
                        style: 'header',
                    },
                    {
                        layout: 'noBorders',
                        table: {
                            widths: ['35%', '65%'],
                            body: [
                                [{ text: 'Order ID:', style: 'tableHeader' }, order.orderId],
                                [{ text: 'Order Date:', style: 'tableHeader' }, order.orderDate],
                                [{ text: 'Payment Date:', style: 'tableHeader' }, order.paymentDate],
                                [{ text: 'Payment Method:', style: 'tableHeader' }, order.paymentMethod],
                                [
                                    { text: 'Payment Service Provider:', style: 'tableHeader' },
                                    order.paymentMethod == 'card' ? order.providedBank : order.paymentServiceProvider,
                                ],
                                [{ text: 'Payment Status:', style: 'tableHeader' }, order.paymentStatus],
                                [{ text: 'Quantity:', style: 'tableHeader' }, order.quantity],
                                [{ text: 'Total Price:', style: 'tableHeader' }, `${order.totalPrice} bdt`],
                                [
                                    { text: 'Card Number:', style: 'tableHeader' },
                                    order.paymentMethod == 'card' ? order.cardNumber : 'Not Available for mobile transaction',
                                ],
                                [
                                    { text: 'Provided Phone Number:', style: 'tableHeader' },
                                    order.paymentMethod == 'card' ? order.providedNumber : 'Not Available for mobile transaction',
                                ],
                                [
                                    { text: 'Provided Name:', style: 'tableHeader' },
                                    order.paymentMethod == 'card' ? order.providedName : 'Not Available for mobile transaction',
                                ],
                                [
                                    { text: 'Total Transactions:', style: 'tableHeader' },
                                    order.paymentMethod == 'card' ? 'N/A in card transaction' : order.transactionCount,
                                ],
                                [
                                    { text: 'Transaction Phone Number:', style: 'tableHeader' },
                                    order.paymentMethod == 'card' ? 'N/A in card transaction' : order.transactionPhoneNumber,
                                ],
                                [{ text: 'User Email:', style: 'tableHeader' }, order.userEmail],
                            ],
                        },
                    },
                    {
                        text: 'Product Details',
                        style: 'header',
                    },
                    {
                        layout: 'noBorders',
                        table: {
                            widths: ['35%', '65%'],
                            body: [
                                [{ text: 'Model Number:', style: 'tableHeader' }, product.modelNumber],
                                [{ text: 'Brand:', style: 'tableHeader' }, product.brand],
                                [{ text: 'Capacity:', style: 'tableHeader' }, product.capacity],
                                [{ text: 'Type:', style: 'tableHeader' }, product.type],
                            ],
                        },
                    },
                    {
                        text: 'Shipping Address',
                        style: 'header',
                    },
                    {
                        layout: 'noBorders',
                        table: {
                            widths: ['35%', '65%'],
                            body: [
                                [{ text: 'Full Name:', style: 'tableHeader' }, order.shippingAddress.fullName],
                                [{ text: 'Phone:', style: 'tableHeader' }, order.shippingAddress.phone],
                                [{ text: 'Division:', style: 'tableHeader' }, order.shippingAddress.division],
                                [{ text: 'District:', style: 'tableHeader' }, order.shippingAddress.district],
                                [{ text: 'Sub-District:', style: 'tableHeader' }, order.shippingAddress.subDistrict],
                                [{ text: 'House:', style: 'tableHeader' }, order.shippingAddress.house],
                                [{ text: 'Street:', style: 'tableHeader' }, order.shippingAddress.street],
                                [{ text: 'Postal Code:', style: 'tableHeader' }, order.shippingAddress.postalCode],
                                [{ text: 'Landmark:', style: 'tableHeader' }, order.shippingAddress.landMark],
                            ],
                        },
                    },
                ],
                styles: {
                    header: {
                        fontSize: 18,
                        bold: true,
                        margin: [0, 10, 0, 10],
                    },
                    header1: {
                        fontSize: 30,
                        bold: true,
                        margin: [0, 10, 0, 10],
                    },
                    tableHeader: {
                        bold: true,
                        fillColor: '#f2f2f2',
                    },
                },
            };

            if (order.paymentMethod == 'mobileBanking') {
                documentDefinition.content.push({
                    text: 'Transaction ID and other details',
                    style: 'header',
                });
                documentDefinition.content.push({
                    layout: 'noBorders',
                    table: {
                        widths: ['50%', '50%'],
                        body: [['Transaction ID ', 'Amount'], ...order.transactions.map((transaction) => [transaction.transactionId, transaction.amount])],
                    },
                });
            }



            const pdfDoc = pdfMake.createPdf(documentDefinition);
            pdfDoc.getBuffer((buffer) => {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=ElectraHaven_order.pdf');
                res.end(buffer);
            });

        })


    } finally {

        //   await client?.close();
    }
}

run().catch(console.dir);



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})