#!/usr/local/bin/node
"use strict";

const TestUtilities = {
    /**
     * Delay a process to simulate API lag.
     *
     * @param seconds
     * @returns {Promise<unknown>}
     */
    wait: (seconds) => {
        return new Promise(resolve => setTimeout(resolve, (seconds * 1000)));
    }
};

module.exports = TestUtilities;