#!/usr/local/bin/node
"use strict";

const inquirer = require('inquirer');
const GitHubApi = require('github-api');
const JiraApi = require('jira-client');
const NodeCache = require('node-cache');
const Report = require('./report');

/**
 * Defines class Changelog.
 */
class Changelog {
    #config = {};
    #options = {};
    #tasks = {
        app: {},
        user: {},
        system: {}
    };

    /**
     * Cache bucket.
     * @type {NodeCache}
     */
    #cache;

    /**
     * Github API reference.
     * @type {GitHubApi}
     */
    gitHubApi;

    /**
     * Jira API reference.
     * @type {JiraApi}
     */
    jiraApi;

    /**
     * Reporting class to use.
     * @type {Report}
     */
    defaultReportClass;

    /**
     * Defines the report to run for the active task.  Set on each task run.
     * @type {Report}
     */
    taskReportClass;

    /**
     * Constructor.
     *
     * @param {object} config
     * @param {object} options
     * @param {object} userTasks
     */
    constructor(config, options, userTasks) {
        this.#cache = new NodeCache();
        this.#config = config;
        this.#options = options;
        this.#tasks.user = userTasks;

        // Set the default reporting class.
        this.defaultReportClass = Report;

        // Load system and app level tasks.
        this.#tasks.system = require('./tasks-system');
        this.#tasks.app = require('./tasks-app');

        // Instantiate GitHub connection.
        if (config?.githubToken && config?.githubApi) {
            this.gitHubApi = new GitHubApi({token: config.githubToken}, config.githubApi);
        } else {
            throw new Error("GitHub auth credentials are missing from config.js.");
        }

        // Instantiate Jira connection.
        if (config?.jiraApi && config?.jiraUsername && config?.jiraToken) {
            this.jiraApi = new JiraApi({
                protocol: new URL(config.jiraApi).protocol || '',
                host: new URL(config.jiraApi).hostname || '',
                username: config.jiraUsername || '',
                password: config.jiraToken || '',
                apiVersion: '2',
                strictSSL: true
            });
        } else {
            throw new Error("Jira auth credentials are missing from config.js.");
        }
    }

    /**
     * Get the value of a program parameter.
     *
     * @param {string} name
     * @returns {string|*}
     */
    getOption(name) {
        // First check in the options to see if it was passed in from the CLI.
        if (this.#options.hasOwnProperty(name) && this.#options[name]) {
            return this.#options[name];
        // Next check the config to see if a default value was provided.
        } else if (this.#config.hasOwnProperty(name) && this.#config[name]) {
            return this.#config[name];
        } else {
            return '';
        }
    }

    /**
     * Run the app.
     */
    run() {
        this.askForMissingOptions().then(answers => {
            // Process and store the answers from the questions.
            this.processAnswers(answers);

            // Run the program.
            this.prompt().catch(err => {
                console.error('😵️ ' + err.message);

                // Display more verbose errors in debug mode.
                if (this.debug()) {
                    console.error(err);
                }
            });
        });
    }

    /**
     * Reciprocal method to run the program.
     */
    async prompt() {
        let questions = [];

        // Get task question.
        questions.push({
            type: 'list',
            name: 'task',
            message: "What would you like to do?",
            choices: this.getTaskList()
        });

        // Collect additional questions from the tasks.
        questions = questions.concat(this.getTaskQuestions());

        // Ask the user which task they want to do.
        console.log("");
        const answers = await inquirer.prompt(questions);

        // Store any answers we collected from the task questions.
        for (let q in answers) {
            if (q !== 'task') {
                this.#options[q] = answers[q];
            }
        }

        // Get the task object to run.
        let task = this.getTask(answers.task);

        // Set the report class for this task.
        this.taskReportClass = task.hasOwnProperty('reportClass') ? task.reportClass : this.defaultReportClass;

        // Run the task.
        task.process(this, answers).then(response => {
            // Run the processor again.
            if (task?.chain) {
                this.prompt();
            } else {
                process.exit(0);
            }
        }).catch(err => {
            throw err;
        });
    }

    /**
     * Ask for missing parameters that the program needs to run.
     *
     * @returns {Promise<*|boolean>}
     */
    async askForMissingOptions() {
        const questions = [];

        // Check for a repo name.
        if (!this.getRepoName()) {
            questions.push({
                type: 'input',
                name: 'repo',
                message: 'Repo:',
                validate(input) {
                    return input !== "";
                }
            });
        }

        // Check for a base branch.
        if (!this.getGitBaseName()) {
            questions.push({
                type: 'input',
                name: 'base',
                message: 'Base Branch/Tag:',
                validate(input) {
                    return input !== "";
                }
            });
        }

        // Check for a head branch.
        if (!this.getGitHeadName()) {
            questions.push({
                type: 'input',
                name: 'head',
                message: 'Head Branch/Tag:',
                validate(input) {
                    return input !== "";
                }
            });
        }

        // Check for a Jira project key.
        if (!this.getJiraProjectKey()) {
            questions.push({
                type: 'input',
                name: 'jiraProjectKey',
                message: 'Jira Project Key:',
                validate(input) {
                    return input !== "";
                }
            });
        }

        return await inquirer.prompt(questions);
    }

    /**
     * Get an array of task names to labels for the inquirer.
     *
     * @returns {*[]}
     */
    getTaskList() {
        const taskList = [];
        const allTasks = this._getFlatTasks();

        // Add an item for each task in the list.
        for (let i in allTasks) {
            taskList.push({name: allTasks[i].label, value: i});
        }

        return taskList;
    }

    /**
     * Collect additional questions to be asked for a given task.
     *
     * @returns {*[]}
     */
    getTaskQuestions() {
        const questions = [];
        const allTasks = this._getFlatTasks();

        // Add an item for each task in the list.
        for (let i in allTasks) {
            if (allTasks[i].hasOwnProperty('questions')) {
                allTasks[i].questions.forEach(question => {
                    // Restrict questions to be followups to the active task only.
                    question.when = (answers) => {
                        return answers.task === i;
                    }

                    // Set the default value to the current value in case it was already set.
                    let defaultVal = this.getOption(question.name);
                    if (defaultVal.length > 0) {
                        question.default = defaultVal;
                    }

                    questions.push(question);
                });
            }
        }

        return questions;
    }

    /**
     * Get a specific task my its name.
     *
     * @param {string} taskName
     * @returns {*}
     */
    getTask(taskName) {
        const allTasks = this._getFlatTasks();
        return allTasks[taskName];
    }

    /**
     * Get a flattened list of tasks for easy lookups.
     *
     * @returns {unknown}
     * @private
     */
    _getFlatTasks() {
        return Object.assign({}, this.#tasks.app, this.#tasks.user, this.#tasks.system);
    }

    /**
     * Define a class to instantiate for report generation.  Should extend Report.
     *
     * @param reportClass
     */
    setReportClass(reportClass) {
        this.defaultReportClass = reportClass;
    }

    /**
     * Override the report class for a set task.
     *
     * @param {string} taskName
     * @param {Report} reportClassName
     */
    setTaskReportClass(taskName, reportClassName) {
        for (let group in this.#tasks) {
            if (this.#tasks[group]?.[taskName]) {
                this.#tasks[group][taskName].reportClass = reportClassName;
            }
        }
    }

    /**
     * Get a new report object.
     *
     * @param title
     * @param issues
     * @returns {Report}
     */
    newReport(title, issues) {
        return new this.taskReportClass(title, issues);
    }

    /**
     * Get the name of the repo to search.
     *
     * @returns {string|*}
     */
    getRepoName() {
        return this.getOption('repo');
    }

    /**
     * Get the name of the base git branch.
     *
     * @returns {string|*}
     */
    getGitBaseName() {
        return this.getOption('base');
    }

    /**
     * Get the name of the git head branch.
     *
     * @returns {string|*}
     */
    getGitHeadName() {
        return this.getOption('head');
    }

    /**
     * Get a GitHub Repo object.
     *
     * @returns {Promise<*>}
     */
    async getGitHubRepo() {
        const repoName = this.getRepoName();

        // Retrieve from cache.
        if (this.#cache.has(repoName)) {
            return this._cacheGet(repoName);
        }

        // Fetch and store the GitHub repo.
        const repoParts = repoName.split('/');
        const repo = await this.gitHubApi.getRepo(repoParts[0], repoParts[1]);

        this._cacheSet(repoName, repo);

        return repo;
    }

    /**
     * Get the Jira project key to search for.
     *
     * @returns {string|*}
     */
    getJiraProjectKey() {
        return this.getOption('jiraProjectKey');
    }

    /**
     * Get the name of the tag to create for the GitHub release.
     * @returns {string|*}
     */
    getReleaseTag() {
        return this.getOption('releaseTag');
    }

    /**
     * Get the name of the release for the GitHub release.
     * @returns {string|*}
     */
    getReleaseName() {
        return this.getOption('releaseName');
    }

    /**
     * Select the field name to group the issues by.
     *
     * @returns {string|*}
     */
    getGroupingField() {
        return this.getOption('groupByField');
    }

    /**
     * Store the missing data from the prompt.
     *
     * @param {object} answers
     */
    processAnswers(answers) {
        for (let name in answers) {
            let value = answers[name];

            if (value) {
                this.#options[name] = value;
            }
        }
    }

    /**
     * Get an array of valid Jira issue keys referenced in git commits between two branches/tags.
     *
     * @returns {Promise<*[]>}
     */
    async getJiraCreditsFromCommitMessages() {
        let tickets = [];

        // Check the cache first.
        const cacheKey = `${this.getGitBaseName()}-${this.getGitHeadName()}`;
        if (this.#cache.has(cacheKey)) {
            tickets = this._cacheGet(cacheKey);
            return Changelog.sortJiraTickets(tickets);
        }

        // Compare the branches and find Jira references.
        const repo = await this.getGitHubRepo();
        const response = await repo.compareBranches(this.getGitBaseName(), this.getGitHeadName());
        response.data.commits.forEach(item => {
            let issue = this.findJiraReferences(item.commit.message);
            if (issue) {
                // Prevent duplication of issues.
                if (!tickets.find(n => n === issue)) {
                    tickets.push(issue);
                }
            }
        });

        // Store the results of any Jira references found.
        this._cacheSet(cacheKey, tickets);

        return Changelog.sortJiraTickets(tickets);
    }

    /**
     * Get the Jira project reference from a string.
     *
     * @param {string} string
     * @returns {string|null}
     */
    findJiraReferences(string) {
        const pattern = new RegExp(`^${this.getJiraProjectKey()}-(?!0+)(\\d+)`, 'i');
        const found = string.match(pattern);
        return found ? found.shift().toUpperCase() : null;
    }

    /**
     * Retrieve formatted Jira information by a key.
     *
     * @param {string} issueKey
     * @returns {Promise<*>}
     */
    async getJiraIssue(issueKey) {
        // Try to get the issue from cache first.
        if (this.#cache.has(issueKey)) {
            return this._cacheGet(issueKey);
        }

        // Pull in the Jira issue data.
        const jiraIssue = await this.jiraApi.findIssue(issueKey).catch(err => {
            err.message = `Unable to load Jira issue ${issueKey}.\n` + err?.message;
            throw err;
        });

        // Build base issue details object.
        const issueDetails = {
            issueNumber: issueKey,
            title: jiraIssue.fields.summary,
            type: jiraIssue.fields.issuetype.name,
            url: `${this.jiraApi.protocol}//${this.jiraApi.host}/browse/${issueKey}`,
        };

        // Add extra fields from config.
        const extraFields = this.getOption('jiraFields') || [];
        extraFields.forEach(field => {
            if (jiraIssue.fields.hasOwnProperty(field.fieldName)) {
                issueDetails[field.key] = jiraIssue.fields[field.fieldName];
            }
        });

        this._cacheSet(issueKey, issueDetails);
        return issueDetails;
    }

    /**
     * Get multiple Jira issues.
     *
     * @param {array} issueKeys
     * @returns {Promise<unknown[]>}
     */
    async getJiraIssues(issueKeys) {
        // Handle bad issue keys gracefully.  Don't kill the program.
        const issues = await Promise.all(issueKeys.map(async (issueKey) => {
            return await this.getJiraIssue(issueKey).catch(err => {
                // It's OK.  Just keep going.
                console.warn(err.message);
            });
        }));

        // Remove any issues that couldn't be found.
        return issues.filter(n => n);
    }

    /**
     * Sort an array of Jira issue keys numerically.
     *
     * @param {array} tickets
     * @returns {array}
     */
    static sortJiraTickets(tickets) {
        return tickets.sort((a, b) => {
            let num1 = parseInt(a.match(/\d+/));
            let num2 = parseInt(b.match(/\d+/));
            return num1 - num2;
        });
    }

    /**
     * Get a list of active FixVersions from Jira.
     *
     * @returns {Promise<*>}
     */
    async getActiveVersions() {
        // Check the cache first.
        const cacheKey = this.getJiraProjectKey() + '-versions';
        if (this.#cache.has(cacheKey)) {
            return this._cacheGet(cacheKey);
        }

        // Pull versions from Jira.
        let versions = await this.jiraApi.getVersions(this.getJiraProjectKey());
        versions = versions.filter(version => (version.released === false && version.archived === false));

        // Set the cache.
        this._cacheSet(cacheKey, versions);

        return versions;
    }

    /**
     * Get a list of issues from a Jira fix version.
     *
     * @param {string} version
     * @returns {Promise<*>}
     */
    async getFixVersionIssues(version) {
        // Check the cache first.
        const cacheKey = this.getJiraProjectKey() + '-' + version;
        if (this.#cache.has(cacheKey)) {
            return this._cacheGet(cacheKey);
        }

        // Get the issues tagged into a Fix Version.
        const results = await this.jiraApi.searchJira(`project = ${this.getJiraProjectKey()} AND fixVersion = "${version}"`);

        // Search results are a different format than Jira Issues, so we need to normalize them.
        const issues = Promise.all(results.issues.map(async issue => {
            return await this.getJiraIssue(issue.key);
        }));

        // Set the cache.
        this._cacheSet(cacheKey, issues);

        return issues;
    }

    /**
     * Create a GitHub Release.
     *
     * @param {object} releaseConfig
     * @returns {Promise<*>}
     */
    async createGitHubRelease(releaseConfig) {
        const repo = await this.getGitHubRepo();
        return await repo.createRelease(releaseConfig).then(response => {
            // Link to brand new release on GitHub.
            if (response.status && response.status === 201) {
                console.log(`Release ${this.getReleaseName()} created successfully.`);
                console.log(`Link: ${response.data.html_url}`);
                open(response.data.html_url);
            }
        }).catch(err => {
            err.message = "Unable to create GitHub release.\n" + err?.message;
            throw err;
        });
    }

    /**
     * Ask the user to pick one of an array of options.
     *
     * @param {string} question
     * @param {array} choices
     * @returns {Promise<*>}
     */
    async askChoice(question, choices) {
        const answers = await inquirer.prompt([{
            type: 'list',
            name: 'userChoice',
            message: question,
            choices: choices,
        }]);

        return answers.userChoice;
    }

    /**
     * Determine if we're running in debug mode.
     *
     * @returns {boolean}
     */
    debug() {
        return !!this.getOption('debug');
    }

    /**
     * Replace the cache bucket.
     */
    resetCache() {
        this.#cache.flushAll();
    }

    /**
     * Internal wrapper to get a cache value.
     *
     * @param key
     * @returns {unknown}
     * @private
     */
    _cacheGet(key) {
        if (this.debug()) console.log(`Retrieved from cache: ${key}`);
        return this.#cache.get(key);
    }

    /**
     * Internal wrapper to set a cache value.
     *
     * @param key
     * @param value
     * @param ttl
     * @private
     */
    _cacheSet(key, value, ttl) {
        this.#cache.set(key, value, ttl);
        if (this.debug()) console.log('Cache set: ' + key);
    }
}

module.exports = Changelog;
