const http = require('http');
const url = require('url');
const mysql = require('mysql2');

// Настройка подключения к MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ChatBotTests'
});

connection.connect(err => {
  if (err) {
    console.error('Ошибка подключения к MySQL:', err);
    return;
  }
  console.log('Успешное подключение к MySQL');
});

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Устанавливаем CORS-заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Логируем входящий запрос
  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

  // Обработка OPTIONS-запросов для CORS
  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }

  // Маршрут /getAllItems (GET)
  if (pathname === '/getAllItems' && req.method === 'GET') {
    connection.query('SELECT * FROM Items', (err, results) => {
      if (err) {
        console.error('MySQL Error:', err);
        res.end(JSON.stringify(null));
        return;
      }
      res.end(JSON.stringify(results));
    });

  // Маршрут /addItem (POST)
  } else if (pathname === '/addItem' && req.method === 'POST') {
    if (!query.name || !query.desc) {
      res.end(JSON.stringify(null));
      return;
    }
    connection.query(
      'INSERT INTO Items (name, `desc`) VALUES (?, ?)',
      [query.name, query.desc],
      (err, results) => {
        if (err) {
          console.error('MySQL Error:', err);
          res.end(JSON.stringify(null));
          return;
        }
        res.end(JSON.stringify({
          id: results.insertId,
          name: query.name,
          desc: query.desc
        }));
      }
    );

  // Маршрут /deleteItem (POST)
  } else if (pathname === '/deleteItem' && req.method === 'POST') {
    if (!query.id || isNaN(query.id)) {
      res.end(JSON.stringify(null));
      return;
    }
    connection.query(
      'DELETE FROM Items WHERE id = ?',
      [query.id],
      (err, results) => {
        if (err) {
          console.error('MySQL Error:', err);
          res.end(JSON.stringify(null));
          return;
        }
        if (results.affectedRows === 0) {
          res.end(JSON.stringify({}));
        } else {
          res.end(JSON.stringify({ success: true }));
        }
      }
    );

  // Маршрут /updateItem (POST)
  } else if (pathname === '/updateItem' && req.method === 'POST') {
    if (!query.id || isNaN(query.id) || !query.name || !query.desc) {
      res.end(JSON.stringify(null));
      return;
    }
    connection.query(
      'UPDATE Items SET name = ?, `desc` = ? WHERE id = ?',
      [query.name, query.desc, query.id],
      (err, results) => {
        if (err) {
          console.error('MySQL Error:', err);
          res.end(JSON.stringify(null));
          return;
        }
        if (results.affectedRows === 0) {
          res.end(JSON.stringify({}));
        } else {
          connection.query(
            'SELECT * FROM Items WHERE id = ?',
            [query.id],
            (err, updatedItem) => {
              if (err) {
                console.error('MySQL Error:', err);
                res.end(JSON.stringify(null));
                return;
              }
              res.end(JSON.stringify(updatedItem[0] || {}));
            }
          );
        }
      }
    );

  // Неизвестный маршрут
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

// Обработка закрытия сервера
process.on('SIGINT', () => {
  console.log('\nЗавершение работы сервера');
  connection.end();
  process.exit();
});