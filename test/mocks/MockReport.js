#!/usr/local/bin/node
"use strict";

const Report = require("../../lib/report");

/**
 * Defines class MockReport.
 */
class MockReport extends Report {
    /**
     * Constructor
     */
    constructor(title, issues) {
        super(title, issues);
    }
}

module.exports = MockReport;