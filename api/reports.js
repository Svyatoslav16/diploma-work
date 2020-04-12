const express = require('express'),
      router = express.Router(),
      bodyParser = require('body-parser'),
      mysql = require('./mySQL');
      
const conn = mysql.conn;

// Статусы заказа, в будущем значений может быть больше
const orderStatus = ['Подтверждён', 'Не подтверждён'];

const urlencodedParser = bodyParser.urlencoded({extended: false});

/* Для диплома. Покажет форму для выбора промежутка продаж */
router.get('/salesByRangeForm', (req, res) => {
  if (req.session.isWorker === true && 
      req.session.successAuthentication === true) {
    res.render('salesByRangeForm', {
      userName: req.session.userName,
      successAuthentication: req.session.successAuthentication,
      isWorker: req.session.isWorker
    });
  } else {
    res.redirect(302, '/');
  }
});

// Редактирование товара по id
router.get('/editProductProperties', (req, res) => {
  if (req.query.productId !== undefined &&
      req.query.productId > 0) {
      conn.query(`SELECT  products.product_id,
                          products.product_name,
                          products.product_url_img,
                          products.product_description,
                          products.product_amount,
                          products.product_count_stock,
                          product_category.name as 'category'
                  FROM products INNER JOIN product_category
                  ON products.product_category_id = product_category.id
                  WHERE product_id = ${req.query.productId}`, (err, product) => {
          if(err) {throw err;}
          if(product.length > 0) {
              conn.query(`SELECT  id,
                                  name
                          FROM product_category`, (err, categories) => {
                  if (err) {throw err};
                  if(categories.length > 0) {
                      res.render('editProductProperties', {
                          userName: req.session.userName,
                          successAuthentication: req.session.successAuthentication,
                          isWorker: req.session.isWorker,
                          product: product[0],
                          categories,
                      });
                  }
              });
          } else {
              res.sendStatus(404);
          }
      });
  } else {
      res.sendStatus(404);
  }
});

// Продажи за день
router.get('/salesPerDay', (req, res) => {
  if (req.session.isWorker === true && 
      req.session.successAuthentication === true) {
      conn.query(`SELECT  products.product_name,
                          products.product_amount,
                          product_category.name,
                          order_product.count,
                          users.user_name,
                          users.user_surname,
                          users.user_patronymic
                  FROM users INNER JOIN orders
                  ON users.user_id = orders.user_id INNER JOIN order_product
                  ON orders.id = order_product.order_id INNER JOIN products
                  ON order_product.product_id = products.product_id INNER JOIN product_category
                  ON products.product_category_id = product_category.id 
                  WHERE date_format(orders.date, '%d.%m.%Y') = date_format(CURDATE(), '%d.%m.%Y')
                  AND orders.status = '${orderStatus[0]}';`, (err, salesPerDay) => {
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

// Приход товаров
router.get('/supplyOfProducts', (req, res) => {
  if (req.session.isWorker === true && 
      req.session.successAuthentication === true) {
      conn.query(`SELECT  income.id,
                          date_format(income.date, '%d.%m.%Y %H:%i') as 'date',
                          income.total,
                          products.product_id,
                          income_product.count,
                          income_product.amount,
                          products.product_name,
                          products.product_description,
                          products.product_count_stock,
                          product_category.name
                  FROM income INNER JOIN income_product
                  ON income.id = income_product.income_id INNER JOIN products
                  ON income_product.product_id = products.product_id INNER JOIN product_category
                  ON products.product_category_id = product_category.id
                  ORDER BY date;`, (err, supplyOfProducts) => {
          if(err) {throw err;}
          if(supplyOfProducts.length > 0) {
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

// Отчёт по всем товарам
router.get('/productsReport', (req, res) => {
    if(req.session.isWorker === true && req.session.successAuthentication === true) {
        conn.query(`SELECT  products.product_id,
                            products.product_name,
                            product_category.name as 'category',
                            products.product_name,
                            products.product_description,
                            products.product_amount,  
                            products.product_count_stock  
                    FROM products INNER JOIN product_category
                    ON products.product_category_id = product_category.id
                    ORDER BY category`, (err, products) => {
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

// Продажи за период
router.post('/salesByRange', urlencodedParser, (req, res) => {
  if (isNaN(Date.parse(req.body.startDate)) === false &&
      isNaN(Date.parse(req.body.endDate)) === false )  {
    conn.query(`SELECT  products.product_name as 'product',
                        products.product_amount as 'amount',
                        product_category.name as 'category',
                        order_product.count as 'count',
                        users.user_name as 'user',
                        date_format(orders.date, '%d.%m.%Y %H:%i') as 'date'
                FROM users INNER JOIN orders
                ON users.user_id = orders.user_id INNER JOIN order_product
                ON orders.id = order_product.order_id INNER JOIN products
                ON order_product.product_id = products.product_id INNER JOIN product_category
                ON products.product_category_id = product_category.id 
                WHERE date >= '${req.body.startDate}' 
                AND date <= '${req.body.endDate}'
                ORDER BY date;`, (err, salesByRange) => {
      if(err) {throw err;}
      res.render('salesByRange', {
        userName: req.session.userName,
        successAuthentication: req.session.successAuthentication,
        isWorker: req.session.isWorker,
        salesByRange
      });
    });
  } else {
    res.render('salesByRangeForm', {
      userName: req.session.userName,
      successAuthentication: req.session.successAuthentication,
      isWorker: req.session.isWorker,
      error: 'Выберите промежуток'
    });
  }
});

module.exports = router;