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

session.cart = {};

const connection = mysql.createPool({
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
    if(file.mimetype === "image/png"){
        cb(null, true);
    } else{
        cb(null, false);
    }
 }

const urlencodedParser = bodyParser.urlencoded({extended: false});

const options = {
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

app.use(express.static(path.join(__dirname, 'public')));
app.use(multer({storage:storageConfig, fileFilter: fileFilter}).single("filedata"));
app.use(cookieParser());
app.use(express.json());
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(options),
    cookie: {
        path: "/",
        httpOnly: true,
        maxAge: null
    },
}));

app.set("view engine", "pug");

app.get("/", urlencodedParser, function (req, response) {
    if(req.session.userName  && req.session.successAuthentication) {
        response.render('index', {
            userName: req.session.userName,
            successAuthentication: req.session.successAuthentication,
            isWorker: req.session.isWorker
        });
    } else {
        response.render('index', {
            successAuthentication: false
        })
    }
});
app.get("/signUp", urlencodedParser, function (req, response) {
    response.sendFile(`${__dirname}/public/html/signUp.html`);
});
app.get("/signIn", urlencodedParser, function (req, response) {
    response.sendFile(`${__dirname}/public/html/signIn.html`);
});
app.get("/signOut", urlencodedParser, function (req, response) {
    req.session.destroy(function(err) {
        if(err) {throw err};
        return response.redirect(302, '/');
    })
});
app.get("/resetPassword", urlencodedParser, function (req, response) {
    response.sendFile(`${__dirname}/public/html/resetPassword.html`);
});
app.get("/addProduct", urlencodedParser, function (req, response) {
    if(req.session.successAuthentication && req.session.isWorker) {
        response.render('addProduct', {
            userName: req.session.userName,
            successAuthentication: req.session.successAuthentication,
            isWorker: req.session.isWorker 
        });
    } else {
        response.redirect(302, '/');
    }
});
app.get("/productList", urlencodedParser, function (req, response) {
    connection.query(`SELECT product_id,
                             product_name,
                             product_url_img,
                             product_amount 
                      FROM productList`, (err, productList) => {
        if(productList) {
            response.render('productList', {
                userName: req.session.userName,
                successAuthentication: req.session.successAuthentication,
                isWorker: req.session.isWorker, 
                productList : productList
            });
        } else if(err) {
            throw err;
        }
    });
});
app.get('/cart', (req, res) => {
    if(req.session.successAuthentication && req.session.userId) {
        connection.query(`SELECT * 
                          FROM orderList
                          WHERE user_id=${req.session.userId}`, (selectErr, selectResult) => {
            if(selectErr) {throw selectErr;}
            if(typeof selectResult[0] === "object" && selectResult[0] !== undefined) {
                let productListWithSort  = selectResult[0].product_ids.split(',')
                                                                      .sort((a,b) => a.split(":")[0]-b.split(":")[0]);
                let productIds = [];
                productListWithSort.forEach(e => productIds.push(e.split(':')[0]));
                connection.query(`SELECT product_id,
                                         product_name,
                                         product_url_img,
                                         product_description,
                                         product_amount,
                                         product_count_stock 
                                  FROM productList 
                                  WHERE product_id IN(${productIds.toString()})`, (selectErr, selectResult) => {
                    if(selectErr) {throw selectErr;}
                    if(selectResult) {
                        for (let i = 0; i < selectResult.length; i++) {
                            selectResult[i].product_count=productListWithSort[i].split(':')[1];
                        }
                        res.render('cart', {
                            userName: req.session.userName,
                            successAuthentication: req.session.successAuthentication,
                            isWorker: req.session.isWorker, 
                            productList : selectResult,
                        });
                    }
                });
            } else {
                res.render('cart', {
                    userName: req.session.userName,
                    successAuthentication: req.session.successAuthentication,
                    isWorker: req.session.isWorker, 
                });
            }
        });
    }
});

