require('dotenv').config();
const createApp = require('./src/app');

const port = process.env.PORT || 3001;

async function startServer() {
  const app = await createApp();

  app.listen(port, function () {
    console.log(`App listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
