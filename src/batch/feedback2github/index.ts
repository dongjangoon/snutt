/**
 * Deprecated since 2.2.0
 */

require('module-alias/register');
require('@app/core/config/mongo');
require('@app/batch/config/log');

import LambdaJobBuilder from '@app/batch/common/LambdaJobBuilder';

import FeedbackService = require('@app/core/feedback/FeedbackService');
import Feedback from '@app/core/feedback/model/Feedback';
import winston = require('winston');
import GithubIssue from '@app/core/github/model/GithubIssue';
import property = require('@app/core/config/property');
import GithubService = require('@app/core/github/GithubService');

let repoOwner = property.get('core.feedback2github.repo.owner');
let repoName = property.get('core.feedback2github.repo.name');

var logger = winston.loggers.get('default');

interface StepItem {
    issue: GithubIssue,
    feedbackId: string
}

async function reader(): Promise<Feedback[]> {
    let userName = await GithubService.getUserName();
    logger.info("Logged-in as " + userName);
    logger.info("Dumping feedbacks into " + repoOwner + "/" + repoName);

    let feedbacks = await FeedbackService.get(100, 0);

    logger.info("Fetched " + feedbacks.length + " documents");
    return feedbacks;
}

async function processor(feedback: Feedback): Promise<StepItem> {
    let title;
    if (!feedback.message) {
        logger.warn("No message field in feedback document");
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

    return {
        issue: issue,
        feedbackId: feedback._id
    }
}

async function writer(item: StepItem): Promise<void> {
    await GithubService.addIssue(repoOwner, repoName, item.issue);
    await FeedbackService.remove(item.feedbackId);
}

async function main() {
    let job = new LambdaJobBuilder("feedback2github").reader(reader)
            .processor(processor)
            .writer(writer);
    await job.run();
    setTimeout(() => process.exit(0), 1000);
}
  
if (!module.parent) {
    main();
}
