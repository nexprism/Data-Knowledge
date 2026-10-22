import SecurityService from '../service/SecurityService.js';
import { getClientIP } from '../utils/helper.js';

class SecurityController {
    async recordIncident(req, res) {
        try {
            const result = await SecurityService.recordIncident(
                req.user.id,
                req.body,
                req.headers['user-agent'],
                getClientIP(req)
            );
            res.json(result);
        } catch (error) {
            console.error('Error recording security incident:', error);
            res.status(500).json({ error: 'Failed to record security incident' });
        }
    }

    async getIncidents(req, res) {
        try {
            const { page = 1, limit = 20, ...filter } = req.query;
            const result = await SecurityService.getIncidents(filter, parseInt(page), parseInt(limit));
            res.json(result);
        } catch (error) {
            console.error('Error getting security incidents:', error);
            res.status(500).json({ error: 'Failed to get security incidents' });
        }
    }
}

export default new SecurityController();
