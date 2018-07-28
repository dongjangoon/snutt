import AdminRepository = require('./AdminRepository');
import AdminStatistics from './model/AdminStatistics';

export function getStatistics(): Promise<AdminStatistics> {
    return AdminRepository.findStatistics();
}
