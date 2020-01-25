#!/usr/bin/env node

const chalk = require("chalk"),
  fs = require("fs"),
  path = require("path");

// const got = require("got");
const eol = require("os").EOL;
const readline = require("readline");
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
const allKeys =
  "abcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()-=_+~`[]\\{}|<>?,./'\":;";

function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

const shuffledKeys = shuffle(allKeys.split(""));
let currentKeyIndex = 0;
let performance = {};
console.log(chalk.yellow(shuffledKeys[currentKeyIndex]));
let keyStart = Date.now();
let testStart = Date.now();
let wrongCount = 0;
process.stdin.on("keypress", (str, key) => {
  if (key.ctrl && key.name === "c") {
    process.exit(); // eslint-disable-line no-process-exit
  }
  let correct = true;
  if (key.sequence === shuffledKeys[currentKeyIndex]) {
    console.log(chalk.green(key.sequence.trim()));
  } else {
    correct = false;
    wrongCount++;
    console.log(chalk.red(key.sequence.trim()));
  }
  const millis = Date.now() - keyStart;
  keyStart = Date.now();
  performance[key.sequence] = { millis, correct };
  console.log();
  currentKeyIndex++;
  if (currentKeyIndex === shuffledKeys.length) {
    fs.writeFileSync("performance.json", JSON.stringify(performance), "utf8");
    console.log(chalk.magenta(`--------------------`));
    console.log(chalk.red(`${wrongCount} incorrect`));
    console.log(chalk.white(`${Date.now() - testStart} ms`));
    console.log(chalk.magenta(`--------------------`));
    console.log();
    process.exit(); // eslint-disable-line no-process-exit
  }
  console.log(chalk.yellow(shuffledKeys[currentKeyIndex]));
});
