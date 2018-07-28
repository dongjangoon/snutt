import FeedbackRepository = require('./FeedbackRepository');
import Feedback from './model/Feedback';

export function add(email: string, message: string, platform: string): Promise<void> {
  return FeedbackRepository.insert({
    email: email,
    message: message,
    platform: platform,
    timestamp: Date.now()
  })
}

export function get(offset: number, limit: number): Promise<Feedback[]> {
  return FeedbackRepository.findByPaging(offset, limit);
}

export function remove(id: string): Promise<void> {
  return FeedbackRepository.deleteOne(id);
}

export function removeAll(ids: string[]): Promise<void> {
  return FeedbackRepository.deleteAllByMongoIds(ids);
}
