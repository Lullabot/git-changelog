#!/usr/bin/env node
"use strict";

const tasksSystem = {
    /**
     * Flush the caches.
     */
    clearCache: {
        label: "Flush Any Stored Data",
        chain: true,
        process: async (changelog) => {
            changelog.resetCache();
            console.log("All stored data has been purged.  Have a nice day!");
        }
    },

    /**
     * Exit the program.
     */
    exit: {
        label: "Exit",
        chain: false,
        process: async (changelog) => {
            console.log('Goodbye.');
            return true;
        }
    }
};

module.exports = tasksSystem;