app.post("/signUp", urlencodedParser, function (req, response) {
    if(!req.body) return response.sendStatus(400);
    connection.query(`SELECT user_id 
                      FROM users 
                      ORDER BY user_id DESC LIMIT 1`,
                    (err, users) => {
        if(err) {throw err;}
        if (typeof users[0] === "object" && users[0] !== undefined){
            connection.query(`insert into users values(${(users.length != 0) ? users[0].user_id + 1 : 1}, 
                                                      '${req.body.userSurname}', 
                                                      '${req.body.userName}', 
                                                      '${req.body.userPatronymic}',
                                                      '${req.body.email}',
                                                      '${req.body.telephone}',
                                                      '${req.body.password}')`, (insertErr, insertResult) => {
                if(insertErr) {throw insertErr;}
                response.render('index', {
                    successAuthentication: false
                });
            });
        } else if(err) { 
            throw err;
        }
    });
});
app.post("/signIn", urlencodedParser, function (req, response) {
    if(!req.body) return response.sendStatus(400);
    connection.query(`SELECT user_id,
                             user_name, 
                             user_surname 
                      FROM users 
                      WHERE (${(req.body.login.match(/^\d+$/) !== null) ? 
                        `telephone=${req.body.login}` : 
                        `email='${req.body.login}'`}) AND
                         password='${req.body.password}'`,
                    (err, users) => {
        if(err) {throw err;}
        if(typeof users[0] === "object" && users[0] !== undefined) {
            req.session.userName = `${users[0].user_name} ${users[0].user_surname}`;
            req.session.isWorker = false;
            req.session.successAuthentication = true;
            req.session.userId = users[0].user_id;
            response.render('index', {
                userName: req.session.userName,
                successAuthentication: req.session.successAuthentication,
                isWorker: req.session.isWorker 
            });
        } else if(users[0] === undefined) {
            connection.query(`SELECT worker_id,
                                     worker_name, 
                                     worker_surname 
                              FROM worker 
                              WHERE (${(req.body.login.match(/^\d+$/) !== null) ? 
                                `telephone=${req.body.login}` : 
                                `email='${req.body.login}'`}) AND
                                 password='${req.body.password}'`, (workerSelectErr, worker) => {
                if(workerSelectErr) {throw workerSelectErr;}
                if(typeof worker[0] === "object" && worker[0] !== undefined) {
                    req.session.userName = `${worker[0].worker_name} ${worker[0].worker_surname}`;
                    req.session.isWorker = true;
                    req.session.successAuthentication =  true;
                    req.session.workerId = worker[0].worker_id;
                    response.render('index', {
                        userName: req.session.userName,
                        successAuthentication: req.session.successAuthentication,
                        isWorker: req.session.isWorker 
                    });
                }                                                                    
            });
        }
    });
});
app.post("/resetPassword", urlencodedParser, function (req, response) {
    if(!req.body) return response.sendStatus(400);
    connection.query(`SELECT user_name, 
                             email 
                      FROM users 
                      WHERE email='${req.body.email}'`, (err, selectResult) => {
        
        if(typeof selectResult[0] === "object" && selectResult[0] !== undefined) {
            let newPassword = generatePassword.generatePassword();
            connection.query(`UPDATE users SET password = '${newPassword}' 
                              WHERE email = '${req.body.email}'`, (updateErr, updateResult) => {
                if(updateErr) {throw updateErr;}
                if(typeof updateResult[0] === "object" && updateResult[0] !== undefined) {
                    sendMail({
                        from: 'internet-magazine@domain.com',
                        to: `${req.body.email}`,
                        subject: 'Восстановление пароля',
                        html: `<p  style="font-family: Arial, Helvetica, sans-serif; background-color: #4c84c7;color: #fff;">
                                Здраствуйте, ${selectResult[0].user_name}! Это письмо для восстановление пароля
                                </p>
                                <p style="font-family: Arial, Helvetica, sans-serif; background-color: #4c84c7; color: #fff;">Ваш новый пароль: <strong>${newPassword}</strong></p>`
                      }, function(err, reply) {
                        console.log(err && err.stack);
                        console.dir(reply);
                    });
                    response.render('index', {
                        userName: req.session.userName,
                        successAuthentication: req.session.successAuthentication,
                        isWorker: req.session.isWorker
                    })
                }
            });
        } else if(err !== null) {
            throw err;
        }
    });
});
app.post("/addProduct", urlencodedParser, function (req, response) {
    if(req.session.successAuthentication && req.session.isWorker) {
        connection.query(`SELECT product_id 
                          FROM productList 
                          ORDER BY product_id DESC LIMIT 1`, (selectErr, selectResult) => {
            if(typeof selectResult[0] === "object" && selectResult[0] !== undefined) {
                connection.query(`INSERT INTO productList 
                                  VALUES(${(selectResult.length != 0) ? selectResult[0].product_id + 1 : 1}, 
                                        '${req.body.productName}', 
                                        '${"productImages/" + req.file.originalname}',
                                        '${req.body.descriptionProduct}',
                                        '${req.body.productAmount}')`, (insertErr, insertResult) => {
                    if(insertResult) {
                        response.render('index', {
                            userName: req.session.userName,
                            successAuthentication: req.session.successAuthentication,
                            isWorker: req.session.isWorker
                        });
                    } else if(insertErr) {
                        throw insertErr;
                    }
                });
            } else if(selectErr) {
                throw selectErr;
            }
        });
    } else {
        response.send('Не удалось добавить продукт в корзину')
    }
});
app.post('/addToCart', (req, res) => {
    if(req.body.product_id) {
        connection.query(`SELECT product_id, 
                                product_name,
                                product_amount
                          FROM productList 
                          WHERE product_id = ${req.body.product_id}`, (productListErr, productListResult) => {
            if(productListErr) {throw productListErr;}
            if(typeof productListResult[0] === "object" && productListResult[0] !== undefined) {
                connection.query(`SELECT user_id,
                                         product_ids 
                                  FROM orderList 
                                  WHERE user_id = ${req.session.userId}`, (orderListErr, orderListResult) => {
                    if(orderListErr) {throw orderListErr;}
                    if(typeof orderListResult[0] === "object" && orderListResult[0] !== undefined) {
                        let customShoppingCart = orderListResult[0].product_ids.split(',');
                        for(let i = 0; i < customShoppingCart.length; i++) {
                            let currentProductArray = customShoppingCart[i].split(':');
                            if(currentProductArray[0] === req.body.product_id) {
                                let currentProduct;
                                currentProductArray[1] = parseInt(currentProductArray[1]) + 1;
                                currentProduct = `${currentProductArray[0]}:${currentProductArray[1]}`;
                                customShoppingCart[i] = currentProduct;
                                connection.query(`UPDATE orderList 
                                                    SET product_ids = '${customShoppingCart.toString()}'
                                                    WHERE user_id = ${req.session.userId}`, (updateErr, updateResult) => {
                                    if(updateErr) {throw updateErr;}
                                });
                                break;
                            } else if(i === customShoppingCart.length -1 && customShoppingCart[i].split(':')[0] !== req.body.product_id) {
                                customShoppingCart.push(`${req.body.product_id}:1`);
                                connection.query(`UPDATE orderList 
                                                    SET product_ids = '${customShoppingCart.toString()}'
                                                    WHERE user_id = ${req.session.userId}`, (updateErr, updateResult) => {
                                    if(updateErr) {throw updateErr;}
                                });
                                break;
                            }
                        }
                    } else if(orderListResult[0] === undefined) {
                        connection.query(`SELECT order_id 
                                          FROM orderList 
                                          ORDER BY order_id 
                                          DESC LIMIT 1`,(selectErr, selectResult) => {
                            if(selectErr) {throw selectErr;}
                                connection.query(`INSERT INTO orderList
                                                  VALUES(${(selectResult.length !== 0) ? selectResult[0].order_id + 1 : 1},
                                                         ${req.session.userId},
                                                         '${req.body.product_id}:1')`, (insertErr, insertResult) => {
                                    if(insertErr) {throw insertErr;}
                                    console.log("Первый заказ добавлен в корзину в корзину");                        
                                });
                        });
                    }
                }); 
            }
        })
    } else {
        res.send('0');
    }
});
app.post('/changeCountProductInCart', (req, res) => {
    if(req.body.product_id !== undefined && (typeof req.body.action) === 'string') {
        if(req.body.action === 'plus') {
            connection.query(`SELECT user_id,
                                     product_ids 
                              FROM orderList 
                              WHERE user_id = ${req.session.userId}`, (selectErr, selectResult) => {
                if(selectErr) {throw selectErr;}
                if(typeof selectResult[0] === "object" && selectResult[0] !== undefined ) {
                    let customShoppingCart = selectResult[0].product_ids.split(',');
                    for(let i = 0; i < customShoppingCart.length; i++) {
                        let currentProductArray = customShoppingCart[i].split(':');
                        if(currentProductArray[0] === req.body.product_id) {
                            let currentProduct;
                            currentProductArray[1] = parseInt(currentProductArray[1]) + 1;
                            currentProduct = `${currentProductArray[0]}:${currentProductArray[1]}`;
                            customShoppingCart[i] = currentProduct;
                            connection.query(`UPDATE orderList 
                                              SET product_ids = '${customShoppingCart.toString()}'
                                              WHERE user_id = ${req.session.userId}`, (updateErr, updateResult) => {
                                if(updateErr) {throw updateErr;}
                                res.sendStatus(200);
                            });
                        }
                    }
                }                
            });
        } else if(req.body.action === 'minus') {
            connection.query(`SELECT user_id,
                                     product_ids 
                              FROM orderList 
                              WHERE user_id = ${req.session.userId}`, (selectErr, selectResult) => {
                if(selectErr) {throw selectErr;}
                if(typeof selectResult[0] === "object" && selectResult[0] !== undefined ) {
                    let customShoppingCart = selectResult[0].product_ids.split(',');

                    for(let i = 0; i < customShoppingCart.length; i++) {
                        let currentProductArray = customShoppingCart[i].split(':');
                        if(currentProductArray[0] === req.body.product_id) {
                            let currentProduct;
                            currentProductArray[1]--;
                            currentProduct = `${currentProductArray[0]}:${currentProductArray[1]}`;
                            customShoppingCart[i] = currentProduct;
                            connection.query(`UPDATE orderList 
                                                SET product_ids = '${customShoppingCart.toString()}'
                                                WHERE user_id = ${req.session.userId}`, (updateErr, updateResult) => {
                                if(updateErr) {throw updateErr;}
                                res.sendStatus(200);
                            });
                        }
                    }
                }                
            });
        }
    } else {
        res.send('Неверное действие или нет id продукта');
    }
});


app.listen(3000);



