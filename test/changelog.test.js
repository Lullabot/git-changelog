#!/usr/bin/env node
"use strict";

const assert = require('assert');
const ChangeLog = require('../lib/changelog');
const config = require('./test-config');

describe('Getters and Setters', () => {
    it('should return empty strings if not set', () => {
        delete config.repo;
        const changelog = new ChangeLog(config, {}, {});
        assert.strictEqual(changelog.getOption('repo'), '');
    });
    it('should return empty strings if value is null', () => {
        config.repo = null;
        const changelog = new ChangeLog(config, {}, {});
        assert.strictEqual(changelog.getOption('repo'), '');
    });
    it('should return empty strings if value is empty', () => {
        config.repo = '';
        const changelog = new ChangeLog(config, {}, {});
        assert.strictEqual(changelog.getOption('repo'), '');
    });
    it('should return option value over config value', () => {
        config.repo = 'config value';
        const changelog = new ChangeLog(config, {repo: 'option value'}, {});
        assert.strictEqual(changelog.getOption('repo'), 'option value');
    });
    it('should return config value if there is no option value', () => {
        config.repo = 'config value';
        const changelog = new ChangeLog(config, {repo: ''}, {});
        assert.strictEqual(changelog.getOption('repo'), 'config value');
    });
});

describe('Jira Commit Credits', () => {
    it('should extract one matching pattern from the beginning of the string', () => {
        const changelog = new ChangeLog(config, {jiraProjectKey: 'abc'}, {});
        assert.strictEqual(changelog.findJiraReferences('abc-123: Test commit from abc-456 message.'), 'ABC-123');
    });
    it('should ignore patterns in the middle of the string', () => {
        const changelog = new ChangeLog(config, {jiraProjectKey: 'abc'}, {});
        assert.strictEqual(changelog.findJiraReferences('This is related to abc-123: Test commit message.'), null);
    });
    it('should ignore patterns from other projects', () => {
        const changelog = new ChangeLog(config, {jiraProjectKey: 'abc'}, {});
        assert.strictEqual(changelog.findJiraReferences('def-123: Test commit message.'), null);
    });
    it('should be case insensitive', () => {
        const changelog = new ChangeLog(config, {jiraProjectKey: 'ABC'}, {});
        assert.strictEqual(changelog.findJiraReferences('abc-123: Test commit message.'), 'ABC-123');
    });
    it('should allow 0s', () => {
        const changelog = new ChangeLog(config, {jiraProjectKey: 'ABC'}, {});
        assert.strictEqual(changelog.findJiraReferences('abc-103: Test commit message.'), 'ABC-103');
    });
    it('should ignore dummy credits', () => {
        const changelog = new ChangeLog(config, {jiraProjectKey: 'ABC'}, {});
        assert.strictEqual(changelog.findJiraReferences('abc-000: I have no ticket!.'), null);
    });
    it('should be sorted numerically', () => {
        const tickets = ['ABC-1034', 'ABC-12', 'ABC-4', 'ABC-423'];
        assert.deepStrictEqual(ChangeLog.sortJiraTickets(tickets), ['ABC-4', 'ABC-12', 'ABC-423', 'ABC-1034']);
    });
});

describe('Task Manager', () => {
    it('should update the task class property when set', () => {
        const tasks = require('../lib/tasks-app');
        const MockReport = require('./mocks/MockReport');
        const changelog = new ChangeLog(config, {}, tasks);

        changelog.setTaskReportClass('compareToVersion', MockReport);
        const task = changelog.getTask('compareToVersion');
        assert.strictEqual(task.hasOwnProperty('reportClass'), true, 'Task is missing reportClass property.');
        assert.strictEqual(task.reportClass, MockReport);
    });
});

// describe('Jira Issue Extractor', () => {
//     it('should die nicely if the GitHub request fails', () => {
//         const changelog = new ChangeLog(config, {jiraProjectKey: 'ABC'}, {});
//         changelog.getGitHubRepo = () => {
//             throw new Error('Method failed!');
//         }
//
//         const tickets = changelog.gitJiraCreditsFromCommitMessages();
//         assert.strictEqual(tickets, []);
//     });
// });
