const path = require('path'),
      mysql = require('mysql2'),
      express = require('express'),
      bodyParser = require('body-parser'),
      cookieParser = require('cookie-parser'),
      sendMail = require('sendmail')(),
      generatePassword = require('./public/javascript/module/generatePassword'),
      session = require('express-session'),
      MySQLStore = require('express-mysql-session')(session),
      multer  = require("multer"),
      app = express();

const conn = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'internet_magazine',
    password: 'Plmoknn1605',
    port: '3306'
});

const storageConfig = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, "public/productImages");
    },
    filename: (req, file, cb) =>{
        cb(null, `${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/png"){
        cb(null, true);
    } else{
        cb(null, false);
    }
 }

const urlencodedParser = bodyParser.urlencoded({extended: false});

const sessionOptions = {
    host: 'localhost',
    user: 'root',
    password: 'Plmoknn1605',
    database: 'internet_magazine',
    port: '3306',
    schema: {
        tableName: 'session',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
};

const orderStatus = ['Подтверждён', 'Не подтверждён'];

app.use(express.static(path.join(__dirname, 'public')));
app.use(multer({storage:storageConfig, fileFilter: fileFilter}).single("filedata"));
app.use(cookieParser());
app.use(express.json());
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(sessionOptions),
    cookie: {
        path: "/",
        httpOnly: true,
        maxAge: null
    },
}));

app.set("view engine", "pug");

app.get('/favico.ico', (req, res) => {
    res.sendStatus(404);
});
app.get("/", (req, res) => {
    if (req.session.userName  && req.session.successAuthentication) {
        res.render('index', {
            userName: req.session.userName,
            successAuthentication: req.session.successAuthentication,
            isWorker: req.session.isWorker
        });
    } else {
        res.render('index', {
            successAuthentication: false
        });
    }
});
app.get("/signUp", urlencodedParser, (req, res) =>{
    res.sendFile(`${__dirname}/public/html/signUp.html`);
});
app.get("/signIn", urlencodedParser, (req, res) => {
    res.sendFile(`${__dirname}/public/html/signIn.html`);
});
app.get("/signOut", urlencodedParser, (req, res) => {
    req.session.destroy(function(err) {
        if (err) {throw err};
        return res.redirect(302, '/');
    });
});
app.get("/resetPassword", (req, res) => {
    res.sendFile(`${__dirname}/public/html/resetPassword.html`);
});
app.get("/addProduct", (req, res) => {
    if (req.session.successAuthentication === true && 
        req.session.isWorker === true) {
        conn.query(`SELECT  category_id,
                            category_name
                    FROM product_category`, (err, categories) => {
            if (err) {throw err};
            if(categories.length > 0) {
                res.render('addProduct', {
                    userName: req.session.userName,
                    successAuthentication: req.session.successAuthentication,
                    isWorker: req.session.isWorker,
                    categories 
                });
            }
        });
    } else {
        res.redirect(302, '/');
    }
});
app.get("/addWorker", (req, res) => {
    if (req.session.successAuthentication === true && 
        req.session.isWorker === true) {
        conn.query(`SELECT  position_id,
                            position_name
                    FROM position`, (err, positions) => {
            if (err) {throw err};
            if(positions.length > 0) {
                res.render('addWorker', {
                    userName: req.session.userName,
                    successAuthentication: req.session.successAuthentication,
                    isWorker: req.session.isWorker,
                    positions 
                });
            } else {
                res.sendStatus(500);
            }
        });
    } else {
        res.redirect(302, '/');
    }
});
app.get("/addPosition", (req, res) => {
    if (req.session.successAuthentication === true && 
        req.session.isWorker === true) {
        res.render('addPosition', {
            userName: req.session.userName,
            successAuthentication: req.session.successAuthentication,
            isWorker: req.session.isWorker
        });
    } else {
        res.redirect(302, '/');
    }
});
app.get("/addProductCategory", (req, res) => {
    if (req.session.successAuthentication === true && 
        req.session.isWorker === true) {
        res.render('addProductCategory', {
            userName: req.session.userName,
            successAuthentication: req.session.successAuthentication,
            isWorker: req.session.isWorker
        });
    } else {
        res.redirect(302, '/');
    }
});
app.get("/productList", (req, res) => {
    conn.query(`SELECT  product_id,
                        product_name,
                        product_url_img,
                        product_description,
                        product_amount,
                        product_count_stock,
                        category_id,
                        category_name 
                FROM products INNER JOIN product_category 
                ON products.product_category_id = product_category.category_id
                WHERE products.product_count_stock > 0
                AND category_name = '${(req.query.categoryName) ? req.query.categoryName : 'Категория товара 1'}';`, (err, productList) => {
        if(err) {throw err;}
        if (productList.length > 0) {
            conn.query(`SELECT category_name 
                        FROM product_category`, (err, categories) => {
                if(err) {throw err;}
                if(categories.length > 0) {
                    res.render('productList', {
                        userName: req.session.userName,
                        successAuthentication: req.session.successAuthentication,
                        isWorker: req.session.isWorker, 
                        productList : productList,
                        categories,
                        activeCategory: productList[0].category_name
                    });
                } else {
                    res.sendStatus(404);
                }
            });            
            
        } else {
            res.sendStatus(404);
        }
    });
});
app.get('/product', (req, res) => {
    if (req.query.productId !== undefined &&
        req.query.productId > 0) {
        conn.query(`SELECT * 
                    FROM products
                    WHERE product_id = ${req.query.productId}`, (err, product) => {
            if(err) {throw err;}
            if(product.length > 0) {
                res.render('product', {
                    userName: req.session.userName,
                    successAuthentication: req.session.successAuthentication,
                    isWorker: req.session.isWorker,
                    product: product[0]
                });
            } else {
                res.sendStatus(404);
            }
        });
    } else {
        res.sendStatus(404);
    }
});
app.get('/cart', (req, res) => {
    if (req.session.successAuthentication && 
        req.session.userId && 
        req.session.isWorker === false) {
        conn.query(`SELECT order_id 
                    FROM orders
                    WHERE user_id=${req.session.userId}
                    AND status = '${orderStatus[1]}'`, (err, selUser) => {
            if (err) {throw err;}
            if (selUser.length > 0) {
                conn.query(`SELECT product_id
                            FROM order_product
                            WHERE order_id = ${selUser[0].order_id}`, (err, selProductId) => {
                    if (err) {throw err;}
                    if (selProductId.length > 0) {
                        let productIdArray = [];
                        let productIdArrayWithSort;
                        for (let i = 0; i < selProductId.length; i++) {
                            productIdArray.push(selProductId[i].product_id);
                        }
                        productIdArrayWithSort = productIdArray.sort((a, b) => a - b);
                        conn.query(`SELECT  products.product_id,
                                            product_name,
                                            product_url_img,
                                            product_description,
                                            product_amount,
                                            product_count,
                                            product_count_stock
                                    FROM products 
                                    INNER JOIN order_product ON products.product_id = order_product.product_id
                                    INNER JOIN orders ON order_product.order_id = orders.order_id
                                    WHERE products.product_id IN(${productIdArrayWithSort.toString()}) 
                                    AND orders.user_id = ${req.session.userId}
                                    AND orders.status = '${orderStatus[1]}'`, (err, selProductList) => {
                            if (err) {throw err;}
                            if (selProductList.length > 0) {
                                let totalCount = 0;
                                let totalAmount = 0;
                                for (let i = 0; i < selProductList.length; i++) {
                                    totalCount++;
                                    totalAmount += selProductList[i].product_amount * 
                                                   selProductList[i].product_count;
                                }
                                res.render('cart', {
                                    userName: req.session.userName,
                                    successAuthentication: req.session.successAuthentication,
                                    isWorker: req.session.isWorker, 
                                    productList: selProductList,
                                    total_amount: totalAmount,
                                    total_count: totalCount
                                });
                            } else {
                                res.render('cart', {
                                    userName: req.session.userName,
                                    successAuthentication: req.session.successAuthentication,
                                    isWorker: req.session.isWorker 
                                });
                            }
                        });
                    } else {
                        res.render('cart', {
                            userName: req.session.userName,
                            successAuthentication: req.session.successAuthentication,
                            isWorker: req.session.isWorker 
                        });
                    }
                });
            } else {
                res.render('cart', {
                    userName: req.session.userName,
                    successAuthentication: req.session.successAuthentication,
                    isWorker: req.session.isWorker 
                });
            }
        });
    } else {
        res.redirect(302, '/');
    }
});
app.get('/myOrders', (req, res) => {
    if (req.session.successAuthentication === true && 
        req.session.userId !== undefined && 
        req.session.isWorker === false) {
        conn.query(`SELECT  orders.order_id,
                            order_product.product_count,
                            products.product_id,
                            products.product_amount,
                            orders.order_date
                    FROM orders INNER JOIN order_product 
                    ON orders.order_id = order_product.order_id INNER JOIN products
                    ON order_product.product_id = products.product_id
                    WHERE orders.order_id IN(
                        SELECT DISTINCT orders.order_id
                        FROM orders LEFT JOIN order_product 
                        ON orders.order_id = order_product.order_id
                        WHERE orders.user_id = ${req.session.userId} 
                        AND orders.status = '${orderStatus[0]}'
                        ORDER BY orders.order_id
                    )`, (err, productInOrder) => {
            if (err) {throw err;}
            if (productInOrder.length > 0) {
                let ordersArray = [];
                for (let i = 0; i < productInOrder.length; i++) {
                    if (ordersArray.length === 0) {
                        ordersArray[0] = {
                            orderId: productInOrder[i].order_id,
                            productList: [
                                {
                                    product_id: productInOrder[i].product_id,
                                    product_count: productInOrder[i].product_count,
                                    product_amount: productInOrder[i].product_amount
                                }
                            ],
                            totalAmount: productInOrder[i].product_amount * 
                                         productInOrder[i].product_count,
                            totalCount: 1,
                            orderDate: productInOrder[i].order_date
                        }
                    } else if (ordersArray.length > 0){
                        for (let j = 0; j < ordersArray.length; j++) {
                            if (ordersArray[j].orderId === productInOrder[i].order_id) {
                                for (let k = 0; k < ordersArray[j].productList.length; k++) {
                                    if(ordersArray[j].productList[k].product_id !== productInOrder[i].product_id) {
                                        if (k === ordersArray[j].productList.length - 1) {
                                            ordersArray[j].productList.push({
                                                product_id: productInOrder[i].product_id,
                                                product_count: productInOrder[i].product_count,
                                                product_amount: productInOrder[i].product_amount,
                                            });
                                            ordersArray[j].totalAmount += productInOrder[i].product_count *
                                                                          productInOrder[i].product_amount,
                                            ordersArray[j].totalCount++; 
                                        }
                                    }
                                }
                            } else if (ordersArray[j].orderId !== productInOrder[i].order_id &&
                                       j ===  ordersArray.length - 1) {
                                ordersArray.push({
                                    orderId: productInOrder[i].order_id,
                                    productList: [
                                        {
                                            product_id: productInOrder[i].product_id,
                                            product_count: productInOrder[i].product_count,
                                            product_amount: productInOrder[i].product_amount
                                        }
                                    ],
                                    totalAmount: productInOrder[i].product_amount * 
                                                 productInOrder[i].product_count,
                                    totalCount: 1,
                                    orderDate: productInOrder[i].order_date
                                });
                            }
                        }
                    }
                }
                res.render('myOrders', {
                    userName: req.session.userName,
                    successAuthentication: req.session.successAuthentication,
                    isWorker: req.session.isWorker,
                    ordersArray
                });
            } else {
                res.render('myOrders', {
                    userName: req.session.userName,
                    successAuthentication: req.session.successAuthentication,
                    isWorker: req.session.isWorker
                });
            }
        });
    } else {
        res.redirect(302, '/');
    }
});
app.get('/order', (req, res) => {
    if (req.query.orderId !== undefined &&
        req.query.orderId > 0) {
        conn.query(`SELECT  order_product.product_count,
                            products.product_id,
                            products.product_name,
                            products.product_amount,
                            products.product_url_img,
                            orders.order_id,
                            orders.total_cost
                    FROM orders INNER JOIN order_product
                    ON orders.order_id = order_product.order_id INNER JOIN products
                    ON order_product.product_id = products.product_id
                    WHERE order_product.order_id IN(
                        SELECT DISTINCT orders.order_id
                        FROM orders LEFT JOIN order_product 
                        ON orders.order_id = order_product.order_id
                        WHERE orders.user_id = ${req.session.userId}
                        AND orders.status = '${orderStatus[0]}'
                        AND orders.order_id = ${req.query.orderId}
                        ORDER BY orders.order_id
                    );`, (err, orderData) => {
            if(err) {throw err;}
            if(orderData.length > 0) {
                res.render('order', {
                    userName: req.session.userName,
                    successAuthentication: req.session.successAuthentication,
                    isWorker: req.session.isWorker,
                    orderData,
                    orderId: orderData[0].order_id,
                    totalAmount: orderData[0].total_cost
                });
            } else {
                res.sendStatus(404);
            }
        });
    } else {
        res.sendStatus(404);
    }
});
app.get('/orderRegistration', (req, res) => {
    if (req.session.successAuthentication === true && 
        req.session.userId !== undefined && 
        req.session.isWorker === false) {
        conn.query(`SELECT order_id 
                    FROM orders
                    WHERE user_id = ${req.session.userId}
                    AND status = '${orderStatus[1]}'`, (err, selUser) => {
            if (err) {throw err;}
            if (selUser.length > 0) {
                conn.query(`SELECT product_id
                            FROM order_product INNER JOIN orders
                            ON order_product.order_id = orders.order_id
                            WHERE orders.order_id = ${selUser[0].order_id}
                            AND orders.status = '${orderStatus[1]}'`, (err, selProductId) => {
                    if (err) {throw err;}
                    if (selProductId.length > 0) {
                        let productIdArray = [];
                        let productIdArrayWithSort;
                        for (let i = 0; i < selProductId.length; i++) {
                            productIdArray.push(selProductId[i].product_id);
                        }
                        productIdArrayWithSort = productIdArray.sort((a, b) => a - b);
                        conn.query(`SELECT  products.product_id,
                                            product_name,
                                            product_url_img,
                                            product_description,
                                            product_amount,
                                            product_count,
                                            product_count_stock
                                    FROM products INNER JOIN order_product 
                                    ON products.product_id = order_product.product_id INNER JOIN orders 
                                    ON order_product.order_id = orders.order_id
                                    WHERE products.product_id IN(${productIdArrayWithSort.toString()}) 
                                    AND orders.user_id = ${req.session.userId}
                                    AND orders.status = '${orderStatus[1]}'`, (err, selProductList) => {
                            if (err) {throw err;}
                            if (selProductList.length > 0) {
                                let totalCount = 0;
                                let totalAmount = 0;
                                for (let i = 0; i < selProductList.length; i++) {
                                    totalCount++;
                                    totalAmount += selProductList[i].product_amount * 
                                                    selProductList[i].product_count;
                                }
                                res.render('orderRegistration', {
                                    userName: req.session.userName,
                                    successAuthentication: req.session.successAuthentication,
                                    isWorker: req.session.isWorker, 
                                    productList: selProductList,
                                    total_amount: totalAmount,
                                    total_count: totalCount
                                });
                            }
                        });
                    } else {
                        res.sendStatus(500);
                    }
                });
            } else {
                res.redirect(302, '/');
            }
        });
    } else {
        res.redirect(302, '/');
    }
});
app.get('/salesPerDay', (req, res) => {
    if(req.session.isWorker === true && req.session.successAuthentication === true) {
        conn.query(`SELECT  products.product_name,
                            products.product_amount,
                            product_category.category_name,
                            order_product.product_count,
                            users.user_name,
                            users.user_surname,
                            users.user_patronymic
                    FROM users INNER JOIN orders
                    ON users.user_id = orders.user_id INNER JOIN order_product
                    ON orders.order_id = order_product.order_id INNER JOIN products
                    ON order_product.product_id = products.product_id INNER JOIN product_category
                    ON products.product_category_id = product_category.category_id 
                    WHERE orders.order_date = CURDATE();`, (err, salesPerDay) => {
            if(err) {throw err;}
            res.render('salesPerDay', {
                userName: req.session.userName,
                successAuthentication: req.session.successAuthentication,
                isWorker: req.session.isWorker,
                salesPerDay
            });
        });
    } else {
        res.redirect(302, '/');
    }
});
app.get('/supplyOfProducts', (req, res) => {
    if(req.session.isWorker === true && req.session.successAuthentication === true) {
        conn.query(`SELECT income.income_id,
                            income.total,
                            products.product_id,
                            income_product.count,
                            products.product_name,
                            products.product_description,
                            products.product_amount,
                            products.product_count_stock,
                            product_category.category_name
                    FROM income INNER JOIN income_product
                    ON income.income_id = income_product.income_id INNER JOIN products
                    ON income_product.product_id = products.product_id INNER JOIN product_category
                    ON products.product_category_id = product_category.category_id;`, (err, supplyOfProducts) => {
            if(err) {throw err;}
            if(supplyOfProducts.length > 0) {
                console.log(supplyOfProducts);
                res.render('supplyOfProducts', {
                    userName: req.session.userName,
                    successAuthentication: req.session.successAuthentication,
                    isWorker: req.session.isWorker,
                    supplyOfProducts
                });
            }
            
        });
    } else {
        res.redirect(302, '/');
    }
});

/* Для диплома. Покажет форму для выбора промежутка продаж */
// app.get('/salesByRangeForm', (req, res) => {
//     if(req.session.isWorker === true && req.session.successAuthentication === true) {
//         res.render('salesByRangeForm', {
//             userName: req.session.userName,
//             successAuthentication: req.session.successAuthentication,
//             isWorker: req.session.isWorker
//         });
//     } else {
//         res.redirect(302, '/');
//     }
// });
app.get('/productsReport', (req, res) => {
    if(req.session.isWorker === true && req.session.successAuthentication === true) {
        conn.query(`SELECT  products.product_name,
                            product_category.category_name,
                            products.product_name,
                            products.product_description,
                            products.product_amount,  
                            products.product_count_stock  
                    FROM products INNER JOIN product_category
                    ON products.product_category_id = product_category.category_id`, (err, products) => {
            if (err) {throw err;}
            res.render('productsReport', {
                userName: req.session.userName,
                successAuthentication: req.session.successAuthentication,
                isWorker: req.session.isWorker,
                products
            }); 
        });
    } else {
        res.redirect(302, '/');
    }
});

app.post("/signUp", urlencodedParser, (req, res) => {
    if (!req.body) return res.sendStatus(400);
    conn.query(`SELECT user_id 
                FROM users 
                ORDER BY user_id 
                DESC LIMIT 1`, (err, lastUser) => {
        if (err) {throw err;}
        if (lastUser.length > 0) {
            conn.query(`SELECT user_id
                        FROM users
                        WHERE telephone = ${req.body.telephone} 
                        OR email = '${req.body.email}' `, (err, existingUser) => {
                if (err) {throw err;}
                if (existingUser.length === 0) {
                    conn.query(`INSERT INTO users 
                                VALUE(${(lastUser.length !== 0) ? lastUser[0].user_id + 1 : 1}, 
                                    '${req.body.userSurname}', 
                                    '${req.body.userName}', 
                                    '${req.body.userPatronymic}',
                                    '${req.body.email}',
                                    '${req.body.telephone}',
                                    '${req.body.password}',
                                    '')`, (err) => {
                        if (err) {throw err;}
                        res.render('index', {
                            successAuthentication: false
                        });
                    });
                } else {
                    res.render('index', {
                        successAuthentication: false
                    });
                }
            });
        } else if(lastUser.length === 0) {
            conn.query(`SELECT user_id
                        FROM users
                        WHERE telephone = ${req.body.telephone} 
                        OR email = '${req.body.email}' `, (err, existingUser) => {
                if (err) {throw err;}
                if (existingUser.length === 0) {
                    conn.query(`INSERT INTO users 
                                VALUE(1, 
                                    '${req.body.userSurname}', 
                                    '${req.body.userName}', 
                                    '${req.body.userPatronymic}',
                                    '${req.body.email}',
                                    '${req.body.telephone}',
                                    '${req.body.password}',
                                    '')`, (err) => {
                        if (err) {throw err;}
                        res.render('index', {
                            successAuthentication: false
                        });
                    });
                } else {
                    res.render('index', {
                        successAuthentication: false
                    });
                }
            });
        } else if (err) { 
            throw err;
        }
    });
});
app.post("/signIn", urlencodedParser, (req, res) => {
    if (!req.body) return res.sendStatus(400);
    conn.query(`SELECT  user_id,
                        user_name, 
                        user_surname 
                FROM users 
                WHERE (${(req.body.login.match(/^\d+$/) !== null) ? 
                      `telephone=${req.body.login}` : 
                      `email='${req.body.login}'`}) 
                       AND password='${req.body.password}'`,
                    (err, users) => {
        if (err) {throw err;}
        if (typeof users[0] === "object" && users[0] !== undefined) {
            req.session.userName = `${users[0].user_name} ${users[0].user_surname}`;
            req.session.isWorker = false;
            req.session.successAuthentication = true;
            req.session.userId = users[0].user_id;
            res.render('index', {
                userName: req.session.userName,
                successAuthentication: req.session.successAuthentication,
                isWorker: req.session.isWorker 
            });
        } else if (users[0] === undefined) {
            conn.query(`SELECT  worker_id,
                                worker_name, 
                                worker_surname 
                        FROM worker 
                        WHERE (${(req.body.login.match(/^\d+$/) !== null) ? 
                                    `telephone=${req.body.login}` : 
                                    `email='${req.body.login}'`}) AND
                                    password='${req.body.password}'`, (workerSelectErr, worker) => {
                if (workerSelectErr) {throw workerSelectErr;}
                if (typeof worker[0] === "object" && worker[0] !== undefined) {
                    req.session.userName = `${worker[0].worker_name} ${worker[0].worker_surname}`;
                    req.session.isWorker = true;
                    req.session.successAuthentication =  true;
                    req.session.workerId = worker[0].worker_id;
                    res.render('index', {
                        userName: req.session.userName,
                        successAuthentication: req.session.successAuthentication,
                        isWorker: req.session.isWorker 
                    });
                }                                                                    
            });
        }
    });
});
app.post("/resetPassword", urlencodedParser, (req, res) => {
    if (!req.body.email) return res.sendStatus(400);
    conn.query(`SELECT  user_name, 
                        email 
                FROM users 
                WHERE email='${req.body.email}'`, (err, selUser) => {
        if (err) {throw err;}
        if (typeof selUser[0] === "object" && 
            selUser[0] !== undefined) {
            let newPassword = generatePassword.generatePassword();
            conn.query(`UPDATE users SET password = '${newPassword}' 
                        WHERE email = '${req.body.email}'`, (err) => {
                if (err) {throw err;}
                sendMail({
                    from: 'internet-magazine@domain.com',
                    to: `${req.body.email}`,
                    subject: 'Восстановление пароля',
                    html: ` <p  style="font-family: Arial, Helvetica, sans-serif; background-color: #4c84c7;color: #fff;">
                                Здраствуйте, ${selUser[0].user_name}! Это письмо для восстановление пароля
                            </p>
                            <p style="font-family: Arial, Helvetica, sans-serif; background-color: #4c84c7; color: #fff;">
                                Ваш новый пароль: <strong>${newPassword}</strong>
                            </p>`
                    }, (err, reply) => {
                    if (err) {throw err;}
                    res.render('index', {
                        userName: req.session.userName,
                        successAuthentication: req.session.successAuthentication,
                        isWorker: req.session.isWorker
                    });
                });
            });
        }
    });
});
app.post("/addProduct", urlencodedParser, (req, res) => {
    if (req.session.successAuthentication === true && 
        req.session.isWorker === true) {
        conn.query(`SELECT product_id 
                    FROM products
                    ORDER BY product_id DESC LIMIT 1`, (err, lastProduct) => {
            if (err) {throw err;}
            if (lastProduct.length > 0) {
                if (lastProduct.length > 0) {
                    conn.query(`INSERT INTO products 
                                VALUE(${(lastProduct.length > 0) ? lastProduct[0].product_id + 1 : 1}, 
                                        '${req.body.productName}', 
                                        '${"productImages/" + req.file.originalname}',
                                        '${req.body.descriptionProduct}',
                                        '${req.body.productAmount}',
                                        '${req.body.productCountStock}',
                                         ${req.body.productCategoryId})`, err => {
                        if (err) {throw err;}
                        res.render('index', {
                            userName: req.session.userName,
                            successAuthentication: req.session.successAuthentication,
                            isWorker: req.session.isWorker
                        });
                    });
                } else {
                    res.sendStatus(500);
                }
            } if (lastProduct.length === 0) {
                conn.query(`INSERT INTO products
                            VALUE(1, 
                                 '${req.body.productName}', 
                                 '${"productImages/" + req.file.originalname}',
                                 '${req.body.descriptionProduct}',
                                 '${req.body.productAmount}',
                                 '${req.body.productCountStock}',
                                  ${req.body.productCategoryId})`, err => {
                    if (err) {throw err;}
                    res.render('index', {
                        userName: req.session.userName,
                        successAuthentication: req.session.successAuthentication,
                        isWorker: req.session.isWorker
                    });
                });
            }
        });
    } else {
       res.sendStatus(500);
    }
});
app.post('/addToCart', (req, res) => {
    if (req.body.product_id !== undefined && 
        req.session.isWorker === false) {
        conn.query(`SELECT order_id 
                    FROM orders
                    WHERE user_id = ${req.session.userId}
                    AND status = '${orderStatus[1]}'`, (err, selectCartRes) => {
            if (err) {throw err};
            if (selectCartRes.length > 0) {
                conn.query(`SELECT product_count 
                            FROM order_product INNER JOIN orders 
                            ON order_product.order_id = orders.order_id
                            WHERE orders.order_id = ${selectCartRes[0].order_id} 
                            AND product_id = ${req.body.product_id}
                            AND orders.status = '${orderStatus[1]}'`, (err, selectProduct) => {
                    if (err) {throw err;}
                    if (selectProduct.length === 0) {
                        conn.query(`INSERT INTO order_product 
                                    VALUE(${selectCartRes[0].order_id},
                                          ${req.body.product_id},
                                          1)`, (err) => {
                            if (err) {throw err;}
                            res.sendStatus(200);
                        });
                    } else {
                        res.sendStatus(500);
                    }
                });
            } else if (selectCartRes.length === 0) {
                conn.query(`SELECT order_id, 
                                   user_id 
                            FROM orders
                            ORDER BY order_id DESC LIMIT 1`, (err, selLastCart) => {
                    if (err) {throw err;}
                    conn.query(`INSERT INTO orders
                                VALUE(${(selLastCart.length !== 0) ? selLastCart[0].order_id + 1 : 1},
                                      ${req.session.userId},
                                      CURDATE(),
                                      0,
                                      '${orderStatus[1]}')`, (err) => {
                        if (err) {throw err;}
                        conn.query(`INSERT INTO order_product
                                    VALUE(${(selLastCart.length !== 0) ? selLastCart[0].order_id + 1 : 1},
                                          ${req.body.product_id},
                                          1)`, (err) => {
                            if (err) {throw err;}
                            res.sendStatus(200);
                        });
                    });
                });
            }
        });
    } else {
        res.sendStatus(500);
    }
});
app.post('/changeCountByButton', (req, res) => {
    if (req.body.product_id !== undefined && req.body.product_count >= 1) {
        conn.query(`SELECT products.product_id, 
                           products.product_count_stock
                    FROM orders
                    INNER JOIN order_product ON orders.order_id = order_product.order_id
                    INNER JOIN products ON order_product.product_id = products.product_id
                    WHERE order_product.product_id = ${req.body.product_id} 
                    AND orders.user_id = ${req.session.userId}`, (err, cart) => {
            if (err) {throw err;}
            if (cart.length > 0) {
                if (req.body.action === 'plus' && 
                    req.body.nodeName === 'BUTTON') {
                    if (req.body.product_count > cart[0].product_count_stock) {
                        res.sendStatus(500);
                    } else {
                        conn.query(`UPDATE order_product INNER JOIN orders
                                    ON order_product.order_id = orders.order_id 
                                    SET order_product.product_count = order_product.product_count + 1 
                                    WHERE orders.user_id = ${req.session.userId} 
                                    AND order_product.product_id = ${req.body.product_id};`, err =>{
                            if (err) {throw err;}
                            res.sendStatus(200);
                        });
                    }
                } else if (req.body.action === 'minus' && 
                          req.body.nodeName === 'BUTTON' && 
                          req.body.product_count > 0) {
                    if (req.body.product_count <= 1) {
                        conn.query(`DELETE order_product FROM order_product INNER JOIN orders
                                    ON order_product.order_id = orders.order_id
                                    WHERE order_product.product_id = ${req.body.product_id}
                                    AND orders.user_id = ${req.session.userId}`, err => {
                            if (err) {throw err;}
                            res.sendStatus(200);
                        });
                    } else if (req.body.product_count <= cart[0].product_count_stock) {
                        conn.query(`UPDATE order_product INNER JOIN orders
                                    ON order_product.order_id = orders.order_id
                                    SET order_product.product_count = ${req.body.product_count - 1}
                                    WHERE order_product.product_id = ${req.body.product_id}
                                    AND orders.user_id = ${req.session.userId}`, err => {
                            if (err) {throw err;} 
                            res.sendStatus(200);
                        });
                    } 
                } else {
                    res.status(500).send('Неправильное действие или nodeName');
                }
            } else {
                res.status(500).send('Неправильный id товара');
            }
        });
    } else {
        res.status(500).send('Неверное действие или нет id продукта');
    }
});
app.post('/changeCountByInput', (req, res) => {
    if (req.body.product_id !== undefined && 
        req.body.product_count >= 1) {
        conn.query(`SELECT products.product_id, 
                           products.product_count_stock
                    FROM orders
                    INNER JOIN order_product ON orders.order_id = order_product.order_id
                    INNER JOIN product ON order_product.product_id = products.product_id
                    WHERE order_product.product_id = ${req.body.product_id} 
                    AND orders.user_id = ${req.session.userId}`, (err, cart) => {
            if (err) {throw err;}
            if (cart.length > 0) {
                if (req.body.nodeName === 'INPUT' &&
                    req.body.action === 'changeByInput' &&
                    req.body.product_count >= 1 &&
                    req.body.product_count <= cart[0].product_count_stock) {
                    conn.query(`UPDATE order_product INNER JOIN orders
                                ON order_product.order_id = orders.order_id
                                SET order_product.product_count = ${req.body.product_count}
                                WHERE order_product.product_id = ${req.body.product_id}
                                AND orders.user_id = ${req.session.userId}`, err => {
                        if (err) {throw err;}
                        res.sendStatus(200);
                    });
                } else {
                    res.status(500).send({stock : cart[0].product_count_stock});
                }
            }
        });
    } else {
        res.sendStatus(500);
    }
});
app.post('/deleteProductInCart', (req, res) => {
    if (req.body.product_id > 0 &&
        req.body.action === 'delete' && 
        req.body.nodeName === 'BUTTON') {
        conn.query(`DELETE order_product FROM order_product INNER JOIN orders
            ON order_product.order_id = orders.order_id
            WHERE order_product.product_id = ${req.body.product_id}
            AND orders.user_id = ${req.session.userId}`, err => {
            if (err) {throw err;}
            res.sendStatus(200);
        });
    } else {
        res.status(500).send('Не удалось удалить товар из корзины');
    }
});
app.post('/orderRegistration', (req, res) => {
    if (req.session.successAuthentication === true &&
        req.session.isWorker === false) {
        conn.query(`SELECT  orders.order_id,
                            orders.order_date,
                            product_name,
                            product_amount,
                            order_product.product_count 
                    FROM orders INNER JOIN order_product
                    ON orders.order_id = order_product.order_id INNER JOIN products
                    ON order_product.product_id = products.product_id
                    WHERE orders.order_id IN(
                        SELECT order_id 
                        FROM orders
                        WHERE user_id=${req.session.userId}
                        AND status = '${orderStatus[1]}')
                    AND status = '${orderStatus[1]}'`, (err, selProductId) => {
            if (err) {throw err;}
            if (selProductId.length > 0) {
                let productsInOrderHTML = '';
                let totalAmount = 0;
                for (let i = 0; i < selProductId.length; i++) {
                    productsInOrderHTML += `<tr>
                                                <td>
                                                    ${selProductId[i].product_name}
                                                </td>
                                                <td>
                                                    ${selProductId[i].product_count}
                                                </td>
                                                <td>
                                                    ${selProductId[i].product_amount}
                                                </td>
                                            </tr>`;
                    totalAmount +=  selProductId[i].product_count *
                                    selProductId[i].product_amount
                }
                conn.query(`UPDATE orders 
                            SET status = '${orderStatus[0]}',
                                total_cost = ${totalAmount}
                            WHERE user_id = ${req.session.userId}
                            AND order_id = ${selProductId[0].order_id}`, err => {
                    if (err) {throw err;}
                    conn.query(`SELECT email
                                FROM users
                                WHERE user_id = ${req.session.userId}`, (err, email) => {
                        if (err) {throw err;}
                        if(email.length > 0) {
                            // sendMail({
                            //     from: 'internet-magazine@domain.com',
                            //     to: `${email[0].email}`,
                            //     subject: 'Заказ с Интернет-магазина',
                            //     html: `<div style="font-family: Arial, Helvetica, sans-serif; background-color: #4c84c7; color: #fff;">
                            //                Ваш заказ № ${selProductId[0].order_id} от ${selProductId[0].order_date} принят к обработке
                            //            </div>
                            //            <table>
                            //                <thead>
                            //                  <tr>
                            //                      <th>Наименование товара</th>
                            //                      <th>Количество</th>
                            //                      <th>Дата</th>
                            //                      <th>Стоимость</th>
                            //                  </tr>
                            //                </thead>  
                            //                <tbody>
                            //                  ${productsInOrderHTML}
                            //                  <tr>
                            //                     <td colspan="2" ><strong>Итоговая стоимость:</strong></td>
                            //                     <td colspan="2" ><strong>Итоговая стоимость:</strong></td>
                            //                     <td><strong>${totalAmount}</strong></td>
                            //                  </tr>
                            //                </tbody>
                            //            </table>`
                            //   }, err => {
                            //     if (err) {throw err;}
                                res.render('index', {
                                    userName: req.session.userName,
                                    successAuthentication: req.session.successAuthentication,
                                    isWorker: req.session.isWorker
                                });
                            // });
                        }
                    });
                });
            } else {
                res.send('Произошла ошибка, пожалуйста, попробуйте позднее 1');
            }
        });        
    } else {
        res.send('Произошла ошибка. Пожалуйста, повторите попытку позже');
    }
});

