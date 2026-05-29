import { Router } from 'express';
import { trafficController } from '../controllers/traffic.controller.js';
import validateSchema from '../middlewares/validateSchema.js';
import {
  compareQuerySchema,
  createTrafficSchema,
  deepDiveQuerySchema,
  distributionQuerySchema,
  listTrafficSchema,
  stackedQuerySchema,
  topCountriesQuerySchema,
  trendQuerySchema,
  updateTrafficSchema,
} from '../schemas/traffic.schema.js';

const router = Router();

router.get('/filters', trafficController.filters);
router.get('/trend', validateSchema(trendQuerySchema), trafficController.trend);
router.get('/top-countries', validateSchema(topCountriesQuerySchema), trafficController.topCountries);
router.get('/distribution', validateSchema(distributionQuerySchema), trafficController.distribution);
router.get('/hierarchy-distribution', validateSchema(distributionQuerySchema), trafficController.hierarchyDistribution);
router.get('/deep-dive', validateSchema(deepDiveQuerySchema), trafficController.deepDive);
router.get('/stacked', validateSchema(stackedQuerySchema), trafficController.stacked);
router.get('/hierarchy-yearly', validateSchema(stackedQuerySchema), trafficController.hierarchyYearly);
router.get('/compare', validateSchema(compareQuerySchema), trafficController.compare);
router.get('/cumulative', validateSchema(stackedQuerySchema), trafficController.cumulative);
router.get('/', validateSchema(listTrafficSchema), trafficController.list);
router.post('/', validateSchema(createTrafficSchema), trafficController.create);
router.put('/:id', validateSchema(updateTrafficSchema), trafficController.update);
router.delete('/:id', trafficController.remove);

export default router;
