const http = require('http');
const url = require('url');
const mysql = require('mysql2');

// Конфигурация базы данных
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ChatBotTests'
};

// Подключение к MySQL
const connection = mysql.createConnection(dbConfig);

connection.connect(err => {
  if (err) {
    console.error('Ошибка подключения к MySQL:', err);
    process.exit(1);
  }
  console.log('Успешно подключено к MySQL');
});

// Функция для чтения тела запроса
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// Обработчики маршрутов
async function getAllItems(req, res) {
  connection.query('SELECT * FROM Items', (err, results) => {
    if (err) {
      console.error('Ошибка MySQL:', err);
      sendResponse(res, 500, { error: 'Ошибка сервера' });
      return;
    }
    sendResponse(res, 200, results);
  });
}

async function addItem(req, res) {
  try {
    const body = await readBody(req);
    const { name, desc } = JSON.parse(body);
    
    if (!name || !desc) {
      sendResponse(res, 400, { error: 'Необходимы параметры name и desc' });
      return;
    }
    
    connection.query(
      'INSERT INTO Items (name, `desc`) VALUES (?, ?)',
      [name, desc],
      (err, results) => {
        if (err) {
          console.error('Ошибка MySQL:', err);
          sendResponse(res, 500, { error: 'Ошибка сервера' });
          return;
        }
        sendResponse(res, 201, {
          id: results.insertId,
          name,
          desc
        });
      }
    );
  } catch (err) {
    sendResponse(res, 400, { error: 'Неверный формат данных' });
  }
}

async function deleteItem(req, res) {
  try {
    const body = await readBody(req);
    const { id } = JSON.parse(body);
    
    if (!id || isNaN(id)) {
      sendResponse(res, 400, { error: 'Необходим корректный параметр id' });
      return;
    }
    
    connection.query(
      'DELETE FROM Items WHERE id = ?',
      [id],
      (err, results) => {
        if (err) {
          console.error('Ошибка MySQL:', err);
          sendResponse(res, 500, { error: 'Ошибка сервера' });
          return;
        }
        sendResponse(res, 200, {
          success: results.affectedRows > 0
        });
      }
    );
  } catch (err) {
    sendResponse(res, 400, { error: 'Неверный формат данных' });
  }
}

async function updateItem(req, res) {
  try {
    const body = await readBody(req);
    const { id, name, desc } = JSON.parse(body);
    
    if (!id || isNaN(id) || !name || !desc) {
      sendResponse(res, 400, { error: 'Необходимы параметры id, name и desc' });
      return;
    }
    
    connection.query(
      'UPDATE Items SET name = ?, `desc` = ? WHERE id = ?',
      [name, desc, id],
      (err, results) => {
        if (err) {
          console.error('Ошибка MySQL:', err);
          sendResponse(res, 500, { error: 'Ошибка сервера' });
          return;
        }
        
        if (results.affectedRows === 0) {
          sendResponse(res, 404, { error: 'Запись не найдена' });
          return;
        }
        
        connection.query(
          'SELECT * FROM Items WHERE id = ?',
          [id],
          (err, updatedItem) => {
            if (err) {
              console.error('Ошибка MySQL:', err);
              sendResponse(res, 500, { error: 'Ошибка сервера' });
              return;
            }
            sendResponse(res, 200, updatedItem[0] || {});
          }
        );
      }
    );
  } catch (err) {
    sendResponse(res, 400, { error: 'Неверный формат данных' });
  }
}

function sendResponse(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;

  // Настройка CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обработка предварительного OPTIONS запроса
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Маршрутизация
  try {
    if (pathname === '/getAllItems' && req.method === 'GET') {
      await getAllItems(req, res);
    } 
    else if (pathname === '/addItem' && req.method === 'POST') {
      await addItem(req, res);
    } 
    else if (pathname === '/deleteItem' && req.method === 'POST') {
      await deleteItem(req, res);
    } 
    else if (pathname === '/updateItem' && req.method === 'POST') {
      await updateItem(req, res);
    }
    else {
      sendResponse(res, 404, { error: 'Маршрут не найден' });
    }
  } catch (err) {
    console.error('Ошибка обработки запроса:', err);
    sendResponse(res, 500, { error: 'Внутренняя ошибка сервера' });
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

process.on('SIGINT', () => {
  connection.end();
  process.exit();
});