/* Для диплома. Продажи за период */
// app.post('/getSalesByRange', urlencodedParser, (req, res) => {
//     if (isNaN(Date.parse(req.body.startDate)) === false &&
//         isNaN(Date.parse(req.body.endDate)) === false )  {
//         conn.query(`SELECT  products.product_name,
//                             products.product_amount,
//                             product_category.category_name,
//                             order_product.product_count,
//                             users.user_name,
//                             orders.order_date
//                     FROM users INNER JOIN orders
//                     ON users.user_id = orders.user_id INNER JOIN order_product
//                     ON orders.order_id = order_product.order_id INNER JOIN products
//                     ON order_product.product_id = products.product_id INNER JOIN product_category
//                     ON products.product_category_id = product_category.category_id 
//                     WHERE orders.order_date >= '${req.body.startDate}' 
//                     AND orders.order_date <= '${req.body.endDate}';`, (err, salesByRange) => {
//             if(err) {throw err;}
//             res.render('salesByRange', {
//                 userName: req.session.userName,
//                 successAuthentication: req.session.successAuthentication,
//                 isWorker: req.session.isWorker,
//                 salesByRange
//             });
//         });
//     }
// });
app.post('/addWorker', urlencodedParser, (req, res) =>{
    if (!req.body) return res.sendStatus(400);
    if (req.session.successAuthentication === true && 
        req.session.isWorker === true) {
            console.log(req.body);
            
        // conn.query(`SELECT worker_id 
        //             FROM worker
        //             ORDER BY worker_id 
        //             DESC LIMIT 1`, (err, lastWorker) => {
        //     if (err) {throw err;}
        //     if (lastWorker.length > 0) {
        //         conn.query(`SELECT worker_id
        //                     FROM worker
        //                     WHERE telephone = ${req.body.telephone} 
        //                     OR email = '${req.body.email}' `, (err, existingWorker) => {
        //             if (err) {throw err;}
        //             if (existingWorker.length === 0) {
        //                 conn.query(`INSERT INTO worker
        //                             VALUE(${req.body.workerId},
        //                                 '${req.body.name}',
        //                                 '${req.body.surname}',
        //                                 '${req.body.patronymic}',
        //                                 '${req.body.email}',
        //                                 ${req.body.telephone},
        //                                 '${req.body.password}',
        //                                 ${req.body.position});`, err => {
        //                     if (err) {throw err;}
        //                     res.render('index', {
        //                         userName: req.session.userName,
        //                         successAuthentication: req.session.successAuthentication,
        //                         isWorker: req.session.isWorker
        //                     });
        //                 });
        //             }
        //         });
        //     }
        // });
    } else {
        res.sendStatus(500);
    }
});
app.post('/addPosition', urlencodedParser, (req, res) =>{
    if (!req.body) return res.sendStatus(400);
    if (req.session.successAuthentication === true && 
        req.session.isWorker === true) {
        conn.query(`SELECT  position_id
                FROM position
                ORDER BY position_id 
                DESC LIMIT 1`, (err, lastPositionId) => {
            if (err) {throw err};
            conn.query(`INSERT INTO position
                        VALUE(${(lastPositionId.length > 0) ? +lastPositionId[0].position_id + 1: 1},
                            '${req.body.positionName}');`, err => {
                if (err) {throw err;}
                res.render('index', {
                    userName: req.session.userName,
                    successAuthentication: req.session.successAuthentication,
                    isWorker: req.session.isWorker
                });
            });
        });
    } else {
        res.sendStatus(500);
    }
});
app.post('/addProductCategory', urlencodedParser, (req, res) =>{
    if (!req.body) return res.sendStatus(400);
    if (req.session.successAuthentication === true && 
        req.session.isWorker === true) {
        conn.query(`SELECT  category_id
                    FROM product_category
                    ORDER BY category_id 
                    DESC LIMIT 1`, (err, lastCategoryId) => {
            if (err) {throw err};
            conn.query(`INSERT INTO product_category
                        VALUE(${(lastCategoryId.length > 0) ? +lastCategoryId[0].category_id + 1 : 1},
                             '${req.body.categoryName}');`, err => {
                if (err) {throw err;}
                res.render('index', {
                    userName: req.session.userName,
                    successAuthentication: req.session.successAuthentication,
                    isWorker: req.session.isWorker
                });
            });
        });
    } else {
        res.sendStatus(500);
    }
});

app.listen(3000);