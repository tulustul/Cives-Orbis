#!/usr/bin/env node

const spritesheet = require("spritesheet-js");

spritesheet(
  "src/assets-src/cleaned/tiles/**/*.png",
  {
    format: "json",
    name: "atlas-tiles",
    path: "src/assets",
    trim: true,
    powerOfTwo: true,
    square: false,
    padding:4
  },
  function (err) {
    if (err) throw err;

    console.log("atlas successfully generated");
  },
);

spritesheet(
  "src/assets-src/cleaned/resources/*.png",
  {
    format: "json",
    name: "atlas-resources",
    path: "src/assets",
    trim: true,
    powerOfTwo: false,
    square: false,
  },
  function (err) {
    if (err) throw err;

    console.log("resources successfully generated");
  },
);

spritesheet(
  "src/assets-src/cleaned/icons/units/*.png",
  {
    format: "json",
    name: "atlas-units",
    path: "src/assets",
    trim: true,
    powerOfTwo: false,
    square: false,
  },
  function (err) {
    if (err) throw err;

    console.log("units successfully generated");
  },
);
