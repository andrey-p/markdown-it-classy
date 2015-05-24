"use strict";

var chars = require("./chars");

exports.isValidClassChar = function (code) {
  return (code >= chars.ZERO && code <= chars.NINE) ||
    (code >= chars.A_UPPER && code <= chars.Z_UPPER) ||
    (code >= chars.A_LOWER && code <= chars.Z_LOWER) ||
    code === chars.UNDERSCORE ||
    code === chars.DASH ||
    code === chars.SPACE;
};
