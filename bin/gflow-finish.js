#!/usr/bin/env node
"use strict";
const readPkgUp = require("read-pkg-up");
const commander = require("commander");
const {finish, getConfiguration} = require("../src");

commander
  .usage("gflow-rebase")
  .option("-s, --skip", "Skip the unit test.", (v, t) => t + 1, 0)
  .action(() => {
  })
  .parse(process.argv);

getConfiguration()
  .then((config) => {
    finish(Object.assign({}, {
      test: !commander.skip
    }));
  });

