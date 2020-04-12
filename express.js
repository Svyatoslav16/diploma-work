const path = require('path'),
      express = require('express'),
      bodyParser = require('body-parser'),
      cookieParser = require('cookie-parser'),
      multer  = require("multer"),
      app = express(),
      mysql = require('./api/mySQL');

const conn = mysql.conn;

// Настройки для загрузки картинок товаров 
const storageConfig = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, "public/productImages");
    },
    filename: (req, file, cb) =>{
        cb(null, `${file.originalname}`);
    }
});

// Фильтрация файлов для загрузки на сервер с типом png
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/png"){
        cb(null, true);
    } else{
        cb(null, false);
    }
 }

const urlencodedParser = bodyParser.urlencoded({extended: false});

// Статусы заказа, в будущем значений может быть больше
const orderStatus = ['Подтверждён', 'Не подтверждён'];

app.use(express.static(path.join(__dirname, 'public')));
app.use(multer({storage:storageConfig, fileFilter: fileFilter}).single("filedata"));
app.use(cookieParser());
app.use(express.json());
app.use(mysql.userSession);
app.use(require('./api/worker')); // API сотрудников (пока только администраторы)
app.use(require('./api/user')); // API пользователя
app.use(require('./api/reports')); // API отчётов для анализа
 
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
app.get('/getProducts', (req, res) => {
    conn.query(`SELECT * FROM products`, (err, products) => {
        if (err) {throw err};
        res.json(products);
    });
});
app.get("/signUp", urlencodedParser, (req, res) => {
    res.render('signUp', {
        userData: {
            surname: '',
            name: '',
            patronimyc: '',
            email: '',
            telephone: '',
            password: ''
        }
    });
});
app.get("/signIn", urlencodedParser, (req, res) => {
    res.render('signIn');
});
app.get("/signOut", urlencodedParser, (req, res) => {
    req.session.destroy(err => {
        if (err) {throw err};
        res.redirect(302, '/');
    });
});
app.get("/resetPassword", (req, res) => {
    res.sendFile(`${__dirname}/public/html/resetPassword.html`);
});
app.get("/productList", (req, res) => {
    conn.query(`SELECT  product_id,
                        product_name,
                        product_url_img,
                        product_description,
                        product_amount,
                        product_count_stock,
                        id,
                        name 
                FROM products INNER JOIN product_category 
                ON products.product_category_id = product_category.id
                WHERE products.product_count_stock > 0
                AND product_category.name = '${(req.query.categoryName) ? req.query.categoryName 
                                                                        : '1С:Предприятие'}';`, (err, productList) => {
        if(err) {throw err;}
        if (productList.length > 0) {
            conn.query(`SELECT DISTINCT product_category.name 
                        FROM product_category INNER JOIN products
                        ON product_category.id = products.product_category_id`, (err, categories) => {
                if(err) {throw err;}
                if(categories.length > 0) {
                    res.render('productList', {
                        userName: req.session.userName,
                        successAuthentication: req.session.successAuthentication,
                        isWorker: req.session.isWorker, 
                        productList : productList,
                        categories,
                        activeCategory: productList[0].name
                    });
                } else {
                    console.log('400');
                    res.sendStatus(400);
                }
            });            
        } else {
            console.log('4001');
            res.sendStatus(400);
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

app.post("/signUp", urlencodedParser, (req, res) => {
    if (!req.body) return res.sendStatus(400);
    conn.query(`SELECT user_id 
                FROM users 
                ORDER BY user_id 
                DESC LIMIT 1`, (err, lastUser) => {
        if (err) {throw err;}
        conn.query(`SELECT user_id
                    FROM users
                    WHERE telephone = ${req.body.telephone} 
                    OR email = '${req.body.email}' `, (err, existingUser) => {
            if (err) {throw err;}
            if (existingUser.length === 0) {
                conn.query(`INSERT INTO users 
                            VALUE(${(lastUser.length !== 0) ? +lastUser[0].user_id + 1 : 1}, 
                                  '${req.body.surname}', 
                                  '${req.body.name}', 
                                  '${req.body.patronymic}',
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
                res.render('signUp', {
                    successAuthentication: false,
                    error: 'Такой пользователь уже существует',
                    userData: {
                        surname: req.body.surname,
                        name: req.body.name,
                        patronymic: req.body.patronymic,
                        email: req.body.email,
                        telephone: req.body.telephone
                    }
                });
            }
        });
    });
});
app.post("/signIn", urlencodedParser, (req, res) => {
    if (!req.body) return res.sendStatus(403);
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
                        WHERE (${(req.body.login.match(/^\d+$/) !== null) ? `telephone=${req.body.login}` 
                                                                          : `email='${req.body.login}'`}) 
                        AND password='${req.body.password}'`, (workerSelectErr, worker) => {
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
                } else {
                    res.render('signIn', {
                        error: 'Неверный логин или пароль'
                    });
                }                                                                  
            });
        }
    });
});
app.post("/resetPassword", urlencodedParser, (req, res) => {
    if (!req.body.email) return res.sendStatus(503);
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

app.listen(3000);