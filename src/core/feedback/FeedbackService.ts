import FeedbackRepository = require('./FeedbackRepository');
import Feedback from './model/Feedback';
import GithubIssue from '@app/core/github/model/GithubIssue';
import GithubService = require('@app/core/github/GithubService');
import property = require('@app/core/config/property');

let repoOwner = property.get('core.feedback2github.repo.owner');
let repoName = property.get('core.feedback2github.repo.name');

export async function add(email: string, message: string, platform: string): Promise<void> {
  let feedback: Feedback = {
    email: email,
    message: message,
    platform: platform,
    timestamp: Date.now()
  }
  let issue: GithubIssue = feedbackToGithubIssue(feedback);
  await GithubService.addIssue(repoOwner, repoName, issue);
}

function feedbackToGithubIssue(feedback: Feedback): GithubIssue {
  let title;
  if (!feedback.message) {
    title = "(Empty Message)";
  } else {
    title = feedback.message;
  }

  let body = "Issue created automatically by feedback2github\n";
  if (feedback.timestamp) {
    body += "Timestamp: " + new Date(feedback.timestamp).toISOString() + " (UTC)\n";
  }
  if (feedback.email) {
    body += "Email: " + feedback.email + "\n";
  }
  if (feedback.platform) {
    body += "Platform: " + feedback.platform + "\n";
  }
  body += "\n";
  body += feedback.message;

  let labels;
  if (feedback.platform) {
    labels = [feedback.platform];
  }

  let issue: GithubIssue = {
    title: title,
    body: body,
    labels: labels
  }

  return issue;
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
