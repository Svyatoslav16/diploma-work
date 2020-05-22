const express = require('express'),
      router = express.Router(),
      bodyParser = require('body-parser'),
      fs = require("fs"),
      mysql = require('./mySQL');

// Подлючение к БД
const conn = mysql.conn;

// Для получения данных с форм
const urlencodedParser = bodyParser.urlencoded({extended: false});

// Статусы заказа, в будущем значений может быть больше
const orderStatus = ['Подтверждён', 'Не подтверждён'];

router.use(mysql.userSession);
router.use(express.json());

// Форма добавления сотрудника
router.get("/addWorker", (req, res) => {    
  if (req.session.successAuthentication === true && 
      req.session.isWorker === true) {
    conn.query(`SELECT  id,
                        name
                FROM position`, (err, positions) => {
      if (err) {
        res.send(err);
        fs.writeFileSync('api-worker-error-log.txt', `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err}  ${new Date().toLocaleDateString()}`);
      } else if(!err && positions.length > 0) {
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

// Форма добавления товара
router.get("/addProduct", (req, res) => {
  if (req.session.successAuthentication === true && 
      req.session.isWorker === true) {
    conn.query(`SELECT  id,
                        name
                FROM product_category`, (err, categories) => {
      if (err) {
        res.send(err);
        fs.writeFileSync('api-worker-error-log.txt', `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      } else if(!err && categories.length > 0) {
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

// Форма добавления должности
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

// Форма поступление товара
router.get("/arrivalOfGoods", (req, res) => {
  if (req.session.successAuthentication === true && 
      req.session.isWorker === true) {
    conn.query(`SELECT  product_id,
                        product_name,
                        product_count_stock
                FROM products`, (err, productList) => {
      if (err) {
        res.send(err);
        fs.writeFileSync('api-worker-error-log.txt', `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      } else if (!err && productList.length > 0) {
        conn.query(`SELECT DISTINCT id,name 
                    FROM internet_magazine.product_category INNER JOIN products 
                    ON product_category.id = products.product_category_id;`, (err, categories) => {
          if (err) {
            res.send(err);
            fs.writeFileSync('api-worker-error-log.txt', 
              `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
          } else if(!err && categories.length > 0) {
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

// Форма добавления категорию товаров
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

// Форма редактирования данных сотрудника
router.get('/editWorkerProfile', async (req, res) => {
  if (req.session.successAuthentication === true &&
    req.session.isWorker === true &&
    req.query.workerId) {
    conn.query(`SELECT *
                FROM worker
                WHERE worker_id = ${req.session.workerId}`, (err, accountData) => {
      if(err) {
        res.send(err);
        fs.writeFileSync('api-worker-error-log.txt',
          `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      } else if(!err && accountData.length > 0) {
        console.log(accountData[0]);
        res.render('editWorkerProfile', {
          userName: req.session.userName,
          successAuthentication: req.session.successAuthentication,
          isWorker: req.session.isWorker,
          accountData: accountData[0]
        });
      }
    });
  } else {
    console.log('redirect');
    res.redirect(301, '/');
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
      if (err) {
        res.send(err);
        fs.writeFileSync('api-worker-error-log.txt', `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      } else if (!err && lastProduct.length > 0) {
        if (lastProduct.length > 0) {
          conn.query(`INSERT INTO products 
                      VALUE(${(lastProduct.length > 0) ? +lastProduct[0].product_id + 1 : 1}, 
                              '${req.body.productName}', 
                              '${"productImages/" + req.file.originalname}',
                              '${req.body.productDescription}',
                              '${req.body.productAmount}',
                              '${req.body.productCount}',
                                ${req.body.productCategoryId})`, err => {
            if (err) {
              res.send(err);
              fs.writeFileSync('api-worker-error-log.txt', `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
            } else {
              res.render('index', {
                userName: req.session.userName,
                successAuthentication: req.session.successAuthentication,
                isWorker: req.session.isWorker
              });
            }
          });
        } else {
          res.sendStatus(500);
        }
      } if (!err && lastProduct.length === 0) {
        conn.query(`INSERT INTO products
                    VALUE(1, 
                          '${req.body.productName}', 
                          '${"productImages/" + req.file.originalname}',
                          '${req.body.descriptionProduct}',
                          '${req.body.productAmount}',
                          '${req.body.productCountStock}',
                          ${req.body.productCategoryId})`, err => {
          if (err) {
            res.send(err);
            fs.writeFileSync('api-worker-error-log.txt', `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
          } else {
            res.render('index', {
              userName: req.session.userName,
              successAuthentication: req.session.successAuthentication,
              isWorker: req.session.isWorker
            });
          }
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
      if (err) {
        res.send(err);
        fs.writeFileSync('api-worker-error-log.txt', `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      } else {
        conn.query(`INSERT INTO position
                    VALUE(${(lastPositionId.length > 0) ? +lastPositionId[0].id + 1: 1},
                        '${req.body.positionName}');`, err => {
          if (err) {
            res.send(err);
            fs.writeFileSync('api-worker-error-log.txt', `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
          }
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

router.post('/addProductCategory', urlencodedParser, (req, res) =>{
  if (!req.body) return res.sendStatus(400);
  if (req.session.successAuthentication === true && 
      req.session.isWorker === true) {
    conn.query(`SELECT  id
                FROM product_category
                ORDER BY id 
                DESC LIMIT 1;`, (err, lastCategoryId) => {
      if (err) {
        res.send(err);
        fs.writeFileSync('api-worker-error-log.txt', 
          `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      } else {
        conn.query(`INSERT INTO product_category
                    VALUE(${(lastCategoryId.length > 0) ? +lastCategoryId[0].id + 1 : 1},
                          '${req.body.categoryName}');`, err => {
          if (err) {
            res.send(err);
            fs.writeFileSync('api-worker-error-log.txt', 
              `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
          } else {
            res.render('index', {
              userName: req.session.userName,
              successAuthentication: req.session.successAuthentication,
              isWorker: req.session.isWorker
            });
          }
        });
      }
    });
  } else {
    res.sendStatus(500);
  }
});

// Прихода товара
router.post('/arrivalOfGoods', (req, res) => {
  if (req.body.productList.length > 0 &&
      req.body.datetime &&
      req.session.successAuthentication === true && 
      req.session.isWorker === true) {
    conn.query(`SELECT  id
                FROM income
                ORDER BY id 
                DESC LIMIT 1;`, (err, lastIncomeId) => {
      if (err) {
        res.sendStatus(500);
        fs.writeFileSync('api-worker-error-log.txt', 
          `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
        console.log(err);
      } else {
        let incomeID = (lastIncomeId.length > 0) ? +lastIncomeId[0].id + 1: 1;
        conn.query(`INSERT INTO income 
                    VALUE(${incomeID},
                          str_to_date('${req.body.datetime}','%Y-%m-%d %H:%i'),
                          0,
                          ${req.session.workerId})`, err => {
          if (err) {
            res.sendStatus(500);
            fs.writeFileSync('api-worker-error-log.txt', 
              `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
            console.log(err);
          } else {
            let values = '';
            let productList = req.body.productList;
            let total = 0;
            for (let i = 0; i < productList.length; i++) {
              total += productList[i].count * productList[i].amount;
              conn.query(`UPDATE products
                          SET product_count_stock = product_count_stock + ${productList[i].count},
                              product_amount = ${productList[i].amount * 1.2}
                          WHERE product_id = ${productList[i].id};`, err => {
                if(err) {
                  res.sendStatus(500);
                  fs.writeFileSync('api-worker-error-log.txt', 
                    `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
                  console.log(err);
                }
              });
              if(i < productList.length - 1 && productList.length > 1) {
                values += `(${incomeID},${productList[i].id}, ${productList[i].count},${productList[i].amount}),`;
              } else if(i === productList.length - 1) {
                conn.query(`INSERT INTO income_product
                            VALUES ${values}
                            (${incomeID}, ${productList[i].id}, ${productList[i].count},${productList[i].amount});`, err => {
                  if (err) {
                    res.sendStatus(500);
                    fs.writeFileSync('api-worker-error-log.txt', 
                      `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
                    console.log(err);
                  } else {
                    conn.query(`UPDATE income
                                SET total = ${total}
                                WHERE id = ${incomeID}`, err => {
                      if (err) {
                        res.send(err);
                        fs.writeFileSync('api-worker-error-log.txt', 
                          `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
                      } else {
                        res.sendStatus(200);
                      }
                    });
                  }
                });
              }
            }
          }
        });
      }
    });
  }
});

// Редактирование свойств товара
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
      if (err) {
        res.send(err);
        fs.writeFileSync('api-worker-error-log.txt', 
          `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      } else {
        res.render('index', {
          userName: req.session.userName,
          successAuthentication: req.session.successAuthentication,
          isWorker: req.session.isWorker
        });
      }
    });
  } else {
    res.sendStatus(400);
  }
});

// Удаление товара по id
router.post('/deleteProductByID', (req, res) => {
  if (req.body.productID &&
      req.session.successAuthentication === true && 
      req.session.isWorker === true) {
    let sql = '';
    if(typeof req.body.productID === 'string') {
      sql =  `DELETE FROM products
              WHERE product_id = ${req.body.productID};`;
    } else if(typeof req.body.productID === 'object') {
      sql =  `DELETE FROM products
              WHERE product_id IN(${req.body.productID.join(',')});`;
    }
    conn.query(sql, err => {
      if (err) {
        res.json({error: 'Произошла ошибка'});
        fs.writeFileSync('api-worker-error-log.txt', `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      } else {
        res.json({message: 'Товар успешно удален'});
      }
    });
  } else {
    res.json({error: 'Произошла ошибка'});
  }
});

// Удаление сотрудника по id
router.post('/deleteWorkerByID', (req, res) => {
  if (req.body.workerID &&
      req.session.successAuthentication === true && 
      req.session.isWorker === true) {
    let sql = '';
    if(typeof req.body.workerList === 'string') {
      sql =  `DELETE FROM worker
              WHERE worker_id = ${req.body.workerID};`;
    } else if(typeof req.body.workerID === 'object') {
      sql =  `DELETE FROM worker
              WHERE worker_id IN(${req.body.workerID.join(',')});`;
    }
    conn.query(sql, err => {
      if (err) {
        res.json({error: 'Произошла ошибка'});
        fs.writeFileSync('api-worker-error-log.txt', `${fs.readFileSync('api-worker-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      } else {
        res.json({message: 'Сотрудник успешно удален'});
      }
    });
  } else {
    res.json({error: 'Произошла ошибка'});
  }
});

module.exports = router;