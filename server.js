const express = require('express');
const mysql = require('mysql2');
const app = express();

// Конфигурация базы данных и подключение
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ChatBotTests'
};

const connection = mysql.createConnection(dbConfig);

// Middleware для обработки JSON
app.use(express.json());

// Настройка CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Обработчики маршрутов
app.get('/getAllItems', async (req, res) => {
  try {
    const [results] = await connection.promise().query('SELECT * FROM Items');
    res.status(200).json(results);
  } catch (err) {
    console.error('Ошибка MySQL:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/addItem', async (req, res) => {
  try {
    const { name, desc } = req.body;
    
    if (!name || !desc) {
      return res.status(400).json({ error: 'Необходимы параметры name и desc' });
    }
    
    const [result] = await connection.promise().query(
      'INSERT INTO Items (name, `desc`) VALUES (?, ?)',
      [name, desc]
    );
    
    res.status(201).json({
      id: result.insertId,
      name,
      desc
    });
  } catch (err) {
    res.status(400).json({ error: 'Неверный формат данных' });
  }
});

app.post('/deleteItem', async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Необходим корректный параметр id' });
    }
    
    const [result] = await connection.promise().query(
      'DELETE FROM Items WHERE id = ?',
      [id]
    );
    
    res.status(200).json({
      success: result.affectedRows > 0
    });
  } catch (err) {
    res.status(400).json({ error: 'Неверный формат данных' });
  }
});

app.post('/updateItem', async (req, res) => {
  try {
    const { id, name, desc } = req.body;
    
    if (!id || isNaN(id) || !name || !desc) {
      return res.status(400).json({ error: 'Необходимы параметры id, name и desc' });
    }
    
    const [result] = await connection.promise().query(
      'UPDATE Items SET name = ?, `desc` = ? WHERE id = ?',
      [name, desc, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    
    const [[updatedItem]] = await connection.promise().query(
      'SELECT * FROM Items WHERE id = ?',
      [id]
    );
    
    res.status(200).json(updatedItem || {});
  } catch (err) {
    res.status(400).json({ error: 'Неверный формат данных' });
  }
});

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

// Обработка завершения работы
process.on('SIGINT', () => {
  connection.end();
  process.exit();
});