/**
 * DB 상의 피드백을 깃헙 이슈로 전송합니다.
 * $ npm run feedback2github
 * 
 * @author Jang Ryeol, ryeolj5911@gmail.com
 */

require('module-alias/register');
require('@app/core/config/mongo');
require('@app/batch/config/log');

import LambdaJobBuilder from '@app/batch/common/LambdaJobBuilder';

import FeedbackService = require('@app/core/feedback/FeedbackService');
import Feedback from '@app/core/feedback/model/Feedback';
import * as log4js from 'log4js';
import Issue from './model/Issue';
import property = require('@app/core/config/property');
import GithubService = require('./GithubService');

let repoOwner = property.feedback2github_repo_owner;
let repoName = property.feedback2github_repo_name;

var logger = log4js.getLogger();

interface StepItem {
    issue: Issue,
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

    let issue: Issue = {
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
    try {
        let job = LambdaJobBuilder.reader(reader)
                .processor(processor)
                .writer(writer);
        await job.run();
        logger.info("Successfully inserted");
    } catch (err) {
        logger.error(err);
    }
    // Wait for log4js to flush its logs
    setTimeout(function() {
        process.exit(0);
    }, 100);
  }
  
if (!module.parent) {
    main();
}
