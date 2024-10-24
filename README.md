# git-changelog
Pull commit credits between two git branches or tags to generate a release report.

## Entry point
1. Copy `index-example.js` to `index.js`.
2. Make any additions you need.
3. Run that file with `node index.js`.

## Tasks
This app uses our Task Manager framework. (TODO: Create a reference to this.)

The Changelog app will load user-selectable tasks from:
1. `lib/tasks-system.js`: Basis system level tasks like clearing caches and exiting the program.
2. `lib/tasks-app.js`: Default application tasks like previewing a report and comparing to a fix version.
3. User tasks that are passed into the constructor.  Copy `lib/tasks-app.js` to your own file, include that as an object, then pass it in as the third parameter to the constructor.

## Reports
The default report class can be overridden.  If you specified any additional Jira fields to fetch in your `config.js` file, you'll need to create your own report class to output that data. 
1. Copy `lib/report.js` to your own file.
2. Rename the class to something unique like "MyReport".
3. Use `Changelog.setReportClass()` to change the default report class for all reports, OR
4. If you only want to override the report for a single task, use `Changelog.setTaskReportClass()`.
