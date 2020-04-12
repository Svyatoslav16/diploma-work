const express = require('express'),
      router = express.Router(),
      bodyParser = require('body-parser'),
      mysql = require('./mySQL');
      
const conn = mysql.conn;

const urlencodedParser = bodyParser.urlencoded({extended: false});

// Статусы заказа, в будущем значений может быть больше
const orderStatus = ['Подтверждён', 'Не подтверждён'];

router.use(mysql.userSession);

// Добавить сотрудника
router.get("/addWorker", (req, res) => {    
    if (req.session.successAuthentication === true && 
        req.session.isWorker === true) {
        conn.query(`SELECT  id,
                            name
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

// Добавить товар
router.get("/addProduct", (req, res) => {
    if (req.session.successAuthentication === true && 
        req.session.isWorker === true) {
        conn.query(`SELECT  id,
                            name
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

// Удаление товара по id
router.get('/deleteProductById', (req, res) => {
    if (req.query.productId > 0 &&
        req.session.successAuthentication === true && 
        req.session.isWorker === true) {
        conn.query(`DELETE FROM products
                    WHERE product_id = ${req.query.productId}`, err => {
            if (err) {throw err;}
            res.render('index', {
                userName: req.session.userName,
                successAuthentication: req.session.successAuthentication,
                isWorker: req.session.isWorker
            });
        });
    } else {
        res.status(500).send('Не удалось удалить товар из корзины');
    }
});

// Добавить должность
router.get("/addPosition", (req, res) => {
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

// Поступление товара
router.get("/arrivalOfGoods", (req, res) => {
    if (req.session.successAuthentication === true && 
        req.session.isWorker === true) {
        conn.query(`SELECT  product_id,
                            product_name,
                            product_count_stock
                    FROM products`, (err, productList) => {
            if (err) {throw err;}
            if (productList.length > 0) {
                conn.query(`SELECT DISTINCT id,name 
                            FROM internet_magazine.product_category INNER JOIN products 
                            ON product_category.id = products.product_category_id;`, (err, categories) => {
                    if (err) {throw err};
                    if(categories.length > 0) {
                        res.render('arrivalOfGoods', {
                            userName: req.session.userName,
                            successAuthentication: req.session.successAuthentication,
                            isWorker: req.session.isWorker,
                            productList,
                            categories 
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

// Добавить категорию товаров
router.get("/addProductCategory", (req, res) => {
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

// Добавление сотрудника в бд
router.post('/addWorker', urlencodedParser, (req, res) =>{
    if (!req.body) return res.sendStatus(400);
    if (req.session.successAuthentication === true && 
        req.session.isWorker === true) {
        conn.query(`SELECT worker_id 
                    FROM worker
                    ORDER BY worker_id 
                    DESC LIMIT 1;`, (err, lastWorker) => {
            if (err) {throw err;}
            if (lastWorker.length > 0) {
                conn.query(`SELECT worker_id
                            FROM worker
                            WHERE telephone = ${req.body.telephone} 
                            OR email = '${req.body.email}';`, (err, existingWorker) => {
                    if (err) {throw err;}
                    if (existingWorker.length === 0) {
                        conn.query(`INSERT INTO worker
                                    VALUE(${(lastWorker.length > 0) ? +lastWorker[0].worker_id + 1 : 1},
                                         '${req.body.name}',
                                         '${req.body.surname}',
                                         '${req.body.patronymic}',
                                         '${req.body.email}',
                                          ${req.body.telephone},
                                         '${req.body.password}',
                                          ${req.body.position});`, err => {
                            if (err) {throw err;}
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
    } else {
        res.sendStatus(500);
    }
});
router.post("/addProduct", urlencodedParser, (req, res) => {
    if (req.session.successAuthentication === true && 
        req.session.isWorker === true) {
        conn.query(`SELECT product_id 
                    FROM products
                    ORDER BY product_id DESC LIMIT 1`, (err, lastProduct) => {
            if (err) {throw err;}
            if (lastProduct.length > 0) {
                if (lastProduct.length > 0) {
                    conn.query(`INSERT INTO products 
                                VALUE(${(lastProduct.length > 0) ? +lastProduct[0].product_id + 1 : 1}, 
                                        '${req.body.productName}', 
                                        '${"productImages/" + req.file.originalname}',
                                        '${req.body.productDescription}',
                                        '${req.body.productAmount}',
                                        '${req.body.productCount}',
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
router.post('/addPosition', urlencodedParser, (req, res) =>{
    if (!req.body) return res.sendStatus(400);
    if (req.session.successAuthentication === true && 
        req.session.isWorker === true) {
        conn.query(`SELECT id
                FROM position
                ORDER BY id 
                DESC LIMIT 1;`, (err, lastPositionId) => {
            if (err) {throw err};
            conn.query(`INSERT INTO position
                        VALUE(${(lastPositionId.length > 0) ? +lastPositionId[0].id + 1: 1},
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
router.post('/addProductCategory', urlencodedParser, (req, res) =>{
    if (!req.body) return res.sendStatus(400);
    if (req.session.successAuthentication === true && 
        req.session.isWorker === true) {
        conn.query(`SELECT  id
                    FROM product_category
                    ORDER BY id 
                    DESC LIMIT 1;`, (err, lastCategoryId) => {
            if (err) {throw err};
            conn.query(`INSERT INTO product_category
                        VALUE(${(lastCategoryId.length > 0) ? +lastCategoryId[0].id + 1 : 1},
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
router.post('/arrivalOfGoods', urlencodedParser, (req, res) =>{
    if (!typeof +req.body.count === 'number' &&
        !+req.body.count !== 'NaN' && 
        !req.body.amount &&
        !req.body.id &&
        !req.body.categoryId) {
        return res.sendStatus(400);
    }
    if (req.session.successAuthentication === true && 
        req.session.isWorker === true) {
        conn.query(`SELECT  id
                    FROM income
                    ORDER BY id 
                    DESC LIMIT 1;`, (err, lastIncomeId) => {
            if (err) {throw err};
            conn.query(`INSERT INTO income 
                        VALUE(${(lastIncomeId.length > 0) ? +lastIncomeId[0].id + 1: 1},
                              NOW(),
                              0)`, err => {
                if (err) {throw err};
                conn.query(`INSERT INTO income_product 
                            VALUE(${(lastIncomeId.length > 0) ? +lastIncomeId[0].id + 1: 1},
                                  ${req.body.id},
                                  ${req.body.count},
                                  ${req.body.amount})`, err => {
                    if (err) {throw err};
                    conn.query(`UPDATE income
                                SET total = ${req.body.amount * req.body.count}
                                WHERE id = ${(lastIncomeId.length > 0) ? +lastIncomeId[0].id + 1: 1}`, err => {
                        if (err) {throw err};
                        conn.query(`UPDATE products
                                    SET product_count_stock = product_count_stock + ${req.body.count}
                                    WHERE product_id = ${req.body.id}
                                    AND product_category_id = ${req.body.categoryId};`, (err) => {
                            if (err) {throw err};
                            res.render('index', {
                                userName: req.session.userName,
                                successAuthentication: req.session.successAuthentication,
                                isWorker: req.session.isWorker
                            });
                        }); 
                    }); 
                });
            });
        });
    } else {
        res.sendStatus(500);
    }
});
router.post('/editProductProperties', urlencodedParser, (req, res) => {
    if (!req.body) return res.sendStatus(400);
    if (req.session.successAuthentication === true && 
        req.session.isWorker === true) {
        conn.query(`UPDATE products
                    SET ${(req.body.productName !== undefined && 
                           req.body.productName.length > 0) ? `product_name = '${req.body.productName}'` : ''}
                        ${(req.file !== undefined) ? `, product_url_img = 'productImages/${req.file.originalname}'` : ''}
                        ${(req.body.productDescription !== undefined && 
                           req.body.productDescription.length > 0) ? `,product_description = '${req.body.productDescription}'` : ''}
                        ${(req.body.productAmount !== undefined && 
                           req.body.productAmount.length > 0) ? `,product_amount = ${req.body.productAmount}` : ''}
                        ${(req.body.productCount !== undefined && 
                           req.body.productCount.length > 0) ? `,product_count_stock = ${req.body.productCount}` : ''}
                        ${(req.body.category !== undefined && 
                           req.body.category.length > 0) ? `,product_category_id = ${req.body.category}` : ''}
                    WHERE product_id = ${req.body.productId};`, err => {
            if (err) {throw err};
            res.render('index', {
                userName: req.session.userName,
                successAuthentication: req.session.successAuthentication,
                isWorker: req.session.isWorker
            });
        });
    } else {
        res.sendStatus(400);
    }
});

module.exports = router;