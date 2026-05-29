import { Router } from 'express';
import trafficRouter from './traffic.js';

const router = Router();

router.use('/traffic', trafficRouter);

export default router;
