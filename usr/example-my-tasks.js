#!/usr/bin/env node
"use strict";

const tasks = {
    /**
     * Hello world.
     * This key must be unique to all tasks.
     */
    helloWorld: {
        label: "Print a Test",
        chain: true,
        questions: [
            {
                name: 'personalMessage',
                type: 'input',
                message: 'Personal Message:',
            }
        ],

        /**
         * Run the task.
         *
         * @param {Changelog} changelog
         * @returns {Promise<void>}
         *
         * The "process" function is called when the task is run.
         * You may create as many other functions as you want in
         * order to fulfill this task.
         */
        process: async (changelog) => {
            const report = changelog.newReport("Hello-World", []);
            report.addTitle("Hello World");
            report.addHeading("My Heading");
            report.addLine(changelog.getOption('personalMessage'));

            report.render();
        }
    }
};

module.exports = tasks;
