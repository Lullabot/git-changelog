/**
 * Provide the API connection parameters and default options.
 * @type {{githubToken: string, jiraUsername: string, jiraApi: string, githubApi: string, jiraToken: string}}
 */
module.exports = {
  // API parameters.  Don't forget the protocol on the API URLs.
  githubApi: "https://api.github.com",
  githubToken: "gogetatoken",
  jiraApi: "https://[yourjira].atlassian.net",
  jiraUsername: "yourjirausername",
  jiraToken: "gogetatoken",

  // (optional) Default options.  Leave these blank to be prompted at runtime.
  repo: "Owner/repo",
  groupByField: "issueType",
  jiraProjectKey: "JIRAPROJ",

  // (optional) Define the fields to fetch from Jira tickets.
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
}
