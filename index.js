"use strict";

var classy;

function isValidClassChar(code) {
  return (code >= 0x30 && code <= 0x39) || // 0-9
    (code >= 0x41 && code <= 0x5A) || // A-Z
    (code >= 0x61 && code <= 0x7A) || // a-z
    code === 0x5F || // _
    code === 0x2D || // -
    code === 0x20; //   <- space
}

function parse(state) {
  var pos = state.pos,
    initialPos = pos,
    classString = "",
    i,
    pendingText,
    preferOuter = false,
    token;

  if (state.src.charCodeAt(pos) !== 0x7B) { // {
    return false;
  }

  // advance to account for opening brace
  pos += 1;

  // grab everything til the closing brace
  while (state.src.charCodeAt(pos) !== 0x7D) { // }
    if (!isValidClassChar(state.src.charCodeAt(pos))) {
      return false;
    }

    classString += state.src.charAt(pos);
    pos += 1;
  }

  // advance to account for closing brace
  pos += 1;


  // only check classy statements at the end of the element
  if (pos !== state.posMax && state.src.charCodeAt(pos) !== 0xA) {
    return false;
  }

  if (state.src.charCodeAt(initialPos - 1) === 0xA) {
    preferOuter = true;
  }

  state.pos = pos;

  // work back through the tokens, checking if any of them is an open inline tag
  // if it does turn out we're in an inline tag, the class belongs to that
  for (i = 0; i < state.tokens.length; i += 1) {
    if (state.tokens[i].type === "em_open"
        || state.tokens[i].type === "strong_open") {
      state.tokens[i].attrPush(["class", classString]);

      // there might be a leftover space at the end
      pendingText = state.pending;
      if (pendingText.charCodeAt(pendingText.length - 1) === 0x20) {
        state.pending = pendingText.substring(0, pendingText.length - 1);
      }

      return true;
    }
  }

  token = state.push("classy", "classy", 0);
  token.content = classString;
  token.hidden = true;
  token.preferOuter = preferOuter;

  return true;
}

function getClassyFromInlineToken(inlineToken) {
  var classy,
    tokens = inlineToken.children,
    numChildren = tokens.length;

  // the element *at the end* of the inline tag
  // should be classy

  if (tokens[numChildren - 1].type !== "classy") {
    return null;
  }

  classy = tokens.pop();
  numChildren -= 1;

  if (tokens[numChildren - 1].type === "softbreak") {
    // we may need to get rid of the newline just before classy statement
    tokens.pop(numChildren - 1);
  } else {
    // or there might be some whitespace
    // we may need to trim on the previous element
    tokens[numChildren - 1].content = tokens[numChildren - 1].content.trim();
  }

  return classy;
}

function getOpeningToken(tokens, preferOuter, currentIndex) {
  var closingTokenIndex = currentIndex + 1,
    openingTokenType,
    i;

  if (tokens[closingTokenIndex].hidden) {
    closingTokenIndex += 1;
  }

  if (preferOuter && tokens[closingTokenIndex + 1]
      && /_close$/.test(tokens[closingTokenIndex + 1].type)) {
    closingTokenIndex += 1;
  }

  openingTokenType = tokens[closingTokenIndex].type.replace("_close", "_open");

  for (i = currentIndex; i >= 0; i -= 1) {
    if (tokens[i].type === openingTokenType
        && tokens[i].level === tokens[closingTokenIndex].level) {
      return tokens[i];
    }
  }
}

function parseBlock(state) {
  var i,
    openingToken,
    classy;

  for (i = 0; i < state.tokens.length; i += 1) {
    if (state.tokens[i].type === "inline") {
      classy = getClassyFromInlineToken(state.tokens[i]);
      while (classy) {
        openingToken = getOpeningToken(state.tokens, classy.preferOuter, i);
        openingToken.attrPush(["class", classy.content]);

        classy = getClassyFromInlineToken(state.tokens[i]);
      }
    }
  }
}

classy = function (md) {
  md.inline.ruler.push("classy", parse);
  md.core.ruler.push("classy", parseBlock);
};

module.exports = classy;
