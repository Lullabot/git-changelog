#!/usr/bin/env node
"use strict";

const assert = require('assert');
const ChangeLog = require('../lib/changelog');
const config = require('./test-config');
const liveConfig = require('../config');
const JiraApiMock = require('./mocks/JiraApiMock');

const changelog = new ChangeLog(config, {debug: true}, {});
changelog.jiraApi = new JiraApiMock();

describe('Jira tickets', () => {
    it('should contain acceptance criteria', async () => {
        const issue = await changelog.getJiraIssue('HC-123');
        assert.strictEqual(issue.ac, "This is the detailed acceptance criteria.");
    });

    it('should contain a full URL to the issue', async () => {
        const issue = await changelog.getJiraIssue('HC-123');
        assert.strictEqual(issue.url, "https://api.example.com/browse/HC-123");
    });

    it('should die nicely if not found', async () => {
        const issues = await changelog.getJiraIssues(['HC-123', 'HC-234', 'HC-123']);
        assert.strictEqual(issues.length, 2);
    });
});