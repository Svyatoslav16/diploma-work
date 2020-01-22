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
    if(file.mimetype === "image/png"){
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
app.get("/", urlencodedParser, (req, res) => {
    if(req.session.userName  && req.session.successAuthentication) {
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
        if(err) {throw err};
        return res.redirect(302, '/');
    });
});
app.get("/resetPassword", urlencodedParser, (req, res) => {
    res.sendFile(`${__dirname}/public/html/resetPassword.html`);
});
app.get("/addProduct", urlencodedParser, (req, res) => {
    if(req.session.successAuthentication && req.session.isWorker) {
        res.render('addProduct', {
            userName: req.session.userName,
            successAuthentication: req.session.successAuthentication,
            isWorker: req.session.isWorker 
        });
    } else {
        res.redirect(302, '/');
    }
});
app.get("/productList", urlencodedParser, (req, res) => {
    conn.query(`SELECT  product_id,
                        product_name,
                        product_url_img,
                        product_amount 
                FROM productList`, (err, productList) => {
        if(productList) {
            res.render('productList', {
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
    if(req.session.successAuthentication && 
       req.session.userId && 
       !req.session.isWorker) {
        conn.query(`SELECT * 
                    FROM cartList
                    WHERE user_id=${req.session.userId}`, (selectErr, selectResult) => {
            if(selectErr) {throw selectErr;}
            if(typeof selectResult[0] === "object" && 
               selectResult[0] !== undefined && 
               selectResult[0].product_ids !== '') {
                let productIdArray = [];
                let productListWithSort = (selectResult[0].product_ids.length > 3) ? selectResult[0].product_ids.split(',')
                                                                      .sort((a,b) => a.split(":")[0]-b.split(":")[0]) : selectResult[0].product_ids.split(':')[0];
                if(typeof productListWithSort === 'object') {
                    productListWithSort.forEach(e => productIdArray.push(e.split(':')[0]))
                } else if(typeof productListWithSort === 'string') {
                    productIdArray = productListWithSort;
                }
                conn.query(`SELECT  product_id,
                                    product_name,
                                    product_url_img,
                                    product_description,
                                    product_amount,
                                    product_count_stock 
                            FROM productList 
                            WHERE product_id IN(${productIdArray.toString()})`, (selectProductListErr, selectProductListResult) => {
                    if(selectProductListErr) {throw selectProductListErr;}
                    if(typeof selectProductListResult[0] === "object" && selectProductListResult[0] !== undefined) {
                        let totalAmountCount = 0;
                        let totalAmount = 0;
                        if(typeof productListWithSort === "object") {
                            for (let i = 0; i < selectProductListResult.length; i++) {
                                selectProductListResult[i].product_count = productListWithSort[i].split(':')[1];
                                totalAmountCount++;
                                totalAmount += selectProductListResult[i].product_count * 
                                                selectProductListResult[i].product_amount;
                            }
                        } else if(typeof productIdArray === 'string') {
                            selectProductListResult[0].product_count = selectResult[0].product_ids.split(':')[1];
                            totalAmount += selectProductListResult[0].product_count *
                                            selectProductListResult[0].product_amount;
                            totalAmountCount++;
                        }
                        conn.query(`UPDATE cartList SET total_amount = ${totalAmount}
                                    WHERE user_id = ${req.session.userId}`, (updateErr, updateResult) => {
                            if(updateErr) {throw updateErr;}
                            res.render('cart', {
                                userName: req.session.userName,
                                successAuthentication: req.session.successAuthentication,
                                isWorker: req.session.isWorker, 
                                productList: selectProductListResult,
                                total_amount: totalAmount,
                                total_amount_count: totalAmountCount
                            });
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
app.get('/orderRegistration', (req, res) => {
    if(req.session.successAuthentication && 
        req.session.userId && 
        !req.session.isWorker) {
        conn.query(`SELECT * 
                    FROM cartList
                    WHERE user_id=${req.session.userId}`, (selectErr, selectResult) => {
            if(selectErr) {throw selectErr;}
            if(typeof selectResult[0] === "object" && 
            selectResult[0] !== undefined && 
            selectResult[0].product_ids !== '') {
                let productIdArray = [];
                let productListWithSort = (selectResult[0].product_ids.length > 3) ? selectResult[0].product_ids.split(',')
                                                                    .sort((a,b) => a.split(":")[0]-b.split(":")[0]) : selectResult[0].product_ids.split(':')[0];
                if(typeof productListWithSort === 'object') {
                    productListWithSort.forEach(e => productIdArray.push(e.split(':')[0]))
                } else if(typeof productListWithSort === 'string') {
                    productIdArray = productListWithSort;
                }
                conn.query(`SELECT  product_id,
                                    product_name,
                                    product_url_img,
                                    product_description,
                                    product_amount,
                                    product_count_stock 
                            FROM productList 
                            WHERE product_id IN(${productIdArray.toString()})`, (selectProductListErr, selectProductListResult) => {
                    if(selectProductListErr) {throw selectProductListErr;}
                    if(typeof selectProductListResult[0] === "object" && selectProductListResult[0] !== undefined) {
                        let totalAmountCount = 0;
                        let totalAmount = 0;
                        if(typeof productListWithSort === "object") {
                            for (let i = 0; i < selectProductListResult.length; i++) {
                                selectProductListResult[i].product_count = productListWithSort[i].split(':')[1];
                                totalAmountCount++;
                                totalAmount += selectProductListResult[i].product_count * 
                                                selectProductListResult[i].product_amount;
                            }
                        } else if(typeof productIdArray === 'string') {
                            selectProductListResult[0].product_count = selectResult[0].product_ids.split(':')[1];
                            totalAmount += selectProductListResult[0].product_count *
                                            selectProductListResult[0].product_amount;
                            totalAmountCount++;
                        }
                        conn.query(`UPDATE cartList SET total_amount = ${totalAmount}
                                    WHERE user_id = ${req.session.userId}`, (updateErr, updateResult) => {
                            if(updateErr) {throw updateErr;}
                            conn.query(`SELECT  user_name,
                                                user_surname,
                                                user_patronymic,
                                                email,
                                                telephone,
                                                address
                                        FROM users
                                        WHERE user_id = ${req.session.userId}`, (selectUserErr, selectUserResult) => {
                                res.render('orderRegistration', {
                                    userName: req.session.userName,
                                    productList: selectProductListResult,
                                    total_amount: totalAmount,
                                    total_amount_count: totalAmountCount,
                                    user_data: selectUserResult[0],
                                    userName: req.session.userName,
                                    successAuthentication: req.session.successAuthentication,
                                    isWorker: req.session.isWorker 
                                }); 
                            });    
                        });
                    } 
                });
            }
        });
    } else {
        res.sendStatus(500);
    }
});

app.post("/signUp", urlencodedParser, (req, res) => {
    if(!req.body) return res.sendStatus(400);
    conn.query(`SELECT user_id 
                FROM users 
                ORDER BY user_id DESC LIMIT 1`, (err, users) => {
        if(err) {throw err;}
        if (typeof users[0] === "object" && users[0] !== undefined){
            conn.query(`SELECT user_id
                        FROM users
                        WHERE   telephone = ${req.body.telephone} or 
                                email = '${req.body.email}' `, (err, existingUser) => {
                if(err) {throw err;}
                if(users[0] === undefined) {
                    conn.query(`INSERT INTO users 
                                VALUES(${(users.length != 0) ? users[0].user_id + 1 : 1}, 
                                    '${req.body.userSurname}', 
                                    '${req.body.userName}', 
                                    '${req.body.userPatronymic}',
                                    '${req.body.email}',
                                    '${req.body.telephone}',
                                    '${req.body.password}')`, (insertErr) => {
                        if(insertErr) {throw insertErr;}
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
        } else if(err) { 
            throw err;
        }
    });
});
app.post("/signIn", urlencodedParser, (req, res) => {
    if(!req.body) return res.sendStatus(400);
    conn.query(`SELECT  user_id,
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
            res.render('index', {
                userName: req.session.userName,
                successAuthentication: req.session.successAuthentication,
                isWorker: req.session.isWorker 
            });
        } else if(users[0] === undefined) {
            conn.query(`SELECT  worker_id,
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
    if(!req.body) return res.sendStatus(400);
    conn.query(`SELECT  user_name, 
                        email 
                FROM users 
                WHERE email='${req.body.email}'`, (err, selectResult) => {
        
        if(typeof selectResult[0] === "object" && selectResult[0] !== undefined) {
            let newPassword = generatePassword.generatePassword();
            conn.query(`UPDATE users SET password = '${newPassword}' 
                        WHERE email = '${req.body.email}'`, (updateErr, updateResult) => {
                if(updateErr) {throw updateErr;}
                if(typeof updateResult[0] === "object" && updateResult[0] !== undefined) {
                    sendMail({
                        from: 'internet-magazine@domain.com',
                        to: `${req.body.email}`,
                        subject: 'Восстановление пароля',
                        html: ` <p  style="font-family: Arial, Helvetica, sans-serif; background-color: #4c84c7;color: #fff;">
                                    Здраствуйте, ${selectResult[0].user_name}! Это письмо для восстановление пароля
                                </p>
                                <p style="font-family: Arial, Helvetica, sans-serif; background-color: #4c84c7; color: #fff;">
                                    Ваш новый пароль: <strong>${newPassword}</strong>
                                </p>`
                      }, (err, reply) => {
                        if(err) {throw err;}
                    });
                    res.render('index', {
                        userName: req.session.userName,
                        successAuthentication: req.session.successAuthentication,
                        isWorker: req.session.isWorker
                    });
                }
            });
        } else if(err !== null) {
            throw err;
        }
    });
});
app.post("/addProduct", urlencodedParser, (req, res) => {
    if(req.session.successAuthentication && req.session.isWorker) {
        conn.query(`SELECT product_id 
                    FROM productList 
                    ORDER BY product_id DESC LIMIT 1`, (selectErr, selectResult) => {
            if(typeof selectResult[0] === "object" && selectResult[0] !== undefined) {
                conn.query(`INSERT INTO productList 
                            VALUES(${(selectResult.length != 0) ? selectResult[0].product_id + 1 : 1}, 
                                    '${req.body.productName}', 
                                    '${"productImages/" + req.file.originalname}',
                                    '${req.body.descriptionProduct}',
                                    '${req.body.productAmount}')`, (insertErr, insertResult) => {
                    if(insertResult) {
                        res.render('index', {
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
       res.sendStatus(500);
    }
});
app.post('/addToCart', (req, res) => {
    if(req.body.product_id) {
        conn.query(`SELECT  product_id, 
                            product_name,
                            product_amount
                    FROM productList 
                    WHERE product_id = ${req.body.product_id}`, (productListErr, productListResult) => {
            if(productListErr) {throw productListErr;}
            if(typeof productListResult[0] === "object" && productListResult[0] !== undefined) {
                conn.query(`SELECT  user_id,
                                    product_ids 
                            FROM cartList 
                            WHERE user_id = ${req.session.userId}`, (cartListErr, cartListResult) => {
                    if(cartListErr) {throw cartListErr;}
                    if(typeof cartListResult[0] === "object" && cartListResult[0] !== undefined) {
                        let customShoppingCart = cartListResult[0].product_ids.split(',');
                        for(let i = 0; i < customShoppingCart.length; i++) {
                            let currentProduct = customShoppingCart[i].split(':');
                            if(currentProduct[0] === req.body.product_id) {
                                res.sendStatus(200);
                                break;
                            } else if(i === customShoppingCart.length -1 && 
                                      customShoppingCart[i].split(':')[0] !== req.body.product_id) {
                                customShoppingCart.push(`${req.body.product_id}:1`);
                                conn.query(`UPDATE cartList 
                                            SET product_ids = '${customShoppingCart.toString()}'
                                            WHERE user_id = ${req.session.userId}`, (updateErr) => {
                                    if(updateErr) {throw updateErr;}
                                });
                                res.sendStatus(200);
                                break;
                            }
                        }
                    } else if(cartListResult[0] === undefined) {
                        conn.query(`SELECT cart_id 
                                    FROM cartList 
                                    ORDER BY cart_id 
                                    DESC LIMIT 1`,(selectErr, selectResult) => {
                            if(selectErr) {throw selectErr;}
                            conn.query(`INSERT INTO cartList
                                                VALUES(${(selectResult.length !== 0) ? selectResult[0].cart_id + 1 : 1},
                                                        ${req.session.userId},
                                                    '${req.body.product_id}:1',
                                                    0)`, (insertErr) => {
                                if(insertErr) {throw insertErr;}
                                res.sendStatus(200);
                            });
                        });
                    }
                }); 
            }
        });
    } else {
        res.sendStatus(500);
    }
});
app.post('/changeCountByButton', (req, res) => {
    if(req.body.product_id !== undefined && req.body.product_count >= 1) {
        conn.query(`SELECT product_count_stock
                    FROM productList
                    WHERE product_id = ${req.body.product_id}`, (err, stock) => {
            if(err) {throw err;}
            if(typeof stock[0] === "object" && stock[0] !== undefined) {
                conn.query(`SELECT product_ids 
                            FROM cartList 
                            WHERE user_id = ${req.session.userId}`, (err, product) => {
                    if(err) {throw err;}
                    if(req.body.action === 'plus' && req.body.nodeName === 'BUTTON') {
                        if(req.body.product_count > stock[0].product_count_stock - 1) {
                            res.status(500).send({stock: stock[0].product_count_stock});
                        } else {
                            let customShoppingCart = product[0].product_ids.split(',');
                            for(let i = 0; i < customShoppingCart.length; i++) {
                                let currentProduct = customShoppingCart[i].split(':');
                                if(currentProduct[0] === req.body.product_id) {
                                    currentProduct[1] = parseInt(currentProduct[1]) + 1;
                                    customShoppingCart[i] = `${currentProduct[0]}:${currentProduct[1]}`;
                                    conn.query(`UPDATE cartList 
                                                SET product_ids = '${customShoppingCart.toString()}'
                                                WHERE user_id = ${req.session.userId}`, (updateErr) => {
                                        if(updateErr) {throw updateErr;}
                                        res.sendStatus(200);
                                    });
                                }
                            }
                        }
                    } else if(req.body.action === 'minus' && req.body.nodeName === 'BUTTON') {
                        if(req.body.product_count > stock[0].product_count_stock) {
                            let customShoppingCart = product[0].product_ids.split(',');
                            for(let i = 0; i < customShoppingCart.length; i++) {
                                let currentProduct = customShoppingCart[i].split(':');
                                if(currentProduct[0] === req.body.product_id) {
                                    customShoppingCart[i] = `${currentProduct[0]}:${stock[0].product_count_stock}`;
                                    if(customShoppingCart.length != 0) { 
                                        conn.query(`UPDATE cartList 
                                                    SET product_ids = '${customShoppingCart.toString()}'
                                                    WHERE user_id = ${req.session.userId}`, (updateErr) => {
                                            if(updateErr) {throw updateErr;}
                                            res.status(500).send({stock: stock[0].product_count_stock});
                                        });
                                    }
                                }
                            }
                        } else {
                            let customShoppingCart = product[0].product_ids.split(',');
                            for(let i = 0; i < customShoppingCart.length; i++) {
                                let currentProduct = customShoppingCart[i].split(':');
                                if(currentProduct[0] === req.body.product_id) {
                                    if(parseInt(currentProduct[1]) <= 1) {
                                        customShoppingCart.splice(i,1); 
                                    } else {
                                        currentProduct[1]--;
                                        customShoppingCart[i] = `${currentProduct[0]}:${currentProduct[1]}`;
                                    }
                                    if(customShoppingCart.length != 0) { 
                                        conn.query(`UPDATE cartList 
                                                    SET product_ids = '${customShoppingCart.toString()}'
                                                    WHERE user_id = ${req.session.userId}`, (updateErr) => {
                                            if(updateErr) {throw updateErr;}
                                            res.sendStatus(200);
                                        });
                                    } else if(customShoppingCart.length == 0) {
                                        conn.query(`DELETE FROM cartList
                                                    WHERE user_id=${req.session.userId} `, (deleteErr)=>{
                                            if(deleteErr) {throw deleteErr;}
                                            res.sendStatus(200);
                                        });
                                    }
                                }
                            }
                        }
                    } else {
                        res.sendStatus(500);
                    }
                });
            }
        });
    } else {
        res.status(500).send('Неверное действие или нет id продукта');
    }
});
app.post('/changeCountByInput', (req, res) => {
    if(req.body.product_id !== undefined && req.body.product_count >= 1) {
        conn.query(`SELECT product_count_stock
                    FROM productList
                    WHERE product_id = ${req.body.product_id}`, (err, stock) => {
            if(err) {throw err;}
            if(typeof stock[0] === "object" && stock[0] !== undefined) {
                conn.query(`SELECT product_ids 
                            FROM cartList 
                            WHERE user_id = ${req.session.userId}`, (err, product) => {
                    if(err) {throw err;}
                    if(req.body.nodeName === 'INPUT' && 
                       req.body.product_count !== null && 
                       typeof(parseInt(req.body.product_count)) === 'number' &&
                       typeof(parseInt(req.body.product_count)) !=='NaN' &&
                       req.body.action === 'changeByInput' &&
                       parseInt(req.body.product_count) >= 1) {
                            if(req.body.product_count > stock[0].product_count_stock) {
                                let customShoppingCart = product[0].product_ids.split(',');
                                for(let i = 0; i < customShoppingCart.length; i++) {
                                    let currentProduct = customShoppingCart[i].split(':');
                                    if(currentProduct[0] === req.body.product_id) {
                                        customShoppingCart[i] = `${currentProduct[0]}:${stock[0].product_count_stock}`;
                                        if(customShoppingCart.length != 0) { 
                                            conn.query(`UPDATE cartList 
                                                        SET product_ids = '${customShoppingCart.toString()}'
                                                        WHERE user_id = ${req.session.userId}`, (updateErr) => {
                                                if(updateErr) {throw updateErr;}
                                                res.status(500).send({stock: stock[0].product_count_stock});
                                            });
                                        }
                                    }
                                }
                            } else {
                                let customShoppingCart = product[0].product_ids.split(',');
                                for(let i = 0; i < customShoppingCart.length; i++) {
                                    let currentProduct = customShoppingCart[i].split(':');
                                    if(currentProduct[0] === req.body.product_id) {
                                        currentProduct[1] = Math.floor(req.body.product_count);
                                        customShoppingCart[i] = `${currentProduct[0]}:${currentProduct[1]}`;
                                        conn.query(`UPDATE cartList 
                                                    SET product_ids = '${customShoppingCart.toString()}'
                                                    WHERE user_id = ${req.session.userId}`, (updateErr) => {
                                            if(updateErr) {throw updateErr;}
                                            res.sendStatus(200);
                                        });
                                    }
                                }
                            }
                        }
                });
            }
        })
    }
});
app.post('/deleteProductInCart', (req, res) => {
    if(req.body.product_id !== undefined &&
       req.body.action === 'delete' && 
       req.body.nodeName === 'BUTTON') {
        conn.query(`SELECT product_ids 
                    FROM cartList 
                    WHERE user_id = ${req.session.userId}`, (err, product) => {
            if(err) {throw err;}
            let customShoppingCart = product[0].product_ids.split(',');
            for(let i = 0; i < customShoppingCart.length; i++) {
                let currentProduct = customShoppingCart[i].split(':');
                if(currentProduct[0] === req.body.product_id) {
                    customShoppingCart.splice(i, 1);
                    if(customShoppingCart.length < 1) {
                        conn.query(`DELETE FROM cartList 
                                    WHERE user_id = ${req.session.userId}`, (deleteErr) => {
                            if(deleteErr) {throw deleteErr;}
                            res.sendStatus(200);
                        });
                    } else {
                        conn.query(`UPDATE cartList 
                                    SET product_ids = '${customShoppingCart.toString()}'
                                    WHERE user_id = ${req.session.userId}`, (updateErr) => {
                            if(updateErr) {throw updateErr;}
                            res.sendStatus(200);
                        });
                    }
                }
            }
        });
    } else {
        res.status(500).send('Не удалось удалить товар из корзины');
    }
});
app.post('/orderRegistration', (req, res) => {
    sendMail({
        from: 'internet-magazine@domain.com',
        to: `${req.body.email}`,
        subject: 'Заказ с Интернет-магазина',
        html: ` <p  style="font-family: Arial, Helvetica, sans-serif; background-color: #4c84c7;color: #fff;">
                    Здраствуйте, Ваш заказ принят к обработке
                </p>
                <div style="font-family: Arial, Helvetica, sans-serif; background-color: #4c84c7; color: #fff;">
                    Ваш новый пароль: <strong>${newPassword}</strong>
                </div>`
      }, (err) => {
        if(err) {throw err;}
    });
    res.render('index', {
        userName: req.session.userName,
        successAuthentication: req.session.successAuthentication,
        isWorker: req.session.isWorker
    });
});


app.listen(3000);



