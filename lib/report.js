#!/usr/local/bin/node
"use strict";

const md = require('./markdown');

/**
 * Defines class Report.
 */
class Report {
    /**
     * Grouping title for issues that don't have a grouping field value.
     * @type {string}
     */
    static ungrouped = 'Ungrouped';

    /**
     * The report title.
     * @type {string}
     */
    title;

    /**
     * A list of issues to include in the report.
     * @type {[]}
     */
    issues = [];

    /**
     * The issues grouped by a particular field.
     * @type {{}}
     */
    grouped = {};

    /**
     * Store the lines of output to be rendered.
     * @type {[]}
     */
    output = [];

    /**
     * Constructor.
     *
     * @param {string} title
     * @param {array} issues
     */
    constructor(title, issues) {
        this.title = title;
        this.issues = issues;
    }

    /**
     * Group an array of issues by a given field.
     *
     * @param {string} field
     * @returns {Report}
     */
    groupByField(field) {
        // Reset the storage.
        this.grouped = {};

        this.issues.forEach(issue => {
            if (issue.hasOwnProperty(field)) {
                this.grouped[issue[field]] = this.grouped[issue[field]] || [];
                this.grouped[issue[field]].push(issue);
            } else {
                this.grouped[Report.ungrouped] = this.grouped[Report.ungrouped] || [];
                this.grouped[Report.ungrouped].push(issue);
            }
        });

        return this;
    }

    /**
     * Add a line of output to the report.
     *
     * @param {string} string
     */
    addLine(string) {
        string = string || '';
        this.output.push(string);
    }

    /**
     * Add a title line to the output.
     *
     * @param string
     */
    addTitle(string) {
        this.addLine(string.h1());
    }

    /**
     * Add a heading line to the output.
     * @param string
     */
    addHeading(string) {
        this.addLine(string.h2());
    }

    /**
     * Add a group of issues to the output.
     *
     * @param {string} heading - The Section Heading string.
     * @param {array} group - The array of issues to go in that heading.
     */
    addIssueGroup(heading, group) {
        this.addHeading(heading);
        group.forEach(issue => {
            this.addIssue(issue);
        });
    }

    /**
     * Add a single issue to the output.
     *
     * @param issue
     */
    addIssue(issue) {
        const link = issue.issueNumber.link(issue.url);
        this.addLine(`1. [${link}] ${issue.title}`);
    }

    /**
     * Get a list of issues that are missing a particular field.
     *
     * @param field
     * @returns {*[]}
     */
    getIssuesMissingField(field) {
        return this.issues.filter(issue => {
            if (!issue.hasOwnProperty(field) || !issue[field]) {
                return issue;
            }
        });
    }

    /**
     * Build the output array.
     *
     * @returns {Report}
     */
    buildFullReport() {
        // Reset the output.
        this.output = [];

        // Add a title line.
        this.addTitle(`Release Report for ${this.title}`);

        // Add each issue with optional grouping.
        if (Object.keys(this.grouped).length > 0) {
            for (let heading in this.grouped) {
                this.addIssueGroup(heading, this.grouped[heading]);
            }
        } else {
            this.issues.forEach(issue => {
                this.addIssue(issue);
            });
        }

        return this;
    }

    /**
     * Build a report of issues that are missing a given field.
     *
     * @param {string} field
     */
    buildMissingFieldReport(field) {
        // Reset the output.
        this.output = [];

        this.addTitle(`Missing Field Report for '${field}'`);
        const issues = this.getIssuesMissingField(field);

        issues.forEach(issue => {
            this.addIssue(issue);
        })

        return this;
    }

    /**
     * Render the output.
     */
    render() {
        console.log(this.getOutput());
    }

    /**
     * Get the formatted output array.
     *
     * @returns {string}
     */
    getOutput() {
        return this.output.join('\n');
    }

    /**
     * Add some basic logging functions for consistency.
     */
    printConfirm(string) {
        console.log(`✅  ${string}`);
    }
    printWarn(string) {
        console.log(`⚠️  ${string}`);
    }
    printError(string) {
        console.log(`❌  ${string}`);
    }
}

module.exports = Report;
