'use strict';
const chalk = require('chalk');
const figures = require('figures');
const { git, addSync, commitSync, resetSync, pushSync, remoteSync } = require('./git/index');
const CI = require('./ci');
const fs = require('fs');
const config = require('./config');
/**
 *
 * @returns {any}
 */
const readPackage = () => {
  return writePackage(JSON.parse(fs.readFileSync('./package.json', { encoding: 'utf8' })));
};
/**
 *
 * @param pkg
 */
const writePackage = (pkg) => {
  fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2), { encoding: 'utf8' });
  return pkg;
};

module.exports = {
  /**
   *
   * @returns {Promise<void>}
   */
  pre() {

    const { EMAIL, USER } = CI;

    if (CI) {

      if (EMAIL && USER) {
        git('config', '--global', 'user.email', EMAIL);
        git('config', '--global', 'user.name', USER);
      }

      git('checkout', config.production);
      git('branch', '--set-upstream-to=' + config.remoteProduction, config.production);

      console.log('[Gflow release]', chalk.green(figures.tick), `${CI.NAME} CI Installed`);

    } else {
      console.log('[Gflow release]', chalk.yellow(figures.cross), `Not in CI environment`);
    }

    return Promise.resolve();
  },
  /**
   *
   * @returns {*}
   */
  post() {
    try {
      const { GH_TOKEN } = process.env;
      const pkg = readPackage();
      const {
        version,
        repository: { url }
      } = pkg;
      const repository = url.replace('https://', '');

      if (!CI) {
        console.log('[Gflow release]', chalk.yellow(figures.cross), `Not in CI environment`);
        return Promise.resolve();
      }

      console.log('[Gflow release]', `Generate release tag for v${version}`);
      console.log('[Gflow release]', `REPOSITORY:      ${repository}`);
      console.log('[Gflow release]', `RELEASE_BRANCH:  ${config.production}`);
      console.log('[Gflow release]', `MASTER_BRANCH:   ${config.master}`);
      console.log('[Gflow release]', `BUILD:           ${CI.BUILD_NUMBER}`);

      if (GH_TOKEN) {
        console.log('[Gflow release]', `Configure remote repository ${repository}`);
        remoteSync('add', CI.ORIGIN, `https://${GH_TOKEN}@${repository}`);
      }

      console.log('[Gflow release]', 'Adding files to commit');
      addSync('-A');

      console.log('[Gflow release]', 'Reset .npmrc');
      resetSync('--', '.npmrc');

      console.log('[Gflow release]', `Commit files`);
      commitSync('-m', `${CI.NAME} build: ${CI.BUILD_NUMBER} v${version} [ci skip]`);

      console.log('[Gflow release]', `Push to ${config.production}`);
      pushSync('--quiet', '--set-upstream', CI.ORIGIN, config.production);

      console.log('[Gflow release]', `Sync ${config.develop} with ${config.production}`);
      pushSync('-f', CI.ORIGIN, `${config.production}:refs/heads/${config.develop}`);

      console.log(chalk.green(figures.tick), 'Release tag are applied on git');
    } catch (er) {
      console.log(chalk.red(figures.cross), String(er));
    }
    return Promise.resolve();
  }
};
