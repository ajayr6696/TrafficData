import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes/index.js';
import { config } from './constants/config.js';
import apiErrorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.frontendOrigins,
  credentials: false,
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'traffic-data-backend',
  });
});

app.use('/api', routes);
app.use(notFound);
app.use(apiErrorHandler);

export default app;
