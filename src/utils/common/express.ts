import express, { Express } from 'express';
import logger from './logger';
import 'dotenv/config';
const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT;
// Start the server
app.listen(PORT, () => {
  logger.info(`WhatsApp bot server is running on port ${PORT}`);
  logger.info(`Webhook URL: http://localhost:${PORT}/webhook`);
});

// Export the app instance
export default app;
