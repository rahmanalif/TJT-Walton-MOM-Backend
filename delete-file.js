const fs = require('fs');

fs.unlink('c:\\Users\\rahma\\Desktop\\MOM App\\TJT-Walton-MOM-Backend\\test-weather-api.js', (err) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log('File deleted successfully');
});

