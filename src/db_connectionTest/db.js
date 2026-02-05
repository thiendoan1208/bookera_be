const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',      
  user: 'bookera',           
  password: 'lab123',
  database: 'bookera_database'  
});

// Test kết nối
connection.connect((err) => {
  if (err) {
    console.error('Error connecting: ', err.message);
    return;
  }
  console.log('Connected to MySQL database!');
});

module.exports = connection;



