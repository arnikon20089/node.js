const http = require('http');

const server = http.createServer((request, response) => {
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  if (request.url === '/') {
    response.write('<h1>Привет, Октагон!</h1>');
  } else {
    response.statusCode = 404;
    response.write('<h1>Страница не найдена</h1>');
  }

  response.end();
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});