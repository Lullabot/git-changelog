#!/usr/bin/env node
"use strict";

const tasks = {
    /**
     * Preview the report.
     */
    preview: {
        label: "Preview the Report",
        chain: true,
        questions: [
            {
                name: 'releaseName',
                type: 'input',
                message: 'Release Name:',
            },
            {
                name: 'groupByField',
                type: 'input',
                message: 'Group By Field (machine_name):',
            }
        ],

        /**
         * Run the task.
         *
         * @param {Changelog} changelog
         * @returns {Promise<void>}
         */
        process: async (changelog) => {
            const commitCredits = await changelog.getJiraCreditsFromCommitMessages();
            const jiraIssues = await changelog.getJiraIssues(commitCredits);
            const report = changelog.newReport("Release Report for " + changelog.getReleaseName(), jiraIssues);

            report.groupByField(changelog.getGroupingField()).buildFullReport().render();
        }
    },

    /**
     * Compare commit credits to jira fix version.
     */
    compareToVersion: {
        label: "Compare to Fix Version",
        chain: true,
        process: async (changelog) => {
            const report = changelog.newReport('Fix Version Comparison', []);

            // Get the issues from the user specified Jira version.
            const versions = await changelog.getActiveVersions();
            const version = await changelog.askChoice('Which Fix Version?', versions);
            const versionIssues = await changelog.getFixVersionIssues(version);
            const versionIssueKeys = versionIssues.map(issue => issue.issueNumber);

            // Get the issues from the referenced git commits.
            const commitCredits = await changelog.getJiraCreditsFromCommitMessages();
            const gitIssues = await changelog.getJiraIssues(commitCredits);
            const gitIssueKeys = gitIssues.map(issue => issue.issueNumber);

            // List issues in the release that don't have commits in github.
            let missingFromCommits = versionIssueKeys.filter(x => !gitIssueKeys.includes(x));
            report.addLine(`\nThere are ${missingFromCommits.length} issues listed in '${version}' without commit credits:`);
            missingFromCommits.forEach(issueKey => {
                let thisIssue = versionIssues.find(issue => (issue.issueNumber === issueKey));
                report.addIssue(thisIssue);
            });

            // List issues found in commit credits that are not in the fix version.
            let missingFromVersion = gitIssueKeys.filter(x => !versionIssueKeys.includes(x));
            report.addLine('');
            report.addLine(`There are ${missingFromVersion.length} issues with commit credits in '${changelog.getGitHeadName()}' that are not listed in '${version}':`);
            missingFromVersion.forEach(issueKey => {
                let thisIssue = gitIssues.find(issue => (issue.issueNumber === issueKey));
                report.addIssue(thisIssue);
            });

            report.render();
        }
    },

    /**
     * Create the GitHub release for this report.
     */
    release: {
        label: "Create a GitHub Release",
        chain: true,
        questions: [
            {
                name: 'releaseName',
                type: 'input',
                message: 'Release Name:',
            },
            {
                name: 'releaseTag',
                type: 'input',
                message: 'Tag Name:',
            },
            {
                name: 'groupByField',
                type: 'input',
                message: 'Group By Field (machine_name):',
            }
        ],
        process: async (changelog) => {
            const commitCredits = await changelog.getJiraCreditsFromCommitMessages();
            const jiraIssues = await changelog.getJiraIssues(commitCredits);
            const report = changelog.newReport(changelog.getReleaseName(), jiraIssues);
            const output = report.groupByField(changelog.getGroupingField()).buildFullReport().getOutput();

            const releaseConfig = {
                'body': output,
                'draft': false,
                'name': changelog.getReleaseName(),
                'prerelease': true,
                'tag_name': changelog.getReleaseTag(),
                'target_commitish': changelog.getGitHeadName(),
            };

            await changelog.createGitHubRelease(releaseConfig);
        }
    },
};

module.exports = tasks;
