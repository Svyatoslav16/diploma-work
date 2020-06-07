
const express = require('express'),
      bodyParser = require('body-parser'),
      sendMail = require('sendmail')(),
      router = express.Router(),
      fs = require("fs"),
      mysql = require('./mySQL');

const conn = mysql.conn;

const urlencodedParser = bodyParser.urlencoded({extended: false});

/** Статусы заказа ['Подтверждён', 'Не подтверждён']*/
const orderStatus = ['Подтверждён', 'Не подтверждён'];

router.use(mysql.userSession);

router.get('/cart', (req, res) => {    
  if (req.session.successAuthentication === true && 
      req.session.userId && 
      req.session.isWorker === false) {
      conn.query(`SELECT id 
                  FROM orders
                  WHERE user_id=${req.session.userId}
                  AND status = '${orderStatus[1]}'`, (err, orderData) => {
    if (err) {
      res.send(err);
      fs.writeFileSync('api-user-error-log.txt', 
        `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
    }
    if (orderData.length > 0) {
      conn.query(`SELECT product_id
                  FROM order_product
                  WHERE order_id = ${orderData[0].id}`, (err, productID) => {
        if (err) {
          res.send(err);
          fs.writeFileSync('api-user-error-log.txt', 
            `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
        }
        if (productID.length > 0) {
          let productIdArray = [];
          let productIdArrayWithSort;

          for (let i = 0; i < productID.length; i++) {
              productIdArray.push(productID[i].product_id);
          }

          productIdArrayWithSort = productIdArray.sort((a, b) => a - b);

          conn.query(`SELECT  products.product_id,
                              product_name,
                              product_url_img,
                              product_description,
                              product_amount,
                              order_product.count,
                              product_count_stock
                      FROM products 
                      INNER JOIN order_product ON products.product_id = order_product.product_id
                      INNER JOIN orders ON order_product.order_id = orders.id
                      WHERE products.product_id IN(${productIdArrayWithSort.toString()}) 
                      AND orders.user_id = ${req.session.userId}
                      AND orders.status = '${orderStatus[1]}'
                      ORDER BY products.product_id;`, (err, selProductList) => {
            if (err) {
              res.send(err);
              fs.writeFileSync('api-user-error-log.txt', 
                `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
            }
            if (selProductList.length > 0) {                                
              let totalCount = 0;
              let totalAmount = 0;
              for (let i = 0; i < selProductList.length; i++) {
                totalCount++;
                totalAmount += selProductList[i].product_amount * 
                                selProductList[i].count;
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

/** Мои заказы */
router.get('/myOrders', (req, res) => {
  if (req.session.successAuthentication === true && 
      req.session.userId !== undefined && 
      req.session.isWorker === false) {
    conn.query(`SELECT  orders.id,
                        order_product.count,
                        products.product_id,
                        products.product_name,
                        products.product_amount,
                        date_format(orders.date, '%d.%m.%Y %H:%i:%S') as 'date'
                FROM orders INNER JOIN order_product 
                ON orders.id = order_product.order_id INNER JOIN products
                ON order_product.product_id = products.product_id
                WHERE orders.id IN(
                    SELECT DISTINCT orders.id
                    FROM orders LEFT JOIN order_product 
                    ON orders.id = order_product.order_id
                    WHERE orders.user_id = ${req.session.userId} 
                    AND orders.status = '${orderStatus[0]}'
                    ORDER BY orders.id
                )
                ORDER BY date DESC,
                          orders.id ASC;`, (err, productInOrder) => {
      if (err) {
        res.send(err);
        fs.writeFileSync('api-user-error-log.txt', 
          `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      }
      if (productInOrder.length > 0) {
        let ordersArray = [];
        for (let i = 0; i < productInOrder.length; i++) {
          if (ordersArray.length === 0) {
            ordersArray[0] = {
                orderId: productInOrder[i].id,
                productList: [
                  {
                    product_id: productInOrder[i].product_id,
                    product_count: productInOrder[i].count,
                    product_amount: productInOrder[i].product_amount
                  }
                ],
                totalAmount: productInOrder[i].product_amount * 
                              productInOrder[i].count,
                totalCount: 1,
                orderDate: productInOrder[i].date
            }
          } else if (ordersArray.length > 0){
            for (let j = 0; j < ordersArray.length; j++) {
              if (ordersArray[j].orderId === productInOrder[i].id) {
                for (let k = 0; k < ordersArray[j].productList.length; k++) {
                  if(ordersArray[j].productList[k].product_id !== productInOrder[i].product_id) {
                    if (k === ordersArray[j].productList.length - 1) {
                      ordersArray[j].productList.push({
                        product_id: productInOrder[i].product_id,
                        product_count: productInOrder[i].count,
                        product_amount: productInOrder[i].product_amount,
                      });
                      ordersArray[j].totalAmount += productInOrder[i].count *
                                                    productInOrder[i].product_amount,
                      ordersArray[j].totalCount++; 
                    }
                  }
                }
              } else if (ordersArray[j].orderId !== productInOrder[i].id &&
                         j ===  ordersArray.length - 1) {
                ordersArray.push({
                  orderId: productInOrder[i].id,
                  productList: [
                    {
                      product_id: productInOrder[i].product_id,
                      product_count: productInOrder[i].count,
                      product_amount: productInOrder[i].product_amount
                    }
                  ],
                  totalAmount: productInOrder[i].product_amount * 
                               productInOrder[i].count,
                  totalCount: 1,
                  orderDate: productInOrder[i].date
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

/** Подробности заказа по id */
router.get('/order', (req, res) => {
  if (req.query.orderId !== undefined &&
      req.query.orderId > 0) {
    conn.query(`SELECT  order_product.count,
                        products.product_id,
                        products.product_name,
                        products.product_amount,
                        products.product_url_img,
                        orders.id,
                        orders.total
                FROM orders INNER JOIN order_product
                ON orders.id = order_product.order_id INNER JOIN products
                ON order_product.product_id = products.product_id
                WHERE order_product.order_id IN(
                    SELECT DISTINCT orders.id
                    FROM orders LEFT JOIN order_product 
                    ON orders.id = order_product.order_id
                    WHERE orders.user_id = ${req.session.userId}
                    AND orders.status = '${orderStatus[0]}'
                    AND orders.id = ${req.query.orderId}
                    ORDER BY orders.id
                )
                ORDER by orders.id;`, (err, orderData) => {
      if (err) {
        res.send(err);
        fs.writeFileSync('api-user-error-log.txt', 
          `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      }
      if(orderData.length > 0) {
        res.render('order', {
          userName: req.session.userName,
          successAuthentication: req.session.successAuthentication,
          isWorker: req.session.isWorker,
          orderData,
          orderId: orderData[0].id,
          totalAmount: orderData[0].total
        });
      } else {
        res.sendStatus(404);
      }
    });
  } else {
    res.sendStatus(404);
  }
});

router.get('/orderRegistration', (req, res) => {
  if (req.session.successAuthentication === true && 
      req.session.userId !== undefined && 
      req.session.isWorker === false) {
    conn.query(`SELECT  id,
                        users.address as 'address',
                        users.telephone as 'telephone'
                FROM orders INNER JOIN users
                ON orders.user_id = users.user_id
                WHERE orders.user_id = ${req.session.userId}
                AND status = '${orderStatus[1]}'`, (err, orderData) => {
      if (err) {
        res.send(err);
        fs.writeFileSync('api-user-error-log.txt', 
          `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      } else if (!err && orderData.length > 0) {
        if(orderData[0].address.length === 0) {
          res.render('addAddressDelivery', {
            userName: req.session.userName,
            successAuthentication: req.session.successAuthentication,
            isWorker: req.session.isWorker
          });
        } else {
          conn.query(`SELECT product_id
                      FROM order_product INNER JOIN orders
                      ON order_product.order_id = orders.id
                      WHERE orders.id = ${orderData[0].id}
                      AND orders.status = '${orderStatus[1]}'`, (err, productID) => {
            if (err) {
              res.send(err);
              fs.writeFileSync('api-user-error-log.txt', 
                `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
            } else if (!err && productID.length > 0) {
              let productIdArray = [];
              let productIdArrayWithSort;
              for (let i = 0; i < productID.length; i++) {
                productIdArray.push(productID[i].product_id);
              }
              productIdArrayWithSort = productIdArray.sort((a, b) => a - b);
              conn.query(`SELECT  products.product_id,
                                  product_name,
                                  product_url_img,
                                  product_description,
                                  product_amount,
                                  order_product.count,
                                  product_count_stock
                          FROM products INNER JOIN order_product 
                          ON products.product_id = order_product.product_id INNER JOIN orders 
                          ON order_product.order_id = orders.id
                          WHERE products.product_id IN(${productIdArrayWithSort.toString()}) 
                          AND orders.user_id = ${req.session.userId}
                          AND orders.status = '${orderStatus[1]}'`, (err, selProductList) => {
                if (err) {
                  res.send(err);
                  fs.writeFileSync('api-user-error-log.txt', 
                    `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
                } else if (!err && selProductList.length > 0) {
                  let totalCount = 0;
                  let totalAmount = 0;
                  for (let i = 0; i < selProductList.length; i++) {
                    totalCount++;
                    totalAmount +=  selProductList[i].product_amount * 
                                    selProductList[i].count;
                  }
                  res.render('orderRegistration', {
                    orderData: orderData[0],
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
        }
      } else {
        res.redirect(302, '/');
      }
    });
  } else {
    res.redirect(302, '/');
  }
});

// Форма изменения адреса доставки
router.get('/changeAddressDelivery', (req, res) => {
  if (req.session.successAuthentication === true &&
    req.session.isWorker === false) {
    conn.query(`SELECT address
                FROM users
                WHERE user_id = ${req.session.userId}`, (err, address) => {
      if(err) {
        res.send(err);
        fs.writeFileSync('api-user-error-log.txt',
          `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      } else if(!err && address.length > 0) {
        res.render('changeAddressDelivery', {
          userName: req.session.userName,
          successAuthentication: req.session.successAuthentication,
          isWorker: req.session.isWorker,
          address: address[0].address
        });
      }
    });
  } else {
    res.redirect(301, '/');
  }
});

// Форма редактирования данных аккаунта 
router.get('/myProfile', async (req, res) => {
  if (req.session.successAuthentication === true &&
    req.session.isWorker === false) {
    conn.query(`SELECT *
                FROM users
                WHERE user_id = ${req.session.userId}`, (err, accountData) => {
      if(err) {
        res.send(err);
        fs.writeFileSync('api-user-error-log.txt',
          `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      } else if(!err && accountData.length > 0) {
        res.render('myProfile', {
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

// Удаление товара из корзины с помощью кнопки "Удалить"
router.post('/deleteProductInCart', (req, res) => {
  if (req.body.product_id > 0 &&
      req.body.action === 'delete' && 
      req.body.nodeName === 'BUTTON') {
    conn.query(`DELETE order_product FROM order_product INNER JOIN orders
                ON order_product.order_id = orders.id
                WHERE orders.user_id = ${req.session.userId} 
                AND orders.status = '${orderStatus[1]}'
                AND order_product.product_id = ${req.body.product_id};`, err => {
      if (err) {
        console.log(err);
        res.send(err);
        fs.writeFileSync('api-user-error-log.txt', `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      }
      conn.query(`SELECT COUNT(order_product.product_id) as 'count' 
                  FROM order_product INNER JOIN orders
                  ON order_product.order_id = orders.id
                  WHERE orders.user_id = ${req.session.userId}
                  AND orders.status = '${orderStatus[1]}';`, (err, countProductInCart) => {
        if (err) {
          console.log(err);
          res.send(err);
          fs.writeFileSync('api-user-error-log.txt', `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
        } else if(!err && countProductInCart[0].count <= 0) {
          conn.query(`DELETE FROM orders
                      WHERE orders.user_id = ${req.session.userId}
                      AND orders.status = '${orderStatus[1]}';`, err => {
            if (err) {
              console.log(err);
              res.send(err);
              fs.writeFileSync('api-user-error-log.txt', `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
            }
            res.sendStatus(200);
          });
        } else {
          res.sendStatus(200); 
        }
      });
    });
  } else {
    res.status(500).send('Не удалось удалить товар из корзины');
  }
});

// Обработка заказа при нажатии кнопки "Оформить заказ"
router.post('/orderRegistration', (req, res) => {
  if (req.session.successAuthentication === true &&
      req.session.isWorker === false) {
    conn.query(`SELECT  orders.id,
                        products.product_id,
                        products.product_name,
                        products.product_amount,
                        order_product.count 
                FROM orders INNER JOIN order_product
                ON orders.id = order_product.order_id INNER JOIN products
                ON order_product.product_id = products.product_id
                WHERE orders.id IN(
                    SELECT id 
                    FROM orders
                    WHERE user_id=${req.session.userId}
                    AND status = '${orderStatus[1]}')
                AND orders.status = '${orderStatus[1]}';`, (err, productID) => {
      if (err) {
        res.send(err);
        fs.writeFileSync('api-user-error-log.txt', `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      }
      if (productID.length > 0) {
        let dateNow = new Date(); 
        let prepDate = {
          day: (dateNow.getDate() < 10) ? `0${dateNow.getDate()}` : dateNow.getDate(),
          month: ( dateNow.getMonth() + 1 < 10) ? `0${dateNow.getMonth() + 1}` : dateNow.getMonth() + 1,
          year: dateNow.getFullYear(),
          hours: (dateNow.getHours() < 10) ? `0${dateNow.getHours()}` : dateNow.getHours(),
          minutes: (dateNow.getMinutes() < 10) ? `0${dateNow.getMinutes()}` : dateNow.getMinutes()
        };
        let orderDate =  `${prepDate.day}.${prepDate.month}.${prepDate.year} ${prepDate.hours}:${prepDate.minutes}`;
        let productsInOrderHTML = '';
        let totalAmount = 0;
        for (let i = 0; i < productID.length; i++) {
          productsInOrderHTML += `<tr>
                                    <td>
                                      ${productID[i].product_name}
                                    </td>
                                    <td>
                                      ${productID[i].count} шт.
                                    </td>
                                    <td>
                                      ${productID[i].product_amount} руб.
                                    </td>
                                  </tr>`;
          totalAmount +=  productID[i].count *
                          productID[i].product_amount;
          conn.query(`UPDATE products
                      SET products.product_count_stock = products.product_count_stock - ${productID[i].count}
                      WHERE products.product_id = ${productID[i].product_id}`, err => {
            if (err) {
              res.send(err);
              fs.writeFileSync('api-user-error-log.txt', `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
            }
          });
          if(i === productID.length - 1) {
            updateOrder(req.session, productID, orderDate, totalAmount, productsInOrderHTML, res, req.url);
          }
        }
      } else {
        res.send('Произошла ошибка, пожалуйста, попробуйте позднее');
      }
    });        
  } else {
    res.send('Этот адрес доступен только зарегистрированным пользователям');
  }
});

// Добавление адреса доставки
router.post('/addAddressDelivery', urlencodedParser, (req, res) => {
  if (req.session.successAuthentication === true &&
      req.session.isWorker === false) {
    if(req.body.address.length > 0) {
      conn.query(`UPDATE users
                  SET address = '${req.body.address}'
                  WHERE user_id = ${req.session.userId};`, err => {
        if (err) {
          res.send(err);
          fs.writeFileSync('api-user-error-log.txt', `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
        } 
        res.redirect('/orderRegistration');
      });
    } else {
      res.send('Вы не указали адрес доставки');
    }
  } else {
    res.send('Этот адрес доступен только зарегистрированным пользователям');
  }
});

// Добавление товара в корзину при нажатии клавиши "Добавить в корзину"
router.post('/addToCart', (req, res) => {
  if (req.session.successAuthentication === true &&
    req.body.product_id !== undefined && 
    req.session.isWorker === false) {
    conn.query(`SELECT product_count_stock as 'stock'
                FROM products
                WHERE product_id = ${req.body.product_id}`, (err, inStock) => {
      if (err) {
        console.log(err);
        fs.writeFileSync('api-user-error-log.txt', 
          `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
        res.send({err});
      } else if (!err && inStock.length > 0) {
        conn.query(`SELECT id 
                    FROM orders
                    WHERE user_id = ${req.session.userId}
                    AND status = '${orderStatus[1]}'`, (err, orderID) => {
          if (err) {
            console.log(err);
            fs.writeFileSync('api-user-error-log.txt', 
              `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
            res.send({err});
          } else if (!err && orderID.length > 0) {
            conn.query(`SELECT order_product.count 
                        FROM order_product INNER JOIN orders 
                        ON order_product.order_id = orders.id
                        WHERE orders.id = ${orderID[0].id} 
                        AND product_id = ${req.body.product_id}
                        AND orders.status = '${orderStatus[1]}'`, (err, productCount) => {
              if (err) {
                console.log(err);
                fs.writeFileSync('api-user-error-log.txt', 
                  `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
                res.send({err});
              } else if (!err && productCount.length === 0) {
                if(inStock[0].stock >= 1) {
                  conn.query(`INSERT INTO order_product 
                              VALUE(${orderID[0].id},
                                    ${req.body.product_id},
                                    1)`, (err) => {
                    if (err) {
                      console.log(err);
                      fs.writeFileSync('api-user-error-log.txt', 
                        `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
                      res.send({err: 'Не удалось добавить товар'});
                    } else {
                      res.send({buttonText: 'Товар добавлен'});
                    }
                  });
                }
              } else {
                res.send({buttonText: 'Уже в корзине'});
              }
            });
          } else if (orderID.length === 0) {
            if(inStock[0].stock >= 1) {
              conn.query(`SELECT  id, 
                                  user_id 
                          FROM orders
                          ORDER BY id DESC LIMIT 1`, (err, lastCart) => {
                if (err) {
                  console.log(err);
                  fs.writeFileSync('api-user-error-log.txt', 
                    `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
                  res.send({err: 'Не удалось добавить товар'});
                } else {
                  conn.query(`INSERT INTO orders
                              VALUE(${(lastCart.length !== 0) ? +lastCart[0].id + 1 : 1},
                                    ${req.session.userId},
                                    null,
                                    0,
                                    '${orderStatus[1]}')`, (err) => {
                    if (err) {
                      console.log(err);
                      fs.writeFileSync('api-user-error-log.txt', 
                        `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
                      res.send({err: 'Не удалось добавить товар'});
                    } else {
                      conn.query(`INSERT INTO order_product
                                  VALUE(${(lastCart.length !== 0) ? +lastCart[0].id + 1 : 1},
                                        ${req.body.product_id},
                                        1)`, (err) => {
                        if (err) {
                          console.log(err);
                          fs.writeFileSync('api-user-error-log.txt', 
                            `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
                          res.send({err: 'Не удалось добавить товар'});
                        } else {
                          res.send({buttonText: 'Товар добавлен'});
                        }
                      });
                    }
                  });
                }
              });
            } else {
              res.send({buttonText: 'Нет в наличии'});
            }
          }
        });
      }
    });
  } else {
    res.sendStatus(400);
  }
});

// Добавление товара в корзину при нажатии клавиши "В корзину" на странице товара
router.post('/addToCartWithQuantity', (req, res) => {
  if (req.session.successAuthentication === true &&
    (req.body.product && typeof req.body.product === 'object') && 
    req.session.isWorker === false) {
    conn.query(`SELECT product_count_stock as 'in_stock'
                FROM products
                WHERE product_id = ${req.body.product.id};`, (err, inStock) => {
      if (err) {
        console.log(err);
        fs.writeFileSync('api-user-error-log.txt', 
          `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
        res.send({
          message: 'Не удалось добавить товар',
          buttonText: 'Ошибка'
        });
      } else if(!err && inStock.length > 0) {
        if(inStock[0].in_stock >= req.body.product.count) {
          conn.query(`SELECT id
                      FROM orders
                      WHERE user_id = ${req.session.userId}
                      AND status = '${orderStatus[1]}';`, (err, existingOrder) => {
            if (err) {
              console.log(err);
              fs.writeFileSync('api-user-error-log.txt', 
                `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
              res.send({
                message: 'Не удалось добавить товар',
                buttonText: 'Ошибка'
              });
            } else if(!err && existingOrder.length > 0) {
              conn.query(`SELECT product_id
                          FROM order_product
                          WHERE order_id = ${existingOrder[0].id};`, (err, existingProductInCart) => {
                if (err) {
                  console.log(err);
                  fs.writeFileSync('api-user-error-log.txt', 
                    `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
                  res.send({
                    message: 'Не удалось добавить товар',
                    buttonText: 'Ошибка'
                  });
                } else if(!err && existingProductInCart.length > 0) {
                  res.send({
                    message: 'Товар уже присутствует в корзине, для редактирования количества перейдите в корзину',
                    buttonText: 'Уже в корзине'
                  });
                } else if(!err && existingProductInCart.length === 0) {
                  conn.query(`INSERT INTO order_product
                              VALUE(${existingOrder[0].id},
                                    ${req.body.product.id},
                                    ${req.body.product.count});`, err => {
                    if (err) {
                      console.log(err);
                      fs.writeFileSync('api-user-error-log.txt', 
                        `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
                      res.send({
                        message: 'Не удалось добавить товар',
                        buttonText: 'Ошибка'
                      });
                    } else {
                      res.send({
                        message: 'Товар успешно добавлен в корзину',
                        buttonText: 'В корзине'
                      });
                    }
                  });
                }
              });
            } else if(!err && existingOrder.length === 0) {
              conn.query(`SELECT id 
                          FROM orders
                          ORDER BY id 
                          DESC LIMIT 1;`, (err, lastOrder) => {
                if (err) {
                  console.log(err);
                  fs.writeFileSync('api-user-error-log.txt', 
                    `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
                  res.send({
                    message: 'Не удалось добавить товар',
                    buttonText: 'Ошибка'
                  });
                } else {
                  conn.query(`INSERT INTO orders
                              VALUE(${(lastOrder.length > 0) ? lastOrder[0].id + 1 : 1},
                                    ${req.session.userId},
                                    NULL,
                                    0,
                                    '${orderStatus[1]}');`, err => {
                    if (err) {
                      console.log(err);
                      fs.writeFileSync('api-user-error-log.txt', 
                        `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
                      res.send({
                        message: 'Не удалось добавить товар',
                        buttonText: 'Ошибка'
                      });
                    } else {
                      conn.query(`INSERT INTO order_product
                                  VALUE(${(lastOrder.length > 0) ? lastOrder[0].id + 1 : 1},
                                        ${req.body.product.id},
                                        ${req.body.product.count});`, err => {
                        if(err) {
                          console.log(err);
                          fs.writeFileSync('api-user-error-log.txt', 
                            `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
                          res.send({
                            message: 'Не удалось добавить товар',
                            buttonText: 'Ошибка'
                          });
                        } else {
                          res.send({
                            message: 'Товар успешно добавлен в корзину',
                            buttonText: 'В корзине'
                          });
                        }
                      });
                    }
                  });
                }
              });
            }       
          });
        } else {
          res.send({
            message: 'Спрос превышает предложение. Уменьшите количество и повторите снова',
            buttonText: 'Добавить в корзину',
            tooMuch: true
          });
        }
      } else if(!err && inStock.length === 0) {
        res.send({
          message: 'Товара с таким идентификационным кодом не существует',
          buttonText: 'Ошибка'
        });
      }
    });
  } 
});

// Изменение кол-ва товара в корзине при помощи соотв. кнопок
router.post('/changeCountByButton', (req, res) => {
  if (req.body.product_id !== undefined && req.body.product_count >= 1) {
    conn.query(`SELECT products.product_id, 
                        products.product_count_stock
                FROM orders INNER JOIN order_product 
                ON orders.id = order_product.order_id INNER JOIN products 
                ON order_product.product_id = products.product_id
                WHERE orders.user_id = ${req.session.userId} 
                AND orders.status = '${orderStatus[1]}'
                AND order_product.product_id = ${req.body.product_id}`, (err, cart) => {
      if (err) {
        console.log(err);
        fs.writeFileSync('api-user-error-log.txt', 
          `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
          res.send(err);
      } else if (!err && cart.length > 0) {
        if (req.body.action === 'plus' && 
            req.body.nodeName === 'BUTTON') {
          if (req.body.product_count > cart[0].product_count_stock) {
            res.sendStatus(500);
          } else {
            conn.query(`UPDATE order_product INNER JOIN orders
                        ON order_product.order_id = orders.id 
                        SET order_product.count = order_product.count + 1 
                        WHERE orders.user_id = ${req.session.userId}
                        AND orders.status = '${orderStatus[1]}'
                        AND order_product.product_id = ${req.body.product_id};`, err =>{
              if (err) {
                console.log(err);
                res.send(err);
                fs.writeFileSync('api-user-error-log.txt', `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
              } else
                res.sendStatus(200);
            });
          }
        } else if  (req.body.action === 'minus' && 
                    req.body.nodeName === 'BUTTON' && 
                    req.body.product_count > 0) {
          if (req.body.product_count <= 1) {
            conn.query(`DELETE order_product FROM order_product INNER JOIN orders
                        ON order_product.order_id = orders.id
                        WHERE orders.user_id = ${req.session.userId} 
                        AND orders.status = '${orderStatus[1]}'
                        AND order_product.product_id = ${req.body.product_id};`, err => {
              if (err) {
                console.log(err);
                res.send(err);
                fs.writeFileSync('api-user-error-log.txt', `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
              } else {
                conn.query(`SELECT COUNT(order_product.product_id) as 'count' 
                            FROM order_product INNER JOIN orders
                            ON order_product.order_id = orders.id
                            WHERE orders.user_id = ${req.session.userId}
                            AND orders.status = '${orderStatus[1]}';`, (err, countProductInCart) => {
                  if (err) {throw err;}
                  if (countProductInCart[0].count <= 0) {
                    conn.query(`DELETE FROM orders
                                WHERE orders.user_id = ${req.session.userId}
                                AND orders.status = '${orderStatus[1]}';`, err => {
                      if (err) {
                        throw err;
                      }
                      res.sendStatus(200);
                    });
                  } else {
                    res.sendStatus(200); 
                  }
                });
              }
            });
          } else if (req.body.product_count <= cart[0].product_count_stock) {
            conn.query(`UPDATE order_product INNER JOIN orders
                        ON order_product.order_id = orders.id
                        SET order_product.count = ${req.body.product_count - 1}
                        WHERE orders.user_id = ${req.session.userId} 
                        AND orders.status = '${orderStatus[1]}'
                        AND order_product.product_id = ${req.body.product_id};`, err => {
              if (err) {
                console.log(err);
                res.send(err);
                fs.writeFileSync('api-user-error-log.txt', `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
              } else
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

// Изменение кол-ва товара в заказе при помощи поля ввода кол-ва товара
router.post('/changeCountByInput', (req, res) => {
  if (req.body.product_id !== undefined && 
      req.body.product_count >= 1) {
    conn.query(`SELECT products.product_id, 
                        products.product_count_stock
                FROM orders
                INNER JOIN order_product ON orders.id = order_product.order_id
                INNER JOIN products ON order_product.product_id = products.product_id
                WHERE orders.user_id = ${req.session.userId} 
                AND orders.status = '${orderStatus[1]}'
                AND order_product.product_id = ${req.body.product_id}`, (err, cart) => {
      if (err) {
        console.log(err);
        res.send(err);
        fs.writeFileSync('api-user-error-log.txt', `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      } else if (!err && cart.length > 0) {
        if (req.body.nodeName === 'INPUT' &&
            req.body.action === 'changeByInput' &&
            req.body.product_count >= 1 &&
            req.body.product_count <= cart[0].product_count_stock) {
          conn.query(`UPDATE order_product INNER JOIN orders
                      ON order_product.order_id = orders.id
                      SET order_product.count = ${req.body.product_count}
                      WHERE orders.user_id = ${req.session.userId} 
                      AND orders.status = '${orderStatus[1]}'
                      AND order_product.product_id = ${req.body.product_id};`, err => {
            if (err) {
              console.log(err);
              res.send(err);
              fs.writeFileSync('api-user-error-log.txt', 
                `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
            } else
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

// Изменение адреса доставки
router.post('/changeAddressDelivery', urlencodedParser, (req, res) => {
  if (req.session.successAuthentication === true &&
    req.session.isWorker === false &&
    req.body.address) {
    conn.query(`UPDATE users
                SET address = '${req.body.address}'
                WHERE user_id = ${req.session.userId}`, err => {
      if(err) {
        res.send(err);
        fs.writeFileSync('api-user-error-log.txt', 
          `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      } else {
        res.redirect(301, '/');
      }
    });
  }
});

// Изменение данных аккаунта
router.post('/myProfile', urlencodedParser, (req, res) => {
  if (!req.body.surname || 
      !req.body.firstname || 
      !req.body.patronymic ||
      !req.body.email ||
      !req.body.telephone ||
      !req.body.address ||
      !req.body.password) return res.sendStatus(400);
  if (req.session.isWorker === false &&
      req.session.successAuthentication === true) {
    conn.query(`SELECT user_id 
                FROM internet_magazine.users
                WHERE (email = '${req.body.email}' OR telephone = '${req.body.telephone}') 
                AND user_id <> 6;`, (err, existingUser) => {
      if(err) {
        res.send(err);
        fs.writeFileSync('api-user-error-log.txt', 
          `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
      } else if(!err && existingUser.length === 0) {
        conn.query(`UPDATE users
                    SET user_surname = '${req.body.surname}',
                        user_name = '${req.body.firstname}',
                        user_patronymic = '${req.body.patronymic}',
                        email = '${req.body.email}',
                        telephone = ${req.body.telephone},
                        password = '${req.body.password}',
                        address = '${req.body.address}'
                    WHERE user_id = ${req.session.userId};`, err => {
          if(err) {
            res.send(err);
            fs.writeFileSync('api-user-error-log.txt', 
              `${fs.readFileSync('api-user-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
          } else {
            console.log('index');
            res.render('index', {
              userName: req.session.userName,
              successAuthentication: req.session.successAuthentication,
              isWorker: req.session.isWorker
            });
          }
        });
      } else if(!err && existingUser.length > 0) {
        res.render('myProfile', {
          userName: req.session.userName,
          successAuthentication: req.session.successAuthentication,
          isWorker: req.session.isWorker,
          accountData: {
            user_surname: req.body.surname,
            user_name: req.body.firstname,
            user_patronymic: req.body.patronymic,
            email: req.body.email,
            telephone: req.body.telephone,
            address: req.body.address,
            password: req.body.password
          },
          message: 'Пользователь с таким email/номером телефона существует'
        });
      }
    });
  }
});

// Обновление статуса заказа, отправление заказа на почту пользователя
function updateOrder(session, productID, orderDate, totalAmount, productsInOrderHTML, res, url) {
  conn.query(`UPDATE orders 
              SET status = '${orderStatus[0]}',
                  date = NOW(),
                  total = ${totalAmount}
              WHERE user_id = ${session.userId}
              AND id = ${productID[0].id}
              AND status = '${orderStatus[1]}';`, err => {
    if (err) {
      res.send(err);
      fs.writeFileSync('api-user-error-log.txt', `${fs.readFileSync('api-user-error-log.txt')}\n${url}: ${err} ${new Date().toLocaleDateString()}`);
    } else {
      conn.query(`SELECT email
                  FROM users
                  WHERE user_id = ${session.userId};`, (err, email) => {
        if (err) {
          res.send(err);
          fs.writeFileSync('api-user-error-log.txt', `${fs.readFileSync('api-user-error-log.txt')}\n${url}: ${err} ${new Date().toLocaleDateString()}`);
        } else if (!err && 
                    email.length > 0) {
          sendMail({
            from: 'internet-magazine@domain.com',
            to: `${email[0].email}`,
            subject: 'Заказ с Интернет-магазина',
            html: `
                  <style>
                    * {
                      font-family: sans-serif;
                    }
                    .order_head {
                      background: #4d4d4d;
                      padding: 10px 15px 5px 15px;
                      color: #f5f5f5;
                      border-bottom: 1px solid #f2f2f2;
                    }

                    .order_body {
                      width: 100%;
                      background: #4d4d4d;
                      padding: 5px 15px 10px 15px;
                      color: #f5f5f5;
                    }

                    .order_total {
                      color: #f5f5f5;
                      background: #4d4d4d;
                      padding: 10px 15px;
                      margin-top: 1px;
                    }

                    caption {
                      text-align: center;
                      padding: 5px 0;
                      width: 100%;
                      font-size: 20px;
                      background: #4d4d4d;
                    }

                    .order_body thead {
                      text-align: left
                    }

                    .order_body thead th:not(:first-child),
                    .order_body tbody td:not(:first-child) {
                      padding: 0 10px;
                    }
                  </style>
                  <div class="order_head">
                    Ваш заказ № ${productID[0].id} от ${orderDate} принят к обработке
                  </div>
                  <table class="order_body">
                    <caption>Список товаров</caption>
                    <thead>
                      <tr>
                        <th>Наименование товара</th>
                        <th>Количество</th>
                        <th>Стоимость</th>
                      </tr>
                    </thead>  
                    <tbody>
                      ${productsInOrderHTML}
                    </tbody>
                  </table>
                  <div class="order_total">
                      <span><strong>Итоговая стоимость:</strong></span>
                      <span colspan="2" style="text-align: left;"><strong>${totalAmount} руб.</strong></span>
                  </div>`
          }, err => {
            if (err) {
              res.send('Произошла ошибка отправления чека на электронную почту, заказ успешно подтверждён');
              fs.writeFileSync('api-user-error-log.txt', `${fs.readFileSync('api-user-error-log.txt')}\n${url}: ${err} ${new Date().toLocaleDateString()}`);
              console.log(err);
            } else 
              res.render('index', {
                userName: session.userName,
                successAuthentication: session.successAuthentication,
                isWorker: session.isWorker,
                message: 'Заказ подтверждён'
              });
          });
        }
      });
    }
  });
}

module.exports = router;