const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  res.setHeader('Content-Type', 'application/json');
  
  if (parsedUrl.pathname === '/static') {
    res.end(JSON.stringify({
      header: "Hello",
      body: "Octagon NodeJS Test"
    }));
    
  } else if (parsedUrl.pathname === '/dynamic') {
    const { a, b, c } = parsedUrl.query;
    
    if (!a || !b || !c || isNaN(a) || isNaN(b) || isNaN(c)) {
      res.end(JSON.stringify({
        header: "Error"
      }));
      return;
    }
    
    const result = (parseFloat(a) * parseFloat(b) * parseFloat(c)) / 3;
    
    res.end(JSON.stringify({
      header: "Calculated",
      body: result.toString()
    }));
    
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({
      error: "Not Found"
    }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});