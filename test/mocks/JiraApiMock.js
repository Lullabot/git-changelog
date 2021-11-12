#!/usr/local/bin/node
"use strict";

const jiraIssue = require('./jiraIssue.json');
const utils = require('../testUtilities');

class JiraApiMock {
    protocol = 'https:';
    host = 'api.example.com';

    async findIssue(issueNum) {
        await utils.wait(1);

        if (issueNum === 'HC-123') {
            return jiraIssue;
        } else {
            throw new Error(`Unable to load Jira issue ${issueNum}.`);
        }
    }
}

module.exports = JiraApiMock;