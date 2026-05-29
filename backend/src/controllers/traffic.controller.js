import { errorHandler } from '../util/handlers.js';
import {
  toCompareFilters,
  toTopCountriesQuery,
  toTrafficFilters,
  toTrafficPatchPayload,
  toTrafficPayload,
} from '../dto/traffic.dto.js';
import { trafficService } from '../services/traffic.service.js';

const parseId = (id) => Number(id);

export const trafficController = {
  filters: errorHandler(async (req, res) => {
    const data = await trafficService.getFilters();
    res.json({ data });
  }),

  list: errorHandler(async (req, res) => {
    const data = await trafficService.listTraffic(toTrafficFilters(req.query));
    res.json({ data });
  }),

  create: errorHandler(async (req, res) => {
    const data = await trafficService.createTraffic(toTrafficPayload(req.body));
    res.status(201).json({ data });
  }),

  update: errorHandler(async (req, res) => {
    const data = await trafficService.updateTraffic(parseId(req.params.id), toTrafficPatchPayload(req.body));
    res.json({ data });
  }),

  remove: errorHandler(async (req, res) => {
    await trafficService.deleteTraffic(parseId(req.params.id));
    res.status(204).send();
  }),

  trend: errorHandler(async (req, res) => {
    const data = await trafficService.getTotalTrend(toTrafficFilters(req.query));
    res.json({ data });
  }),

  topCountries: errorHandler(async (req, res) => {
    const data = await trafficService.getTopCountries(toTopCountriesQuery(req.query));
    res.json({ data });
  }),

  distribution: errorHandler(async (req, res) => {
    const data = await trafficService.getVehicleDistribution(toTrafficFilters(req.query));
    res.json({ data });
  }),

  hierarchyDistribution: errorHandler(async (req, res) => {
    const data = await trafficService.getHierarchyDistribution(toTrafficFilters(req.query));
    res.json({ data });
  }),

  deepDive: errorHandler(async (req, res) => {
    const data = await trafficService.getVehicleDeepDive(toTrafficFilters(req.query));
    res.json({ data });
  }),

  stacked: errorHandler(async (req, res) => {
    const data = await trafficService.getStackedTraffic(toTrafficFilters(req.query));
    res.json({ data });
  }),

  hierarchyYearly: errorHandler(async (req, res) => {
    const data = await trafficService.getHierarchyYearly(toTrafficFilters(req.query));
    res.json({ data });
  }),

  compare: errorHandler(async (req, res) => {
    const data = await trafficService.getCountryComparison(toCompareFilters(req.query));
    res.json({ data });
  }),

  cumulative: errorHandler(async (req, res) => {
    const data = await trafficService.getCumulativeComposition(toTrafficFilters(req.query));
    res.json({ data });
  }),
};
