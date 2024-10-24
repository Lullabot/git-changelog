#!/usr/bin/env node
"use strict";

/**
 * @file
 * Generate the release report for [Current Project] team.
 */
const {program} = require('commander');
const Changelog = require('./lib/changelog');

// Instructions for the program.
const config = require('./config.js');

// Collect options from the program.
program
    .option('-b, --base <branch>', 'Base branch for the changelog. Required.')
    .option('-h, --head <branch>', 'Most recent branch for the changelog. Required.')
    .option('-r, --repo <repository>', 'A GitHub repository to look in.  Overrides config settings.  May be defined in config.js.')
    // .option('-j, --jira <key>', 'Specify a Jira project key.  May be defined in config.js.')
    .option('-d, --debug', 'Run the program in debug mode for more verbose errors.')
    .parse(process.argv);

/** EDIT BELOW THIS SECTION ONLY **/

const myTasks = require('./usr/my-tasks');
const myReport = require('./usr/my-report');

const changelog = new Changelog(config, program.opts(), myTasks);
changelog.setReportClass(myReport);
changelog.run();

/** EDIT ABOVE THIS SECTION ONLY **/

// General error handler.
process.on('uncaughtException', err => {
    console.error('😵️ ' + err.message);

    // Display more verbose errors in debug mode.
    if (changelog.debug()) {
        console.error(err);
    }
});
