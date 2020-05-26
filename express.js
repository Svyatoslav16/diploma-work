const path = require('path'),
      express = require('express'),
      bodyParser = require('body-parser'),
      cookieParser = require('cookie-parser'),
      app = express(),
      fs = require("fs"),
      mysql = require('./api/mySQL');

const conn = mysql.conn;

const urlencodedParser = bodyParser.urlencoded({extended: false});

// Статусы заказа, в будущем значений может быть больше
const orderStatus = ['Подтверждён', 'Не подтверждён'];

app.use(express.static(path.join(__dirname, 'public')));
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

app.get('/userStatus', (req, res) => {
  res.send({
    userName: req.session.userName,
    successAuthentication: req.session.successAuthentication,
    isWorker: req.session.isWorker
  });
});

app.get("/", (req, res) => {
  if (req.session.userName  && req.session.successAuthentication) {
    res.render('index', {
      userName: req.session.userName,
      successAuthentication: req.session.successAuthentication,
      isWorker: req.session.isWorker,
      hours: new Date().getHours()
    });
  } else {
    res.render('index', {
      successAuthentication: false
    });
  }
});

app.get('/getProducts', (req, res) => {
  conn.query(`SELECT * FROM products`, (err, products) => {
    if (err) {
      fs.writeFileSync('express-error-log.txt', 
        `${fs.readFileSync('express-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      console.log(err);
    } else 
      res.json(products);
  });
});

app.get('/getProductInCart', (req, res) => {
  if (req.session.successAuthentication === true && 
      req.session.isWorker === false) {
    conn.query(`SELECT order_product.product_id as 'id' 
                FROM orders INNER JOIN order_product
                ON orders.id = order_product.order_id
                WHERE user_id = ${req.session.userId}
                AND status = '${orderStatus[1]}'`, (err, productCategory) => {
      if (err) {
        fs.writeFileSync('express-error-log.txt', 
          `${fs.readFileSync('express-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
        console.log(err);
        res.send(err);
      } else
        res.json(productCategory);
    });
  }
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

app.get("/logOff", urlencodedParser, (req, res) => {
  let signOutUserName = req.session.userName;
  req.session.destroy(err => {
    if (err) {
      fs.writeFileSync('express-error-log.txt', 
        `${fs.readFileSync('express-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      res.send(err);
    } else {
      res.render('index', {
        afterSignOut: true,
        signOutUserName
      });
    }
  });
});

app.get("/resetPassword", (req, res) => {
  if(!req.session.isWorker) {
    res.sendFile(`${__dirname}/public/html/resetPassword.html`);
  }
});

app.get("/productList", (req, res) => {
  res.render('productList', {
    userName: req.session.userName,
    successAuthentication: req.session.successAuthentication,
    isWorker: req.session.isWorker
  });
});

app.post('/getProductsFromCategory', (req, res) => {
  let choseCategory = (req.body.category) ? `AND product_category.id = '${req.body.category}'`
                                          : 'AND product_category.id = 1';
  conn.query(`SELECT  product_id,
                      product_name,
                      product_url_img,
                      product_amount,
                      product_count_stock,
                      product_category.id as 'category'
              FROM products INNER JOIN product_category 
              ON products.product_category_id = product_category.id
              WHERE products.product_count_stock > 0
              ${choseCategory};`, (err, products) => {
    if(err) {
      console.log(err);
      fs.writeFileSync('express-error-log.txt', 
        `${fs.readFileSync('express-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      res.send({err: err});
    } else if(!err && products) {
      res.send(products);
    }
  });
});

app.post("/getCategories", (req, res) => {
  conn.query(`SELECT DISTINCT product_category.id,
                              product_category.name
              FROM product_category INNER JOIN products
              ON product_category.id = products.product_category_id`, (err, categories) => {
    if(err) {
      fs.writeFileSync('express-error-log.txt', 
        `${fs.readFileSync('express-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      res.send({err: err});
    } else if(!err && categories.length > 0) {
      res.send(categories);
    }
  });
});

app.post("/getProductByCategoryId", (req, res) => {
  conn.query(`SELECT DISTINCT products.product_id as 'id',
                              products.product_name as 'name',
                              product_category.id as 'category'
              FROM product_category INNER JOIN products
              ON product_category.id = products.product_category_id
              WHERE product_category.id = ${req.body.id};`, (err, product) => {
    if(err) {
      fs.writeFileSync('express-error-log.txt', 
        `${fs.readFileSync('express-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      res.send({err: err});
    } else if(!err && product.length > 0) {
      res.send(product);
    }
  });
});

// Подробности товара по id
app.get('/product', (req, res) => {
  if (req.query.productId !== undefined &&
      req.query.productId > 0) {
    conn.query(`SELECT * 
                FROM products
                WHERE product_id = ${req.query.productId}`, (err, product) => {
      if(err) {
        fs.writeFileSync('express-error-log.txt', 
          `${fs.readFileSync('express-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
        res.send(err);
      } else if(!err && product.length > 0) {
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
    if (err) {
      res.send(err);
      fs.writeFileSync('express-error-log.txt', 
        `${fs.readFileSync('express-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
    } else {
      conn.query(`SELECT user_id
                  FROM users
                  WHERE telephone = ${req.body.telephone} 
                  OR email = '${req.body.email}' `, (err, existingUser) => {
        if (err) {
          fs.writeFileSync('express-error-log.txt', 
            `${fs.readFileSync('express-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
          res.send(err);
        } else if (!err && existingUser.length === 0) {
          conn.query(`INSERT INTO users 
                      VALUE(${(lastUser.length !== 0) ? +lastUser[0].user_id + 1 : 1}, 
                            '${req.body.surname}', 
                            '${req.body.name}', 
                            '${req.body.patronymic}',
                            '${req.body.email}',
                            '${req.body.telephone}',
                            '${req.body.password}',
                            '')`, (err) => {
            if (err) {
              fs.writeFileSync('express-error-log.txt', 
                `${fs.readFileSync('express-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
              res.send(err);
            } else
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
    }
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
    if (err) {
      fs.writeFileSync('express-error-log.txt', 
        `${fs.readFileSync('express-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      res.send(err);
    } else if (!err && users.length > 0) {
      req.session.userName = `${users[0].user_name} ${users[0].user_surname}`;
      req.session.isWorker = false;
      req.session.successAuthentication = true;
      req.session.userId = users[0].user_id;
      res.render('index', {
        userName: req.session.userName,
        successAuthentication: req.session.successAuthentication,
        isWorker: req.session.isWorker,
        afterSignIn: true
      });
    } else if (!err && users.length === 0) {
      conn.query(`SELECT  worker_id,
                          worker_name, 
                          worker_surname 
                  FROM worker 
                  WHERE (${(req.body.login.match(/^\d+$/) !== null) ? `telephone=${req.body.login}` 
                                                                    : `email='${req.body.login}'`}) 
                  AND password='${req.body.password}'`, (err, worker) => {
        if (err) {
          fs.writeFileSync('express-error-log.txt', 
            `${fs.readFileSync('express-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
          res.send(err);
        } else if (!err && typeof worker[0] === "object" && worker[0] !== undefined) {
          req.session.userName = `${worker[0].worker_name} ${worker[0].worker_surname}`;
          req.session.isWorker = true;
          req.session.successAuthentication =  true;
          req.session.workerId = worker[0].worker_id;
          res.render('index', {
            userName: req.session.userName,
            successAuthentication: req.session.successAuthentication,
            isWorker: req.session.isWorker,
            afterSignIn: true
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
  if (!req.body.email && req.session.isWorker === false) return res.sendStatus(503);
  conn.query(`SELECT  user_name, 
                      email 
              FROM users 
              WHERE email='${req.body.email}'`, (err, userData) => {
    if (err) {
      fs.writeFileSync('express-error-log.txt', 
        `${fs.readFileSync('express-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      res.send(err);
    } else if (!err && 
      typeof userData[0] === "object" && 
      userData[0] !== undefined) {
      let newPassword = generatePassword.generatePassword();
      conn.query(`UPDATE users SET password = '${newPassword}' 
                  WHERE email = '${req.body.email}'`, (err) => {
        if (err) {
          res.send(err);
          fs.writeFileSync('express-error-log.txt', 
            `${fs.readFileSync('express-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
        } else {
          sendMail({
            from: 'internet-magazine@domain.com',
            to: `${req.body.email}`,
            subject: 'Восстановление пароля',
            html: ` <p  style="font-family: Arial, Helvetica, sans-serif; background-color: #4c84c7;color: #fff;">
                        Здраствуйте, ${userData[0].user_name}! Это письмо для восстановление пароля
                    </p>
                    <p style="font-family: Arial, Helvetica, sans-serif; background-color: #4c84c7; color: #fff;">
                        Ваш новый пароль: <strong>${newPassword}</strong>
                    </p>`
            }, (err, reply) => {
            if (err) {
              fs.writeFileSync('express-error-log.txt', 
                `${fs.readFileSync('express-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
              res.send(err);
            } else
              res.render('index', {
                userName: req.session.userName,
                successAuthentication: req.session.successAuthentication,
                isWorker: req.session.isWorker
              });
          });
        }
      });
    }
  });
});

app.listen(3000);