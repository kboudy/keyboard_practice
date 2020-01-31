#!/usr/bin/env node

const chalk = require("chalk"),
  fs = require("fs"),
  path = require("path"),
  boxen = require("boxen"),
  readline = require("readline"),
  appDir = path.dirname(require.main.filename);

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

const performanceJsonPath = path.join(appDir, "performance.json");
const allKeys =
  "abcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()-=_+~`[]\\{}|<>?,./'\":;";
function compare(a, b) {
  if (a.millis < b.millis) {
    return -1;
  }
  if (a.millis > b.millis) {
    return 1;
  }
  return 0;
}

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
const getHelperText = k => {
  switch (k.trim()) {
    case "|":
      return " pipe";
    case "9":
      return " number 9";
    case "g":
      return " letter g";
    case "~":
      return " tilde";
    case "l":
      return " letter l";
    case "1":
      return " number 1";
    case "-":
      return " dash";
    case "_":
      return " underscore";
    case "`":
      return " backtick";
    case ",":
      return " comma";
    case ".":
      return " period";
    default:
      return "";
  }
};
let currentKeyIndex = 0;
let performance = null;
if (fs.existsSync(performanceJsonPath)) {
  performance = JSON.parse(fs.readFileSync(performanceJsonPath));
}
const thisSessionPerformance = {};
let prevSessionKey = null;
if (performance) {
  for (const k in performance) {
    if (!prevSessionKey || k > prevSessionKey) {
      prevSessionKey = k;
    }
  }
}
const prevSession = prevSessionKey ? performance[prevSessionKey] : null;
let keysToUse = allKeys.split(""); // we'll add any wrong keys & the 10% slowest so they appear twice
const prevCorrectKeys = [];
if (prevSession) {
  for (const k in prevSession) {
    if (!prevSession[k].correct) {
      keysToUse.push(k);
    } else {
      prevCorrectKeys.push({ millis: prevSession[k].millis, key: k });
    }
  }
}
prevCorrectKeys.sort(compare);
// the slowest 10% are at the end
const saveAmount = Math.floor(prevCorrectKeys.length * 0.1);
const slowPokes = prevCorrectKeys.splice(-saveAmount);
keysToUse = [...keysToUse, ...slowPokes.map(k => k.key)].filter(k =>
  allKeys.includes(k)
);
const shuffledKeys = shuffle(keysToUse);
if (!performance) {
  performance = {};
}
performance[Date.now()] = thisSessionPerformance;
console.log(
  chalk.yellow(shuffledKeys[currentKeyIndex]) +
    chalk.gray(` ${getHelperText(shuffledKeys[currentKeyIndex])}`)
);
let keyStart = Date.now();
const wrongKeys = [];
process.stdin.on("keypress", (str, key) => {
  if (key.ctrl && (key.name === "c" || key.name === "q")) {
    process.exit(); // eslint-disable-line no-process-exit
  }
  let correct = true;
  if (key.sequence === shuffledKeys[currentKeyIndex]) {
    console.log(chalk.green(key.sequence.trim()));
  } else {
    correct = false;
    if (!wrongKeys.includes(shuffledKeys[currentKeyIndex] + key.sequence)) {
      wrongKeys.push(shuffledKeys[currentKeyIndex] + key.sequence);
    }
    console.log(chalk.red(key.sequence.trim()));
  }
  let millis = Date.now() - keyStart;
  keyStart = Date.now();
  if (thisSessionPerformance[key.sequence]) {
    // this is the second time we've seen this key;
    millis = Math.ceil(
      (millis + thisSessionPerformance[key.sequence].millis) / 2
    );
    correct = correct && thisSessionPerformance[key.sequence].correct;
  }
  thisSessionPerformance[key.sequence] = { millis, correct };
  console.log();
  currentKeyIndex++;
  if (currentKeyIndex === shuffledKeys.length) {
    fs.writeFileSync(performanceJsonPath, JSON.stringify(performance), "utf8");
    wrongKeys.sort();
    let wrongKeysColors = "";
    for (const wk of wrongKeys) {
      wrongKeysColors += chalk.green(wk[0]) + chalk.red(wk[1]);
      if (wrongKeys.indexOf(wk) < wrongKeys.length - 1) {
        wrongKeysColors += " ";
      }
    }
    let resultsMessage = "";
    if (wrongKeys.length === 0) {
      resultsMessage += chalk.green(`~ perfect score ~`);
    } else {
      resultsMessage += chalk.red(
        `${wrongKeys.length} incorrect: ${wrongKeysColors}`
      );
    }
    let testTimeMs = 0;
    for (const k in thisSessionPerformance) {
      testTimeMs += thisSessionPerformance[k].millis;
    }

    resultsMessage += `\n${chalk.white(
      Math.round(testTimeMs / 100) / 10
    )} seconds`;
    console.log(boxen(resultsMessage, { borderColor: "magenta" }));
    console.log();
    process.exit(); // eslint-disable-line no-process-exit
  }
  console.log(
    chalk.yellow(shuffledKeys[currentKeyIndex]) +
      chalk.gray(` ${getHelperText(shuffledKeys[currentKeyIndex])}`)
  );
});
