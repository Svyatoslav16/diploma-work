const mysql = require('mysql2'),
      session = require('express-session'),
      MySQLStore = require('express-mysql-session')(session);

// Настройки подлючения к БД MySQL
const conn = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'internet_magazine',
    password: 'Plmoknn1605',
    port: '3306'
});

// Настройки для сессии в mysql
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

const userSession = session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(sessionOptions),
    cookie: {
        path: "/",
        httpOnly: true,
        maxAge: null
    },
});

module.exports = {userSession, conn};