#!/usr/bin/env node


// const os = require("os");
// os.tmpDir = os.tmpdir

const spritesheet = require("spritesheet-js");
// import * as spritesheet from "spritesheet-js";

spritesheet(
  "src/assets-src/tiles/**/*.png",
  {
    format: "json",
    name: "atlas-tiles",
    path: "src/assets",
    trim: true,
    powerOfTwo: true,
    square: false,
    padding:2
  },
  function (err) {
    if (err) throw err;

    console.log("atlas successfully generated");
  },
);

spritesheet(
  "src/assets-src/icons/**/*.png",
  {
    format: "json",
    name: "atlas-icons",
    path: "src/assets",
    trim: true,
    powerOfTwo: false,
    square: false,
  },
  function (err) {
    if (err) throw err;

    console.log("icons successfully generated");
  },
);
