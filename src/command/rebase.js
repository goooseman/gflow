/* eslint-disable global-require */
const Listr = require('listr');
const chalk = require('chalk');
const figures = require('figures');
const git = require('../git/index');
const { getRebaseInfo } = require('../utils/get-rebase-info');

module.exports = options => {
  const { branch, fromBranch } = getRebaseInfo(options.fromBranch);

  const tasks = new Listr([
    {
      title: 'Refresh local repository',
      task: () => git.refreshRepository()
    },
    {
      title: `Rebase current branch from ${chalk.green(fromBranch)}`,
      task: () => git.rebase(fromBranch)
    },
    require('../install/index')(options)
  ]);

  return tasks
    .run()
    .then(() => {
      console.log(chalk.green(figures.tick), `Branch ${chalk.green(branch)} rebased from ${chalk.green(fromBranch)} HEAD`);
    })
    .catch(err => {
      console.error(chalk.red(String(err)));
    });
};
