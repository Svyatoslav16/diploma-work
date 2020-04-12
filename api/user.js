
const express = require('express'),
      bodyParser = require('body-parser'),
      sendMail = require('sendmail')(),
      router = express.Router(),
      mysql = require('./mySQL');

const conn = mysql.conn;

const urlencodedParser = bodyParser.urlencoded({extended: false});

/** Статусы заказа ['Подтверждён', 'Не подтверждён']*/
const orderStatus = ['Подтверждён', 'Не подтверждён'];

router.use(mysql.userSession);

router.get('/cart1', (req, res) => {    
  if (req.session.successAuthentication === true && 
      req.session.userId && 
      req.session.isWorker === false) {
      conn.query(`SELECT id 
                  FROM orders
                  WHERE user_id=${req.session.userId}
                  AND status = '${orderStatus[1]}'`, (err, orderData) => {
    if (err) {throw err;}
    if (orderData.length > 0) {
      conn.query(`SELECT product_id
                  FROM order_product
                  WHERE order_id = ${orderData[0].id}`, (err, selProductId) => {
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
                              order_product.count,
                              product_count_stock
                      FROM products 
                      INNER JOIN order_product ON products.product_id = order_product.product_id
                      INNER JOIN orders ON order_product.order_id = orders.id
                      WHERE products.product_id IN(${productIdArrayWithSort.toString()}) 
                      AND orders.user_id = ${req.session.userId}
                      AND orders.status = '${orderStatus[1]}'
                      ORDER BY products.product_id;`, (err, selProductList) => {
            if (err) {throw err;}
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
      if (err) {throw err;}
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
      if(err) {throw err;}
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
        if (err) {throw err;}
        if (orderData.length > 0) {
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
                                    order_product.count,
                                    product_count_stock
                            FROM products INNER JOIN order_product 
                            ON products.product_id = order_product.product_id INNER JOIN orders 
                            ON order_product.order_id = orders.id
                            WHERE products.product_id IN(${productIdArrayWithSort.toString()}) 
                            AND orders.user_id = ${req.session.userId}
                            AND orders.status = '${orderStatus[1]}'`, (err, selProductList) => {
                  if (err) {throw err;}
                  if (selProductList.length > 0) {
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


/** Удаление товара из корзины с помощью кнопки "Удалить" */
router.post('/deleteProductInCart', (req, res) => {
  if (req.body.product_id > 0 &&
      req.body.action === 'delete' && 
      req.body.nodeName === 'BUTTON') {
    conn.query(`DELETE order_product FROM order_product INNER JOIN orders
                ON order_product.order_id = orders.id
                WHERE orders.user_id = ${req.session.userId} 
                AND orders.status = '${orderStatus[1]}'
                AND order_product.product_id = ${req.body.product_id};`, err => {
      if (err) {throw err;}
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
            if (err) {throw err;}
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

/**  */
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
                AND orders.status = '${orderStatus[1]}';`, (err, selProductId) => {
      if (err) {throw err;}
      if (selProductId.length > 0) {
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
        for (let i = 0; i < selProductId.length; i++) {
          productsInOrderHTML += `<tr>
                                    <td>
                                      ${selProductId[i].product_name}
                                    </td>
                                    <td>
                                      ${selProductId[i].count}
                                    </td>
                                    <td>
                                      ${selProductId[i].product_amount}
                                    </td>
                                  </tr>`;
          totalAmount +=  selProductId[i].count *
                          selProductId[i].product_amount;
          conn.query(`UPDATE products
                      SET products.product_count_stock = products.product_count_stock - ${selProductId[i].count}
                      WHERE products.product_id = ${selProductId[i].product_id}`, err => {
            if (err) {throw err;}
          });
          if(i === selProductId.length - 1) {
            updateOrder(req.session, selProductId, orderDate, totalAmount, productsInOrderHTML, res);
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

router.post('/addAddressDelivery', urlencodedParser, (req, res) => {
  if (req.session.successAuthentication === true &&
      req.session.isWorker === false) {
    if(req.body.address.length > 0) {
      conn.query(`UPDATE users
                  SET address = '${req.body.address}'
                  WHERE user_id = ${req.session.userId};`, err => {
        if(err) {
          throw err;
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

router.post('/addToCart', (req, res) => {
  if (req.body.product_id !== undefined && 
      req.session.isWorker === false) {
      conn.query(`SELECT id 
                  FROM orders
                  WHERE user_id = ${req.session.userId}
                  AND status = '${orderStatus[1]}'`, (err, selectCartRes) => {
          if (err) {throw err};
          if (selectCartRes.length > 0) {
              conn.query(`SELECT order_product.count 
                          FROM order_product INNER JOIN orders 
                          ON order_product.order_id = orders.id
                          WHERE orders.id = ${selectCartRes[0].id} 
                          AND product_id = ${req.body.product_id}
                          AND orders.status = '${orderStatus[1]}'`, (err, selectProduct) => {
                  if (err) {throw err;}
                  if (selectProduct.length === 0) {
                      conn.query(`INSERT INTO order_product 
                                  VALUE(${selectCartRes[0].id},
                                        ${req.body.product_id},
                                        1)`, (err) => {
                          if (err) {throw err;}
                          res.sendStatus(200);
                      });
                  } else {
                      res.sendStatus(204);
                  }
              });
          } else if (selectCartRes.length === 0) {
              conn.query(`SELECT id, 
                                 user_id 
                          FROM orders
                          ORDER BY id DESC LIMIT 1`, (err, selLastCart) => {
                  if (err) {throw err;}
                  conn.query(`INSERT INTO orders
                              VALUE(${(selLastCart.length !== 0) ? +selLastCart[0].id + 1 : 1},
                                    ${req.session.userId},
                                    null,
                                    0,
                                    '${orderStatus[1]}')`, (err) => {
                      if (err) {throw err;}
                      conn.query(`INSERT INTO order_product
                                  VALUE(${(selLastCart.length !== 0) ? +selLastCart[0].id + 1 : 1},
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
      res.sendStatus(400);
  }
});

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
          if (err) {throw err;}
          if (cart.length > 0) {
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
                          if (err) {throw err;}
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
                          if (err) {throw err;}
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
                                      if (err) {throw err;}
                                      res.sendStatus(200);
                                  });
                              } else {
                                  res.sendStatus(200); 
                              }
                          });
                      });
                  } else if (req.body.product_count <= cart[0].product_count_stock) {
                      conn.query(`UPDATE order_product INNER JOIN orders
                                  ON order_product.order_id = orders.id
                                  SET order_product.count = ${req.body.product_count - 1}
                                  WHERE orders.user_id = ${req.session.userId} 
                                  AND orders.status = '${orderStatus[1]}'
                                  AND order_product.product_id = ${req.body.product_id};`, err => {
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
          if (err) {throw err;}
          if (cart.length > 0) {
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


/** Обновление статуса заказа, отправление заказа на почту пользователя */ 
function updateOrder(session, selProductId, orderDate, totalAmount, productsInOrderHTML, res) {
  conn.query(`UPDATE orders 
              SET status = '${orderStatus[0]}',
                  date = NOW(),
                  total = ${totalAmount}
              WHERE user_id = ${session.userId}
              AND id = ${selProductId[0].id}
              AND status = '${orderStatus[1]}';`, err => {
    if (err) {throw err;}
    conn.query(`SELECT email
                FROM users
                WHERE user_id = ${session.userId};`, (err, email) => {
      if (err) {throw err;}
      if(email.length > 0) {
        sendMail({
          from: 'internet-magazine@domain.com',
          to: `${email[0].email}`,
          subject: 'Заказ с Интернет-магазина',
          html: `<div style="font-family: Arial, Helvetica, sans-serif; background-color: #4c84c7; color: #fff;">
                  Ваш заказ № ${selProductId[0].id} от ${orderDate} принят к обработке
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Наименование товара</th>
                      <th>Количество</th>
                      <th>Стоимость</th>
                    </tr>
                  </thead>  
                  <tbody>
                    ${productsInOrderHTML}
                    <tr>
                      <td><strong>Итоговая стоимость:</strong></td>
                      <td colspan="2" style="text-align: left;"><strong>${totalAmount}</strong></td>
                    </tr>
                  </tbody>
                </table>`
        }, err => {
          if (err) {throw err;}
          res.render('index', {
            userName: session.userName,
            successAuthentication: session.successAuthentication,
            isWorker: session.isWorker
          });
        });
      }
    });
  });
}


module.exports = router;