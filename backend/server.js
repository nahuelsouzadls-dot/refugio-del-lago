const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const { init } = require('./campingService/models');
const routes = require('./campingService/routes/indexRouter');

routes(app);

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Refugio del Lago API' });
});

init().then(() => {
  app.listen(port, () => {
    console.log(`API corriendo en http://localhost:${port}`);
  });
});
