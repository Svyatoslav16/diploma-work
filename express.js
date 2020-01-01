const path = require('path'),
      mysql = require('mysql2'),
      express = require('express'),
      bodyParser = require('body-parser'),
      cookieParser = require('cookie-parser'),
      sendMail = require('sendmail')(),
      generatePassword = require('./public/javascript/module/generatePassword'),
      session = require('express-session'),
      MySQLStore = require('express-mysql-session')(session),
      multer  = require("multer");
      app = express();

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

app.get("/", urlencodedParser, function (request, response) {
    if(request.session.userName  && request.session.successAuthentication) {
        response.render('index', {
            userName: request.session.userName,
            successAuthentication: request.session.successAuthentication,
            isWorker: request.session.isWorker
        })
    } else {
        response.render('index', {
            successAuthentication: false
        })
    }
});
app.get("/signUp", urlencodedParser, function (request, response) {
    response.sendFile(`${__dirname}/public/html/signUp.html`);
});
app.get("/signIn", urlencodedParser, function (request, response) {
    response.sendFile(`${__dirname}/public/html/signIn.html`);
});
app.get("/signOut", urlencodedParser, function (request, response) {
    request.session.destroy(function(err) {
        return response.redirect(302, '/');
    })
});
app.get("/resetPassword", urlencodedParser, function (request, response) {
    response.sendFile(`${__dirname}/public/html/resetPassword.html`);
});
app.get("/addProduct", urlencodedParser, function (request, response) {
    if(request.session.successAuthentication && request.session.isWorker) {
        response.render('addProduct', {
            userName: request.session.userName,
            successAuthentication: request.session.successAuthentication,
            isWorker: request.session.isWorker 
        });
    } else {
        response.redirect(302, '/');
    }
});
app.get("/productList", urlencodedParser, function (request, response) {
    connection.query(`SELECT product_name,
                             product_url_img,
                             product_amount 
                      FROM products`, (err, result) => {
        if(result) {
            response.render('productList', {
                userName: request.session.userName,
                successAuthentication: request.session.successAuthentication,
                isWorker: request.session.isWorker, 
                productList : result
            });
        } else if(err) {
            throw new Error(err);
        }
    });
    
});

app.post("/signUp", urlencodedParser, function (request, response) {
    if(!request.body) return response.sendStatus(400);
    connection.query(`SELECT user_id 
                      FROM users 
                      ORDER BY user_id DESC LIMIT 1`,
                    (err, results) => {
        if (err == null && results !=[]){
            connection.query(`insert into users values(${(results.length != 0) ? results[0].user_id + 1 : 1}, 
                                                      '${request.body.userSurname}', 
                                                      '${request.body.userName}', 
                                                      '${request.body.userPatronymic}',
                                                      '${request.body.email}',
                                                      '${request.body.telephone}',
                                                      '${request.body.password}')`, (insertErr, insertResults) => {
                if(insertErr == null) {
                    response.render('index');
                } else if(insertErr != null) {  
                    throw new Error(insertErr);
                }
            });
        } else if(err) { 
            throw new Error(err);
        }
    });
});
app.post("/signIn", urlencodedParser, function (request, response) {
    if(!request.body) return response.sendStatus(400);
    connection.query(`SELECT user_id,
                             user_name, 
                             user_surname 
                      FROM users 
                      WHERE (${(request.body.login.match(/^\d+$/) !== null) ? 
                        `telephone=${request.body.login}` : 
                        `email='${request.body.login}'`}) AND
                         password='${request.body.password}'`,
                    (err, users) => {
        if(err == null && (typeof users[0] === "object" && users[0] !== undefined)) {
            request.session.userName = `${users[0].user_name} ${users[0].user_surname}`;
            request.session.isWorker = false;
            request.session.successAuthentication = true;
            request.session.userId = users[0].user_id;
            response.render('index', {
                userName: request.session.userName,
                successAuthentication: request.session.successAuthentication,
                isWorker: request.session.isWorker 
            });
        } else if(err == null && users[0] === undefined) {
            connection.query(`SELECT worker_id,
                                     worker_name, 
                                     worker_surname 
                              FROM worker 
                              WHERE (${(request.body.login.match(/^\d+$/) !== null) ? 
                                `telephone=${request.body.login}` : 
                                `email='${request.body.login}'`}) AND
                                 password='${request.body.password}'`, (workerSelectErr, worker) => {
                if(workerSelectErr == null && worker !== []) {
                    request.session.userName = `${worker[0].worker_name} ${worker[0].worker_surname}`;
                    request.session.isWorker = true;
                    request.session.successAuthentication =  true;
                    request.session.workerId = worker[0].worker_id;
                    response.render('index', {
                        userName: request.session.userName,
                        successAuthentication: request.session.successAuthentication,
                        isWorker: request.session.isWorker 
                    });
                }                                                                    
            });
        } else if(err) { 
            throw new Error(err);
        }
    });
});
app.post("/resetPassword", urlencodedParser, function (request, response) {
    if(!request.body) return response.sendStatus(400);
    connection.query(`SELECT user_name, 
                             email 
                      FROM users 
                      WHERE email='${request.body.email}'`, (err, results) => {
        if(err == null && results !==[]) {
            let newPassword = generatePassword.generatePassword();
            connection.query(`UPDATE users SET password = '${newPassword}' 
                              WHERE email = '${request.body.email}'`, (updateErr, updateResults) => {
                if(updateErr == null && updateResults !== []) {
                    sendMail({
                        from: 'internet-magazine@domain.com',
                        to: `${request.body.email}`,
                        subject: 'Восстановление пароля',
                        html: `<p  style="font-family: Arial, Helvetica, sans-serif; background-color: #4c84c7;color: #fff;">
                                Здраствуйте, ${results[0].user_name}! Это письмо для восстановление пароля
                                </p>
                                <p style="font-family: Arial, Helvetica, sans-serif; background-color: #4c84c7; color: #fff;">Ваш новый пароль: <strong>${newPassword}</strong></p>`
                      }, function(err, reply) {
                        console.log(err && err.stack);
                        console.dir(reply);
                    });
                    response.sendFile(`${__dirname}/public/html/index.html`);
                } else if(updateErr !== null) { 
                    throw new Error(updateErr);
                }
            });
        } else if(err !== null) {
            throw new Error(err);
        }
    });
});
app.post("/addProduct", urlencodedParser, function (request, response) {
    if(request.session.successAuthentication && request.session.isWorker) {
        connection.query(`SELECT product_id 
                          FROM products 
                          ORDER BY product_id DESC LIMIT 1`, (selectErr, selectResults) => {
            if(selectResults) {
                connection.query(`INSERT INTO products VALUES(${(selectResults.length != 0) ? selectResults[0].product_id + 1 : 1}, 
                                                            '${request.body.productName}', 
                                                            '${"productImages/" + request.file.originalname}',
                                                            '${request.body.descriptionProduct}',
                                                            '${request.body.productAmount}')`, (insertErr, insertResults) => {
                    if(insertResults) {
                        response.render('index', {
                            userName: request.session.userName,
                            successAuthentication: request.session.successAuthentication,
                            isWorker: request.session.isWorker
                        });
                    } else if(insertErr) {
                        throw new Error(insertErr);
                    }
                });
            } else if(selectErr) {
                throw new Error(selectErr);
            }
        });
    } else {
        response.render('index');
    }
});

app.listen(3000);



