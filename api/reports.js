const express = require('express'),
      router = express.Router(),
      bodyParser = require('body-parser'),
      fs = require("fs"),
      mysql = require('./mySQL');
      
const conn = mysql.conn;

// Статусы заказа, в будущем значений может быть больше
const orderStatus = ['Подтверждён', 'Не подтверждён'];

const urlencodedParser = bodyParser.urlencoded({extended: false});

/* Для диплома. Покажет форму для выбора промежутка продаж */
router.get('/salesByRange', (req, res) => {
  if (req.session.isWorker === true && 
      req.session.successAuthentication === true) {
    res.render('salesByRange', {
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
    conn.query(`SELECT  products.product_name as 'name',
                        products.product_amount as 'amount',
                        product_category.name as 'category',
                        order_product.count,
                        users.user_name,
                        users.user_surname
                FROM users INNER JOIN orders
                ON users.user_id = orders.user_id INNER JOIN order_product
                ON orders.id = order_product.order_id INNER JOIN products
                ON order_product.product_id = products.product_id INNER JOIN product_category
                ON products.product_category_id = product_category.id 
                WHERE date_format(orders.date, '%d.%m.%Y') = date_format(CURDATE(), '%d.%m.%Y')
                AND orders.status = '${orderStatus[0]}';`, (err, sales) => {
      if(err) {throw err;}
      res.render('salesPerDay', {
        userName: req.session.userName,
        successAuthentication: req.session.successAuthentication,
        isWorker: req.session.isWorker,
        sales
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
    conn.query(`SELECT  income.id as 'income',
                        date_format(income.date, '%d.%m.%Y %H:%i') as 'date',
                        income_product.count,
                        income_product.amount,
                        products.product_name,
                        product_category.name as 'category',
                        worker.worker_name,
                        worker.worker_surname,
                        worker.worker_patronymic
                FROM worker INNER JOIN income
                ON worker.worker_id = income.worker_id INNER JOIN income_product
                ON income.id = income_product.income_id INNER JOIN products
                ON income_product.product_id = products.product_id INNER JOIN product_category
                ON products.product_category_id = product_category.id
                ORDER BY income.date`, (err, incomes) => {
      if(err) {
        throw err;
      } else {
        let incomeList = [];
        for (let i = 0; i < incomes.length; i++) {
          if(incomeList.length > 0) {
            for (let j = 0; j < incomeList.length; j++) {
              if(incomes[i].income === incomeList[j].income) {
                incomeList[j].productList.push({
                  name: incomes[i].product_name,
                  category: incomes[i].category,
                  count: incomes[i].count,
                  amount: incomes[i].amount
                });
                break;
              } else if(j === incomeList.length - 1) {
                incomeList.push({
                  income: incomes[i].income,
                  productList: [{
                    name: incomes[i].product_name,
                    category: incomes[i].category,
                    count: incomes[i].count,
                    amount: incomes[i].amount
                  }],
                  date: incomes[i].date,
                  worker: `${incomes[i].worker_surname} ${incomes[i].worker_name} ${incomes[i].worker_patronymic}`
                });
                break;
              }
            }
          } else if(incomeList.length === 0) {
            incomeList.push({
              income: incomes[i].income,
              productList: [{
                name: incomes[i].product_name,
                category: incomes[i].category,
                count: incomes[i].count,
                amount: incomes[i].amount
              }],
              date: incomes[i].date,
              worker: `${incomes[i].worker_surname} ${incomes[i].worker_name} ${incomes[i].worker_patronymic}`
            });
          }
        }

        res.render('supplyOfProducts', {
          userName: req.session.userName,
          successAuthentication: req.session.successAuthentication,
          isWorker: req.session.isWorker,
          incomeList
        });
      }
    });
  } else {
    res.redirect(302, '/');
  }
});

// Отчёт по всем товарам
router.get('/productsReport', (req, res) => {
  if (req.session.isWorker === true && 
      req.session.successAuthentication === true) {
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

// Отчет по сотрудникам
router.get('/personnel', (req, res) => {
  if (req.session.isWorker === true && 
      req.session.successAuthentication === true) {
    conn.query(`SELECT  worker.worker_id,
                        worker.worker_name as 'name',
                        worker.worker_surname as 'surname',
                        worker.worker_patronymic as 'patronymic',
                        worker.email,
                        worker.telephone,
                        position.name as 'position'
                FROM worker INNER JOIN position 
                ON worker.worker_position = position.id
                ORDER BY worker.worker_surname`, (err, workerList) => {
      if (err) {throw err;}
      res.render('personnel', {
        userName: req.session.userName,
        successAuthentication: req.session.successAuthentication,
        isWorker: req.session.isWorker,
        workerList
      });
    });
  } else {
    res.redirect(302, '/');
  }
});

router.get('/productCategory', async (req, res) => {
  if (req.session.isWorker === true && 
    req.session.successAuthentication === true) {
    conn.query(`SELECT id, name 
                FROM product_category`, async (err, categories) => {
      if(err) {
        console.log(err);
        fs.writeFileSync('api-reports-error-log.txt', 
          `${fs.readFileSync('api-reports-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
        res.send({err: err}).status(500);
      } else {
        let categoriesData = [];
        for (let i = 0; i < categories.length; i++) {
          let productCountInCategory = await fillingDataInCategory(categories[i]);
          categoriesData.push({id: categories[i].id, name: categories[i].name, productCountInCategory});
        }

        res.render('productCategory', {
          userName: req.session.userName,
          successAuthentication: req.session.successAuthentication,
          isWorker: req.session.isWorker,
          categoriesData
        });
      }
    });
  } else {
    res.redirect(302, '/');
  }
});

// Продажи за период
router.post('/salesByRange', (req, res) => {
  if (req.session.isWorker === true && 
      req.session.successAuthentication === true )  {
    let dateRange = '';

    if (req.body.startDate.match(/^[0-9]{4}.[0-9]{2}.[0-9]{2}$/) &&
        req.body.endDate.match(/^[0-9]{4}.[0-9]{2}.[0-9]{2}$/)) {
      dateRange = (`WHERE orders.date >= str_to_date('${req.body.startDate} 00:00', '%Y-%m-%d %H:%i')
                    AND orders.date <= str_to_date('${req.body.endDate} 23:59', '%Y-%m-%d %H:%i')`).replace(/\n/g, '')
                                                                                                   .replace(/\)\s{1,}AND/g, ') AND');
    } else if(req.body.startDate.match(/^[0-9]{4}.[0-9]{2}.[0-9]{2}$/) &&
              !req.body.endDate.match(/^[0-9]{4}.[0-9]{2}.[0-9]{2}$/)) {
      dateRange = `WHERE orders.date >= str_to_date('${req.body.startDate} 00:00', '%Y-%m-%d %H:%i')`;
    } else if(!req.body.startDate.match(/^[0-9]{4}.[0-9]{2}.[0-9]{2}$/) &&
              req.body.endDate.match(/^[0-9]{4}.[0-9]{2}.[0-9]{2}$/)) {
      dateRange = `WHERE orders.date <= str_to_date('${req.body.endDate} 23:59', '%Y-%m-%d %H:%i')`;
    }

    conn.query(`SELECT  products.product_name as 'product',
                        products.product_amount as 'amount',
                        product_category.name as 'category',
                        order_product.count as 'count',
                        users.user_name as 'first_name',
                        users.user_surname as 'surname',
                        orders.date
                FROM users INNER JOIN orders
                ON users.user_id = orders.user_id INNER JOIN order_product
                ON orders.id = order_product.order_id INNER JOIN products
                ON order_product.product_id = products.product_id INNER JOIN product_category
                ON products.product_category_id = product_category.id 
                ${dateRange}
                ORDER BY date;`, (err, sales) => {
      if(err) {
        console.log(err);
        fs.writeFileSync('api-reports-error-log.txt', 
          `${fs.readFileSync('api-reports-error-log.txt')}\n${req.url}: ${err} ${new Date().toLocaleDateString()}`);
        res.send({err: err}).status(500);
      } else {
        res.send(sales);
      }
    });
  } else {
    res.redirect(301, '/');
  }
});

/** Заполнение данных о кол-ве товаров в категории */
function fillingDataInCategory(category) {
  let promise = new Promise((res, rej) => {
    conn.query(`SELECT product_id
                FROM products
                WHERE product_category_id = ${category.id}`, (err, productInCategory) => {
      if(err) {
        throw(err);
      } else {
        res(productInCategory);
      }
    });
  })

  return promise.then(res => {return res.length});
}

module.exports = router;