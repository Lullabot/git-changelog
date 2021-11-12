#!/usr/local/bin/node
"use strict";

const config = {
    githubApi: 'https://api.github.com',
    githubToken: 'notarealtoken',
    jiraApi: 'https://jsw.atlassian.com',
    jiraToken: 'notarealapikey', // API Key
    jiraUsername: 'fakey@mcfakerson.com',
    jiraProjectKey: 'abc',
    jiraFields: [
        {
            fieldName: 'components',
            key: 'components'
        },
        {
            fieldName: 'customfield_10200',
            key: 'ac'
        }
    ]
};

module.exports = config;