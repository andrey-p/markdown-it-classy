"use strict";

var classy,
  renderersToReplace = [
    { pattern: "p", fullName: "paragraph" },
    { pattern: "h\\d", fullName: "heading" },
    { pattern: "ul", fullName: "bullet_list" },
    { pattern: "li", fullName: "list_item" },
    { pattern: "ol", fullName: "ordered_list" },
    { pattern: "blockquote", fullName: "blockquote" },
    { pattern: "em", fullName: "em", inline: true },
    { pattern: "strong", fullName: "strong", inline: true }
  ],
  replacedMethods = {};

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
    classString = "",
    i,
    pendingText,
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
  // or just before a newline
  if (pos !== state.posMax && state.src.charCodeAt(pos) !== 0xA) { // \n
    return false;
  }

  state.pos = pos;

  // work back through the tokens, checking if any of them is an open inline tag
  for (i = 0; i < state.tokens.length; i += 1) {
    if (state.tokens[i].type === "em_open"
        || state.tokens[i].type === "strong_open") {
      state.tokens[i].attrPush(["class", classString]);

      // if it's a class statement in an inline tag
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

function parseBlock(state) {
  var i,
    classy;

  for (i = 0; i < state.tokens.length; i += 1) {
    if (state.tokens[i].type === "inline") {
      classy = getClassyFromInlineToken(state.tokens[i]);

      if (classy) {
        state.tokens[i - 1].attrPush(["class", classy.content]);
      }
    }
  }
}

classy = function (md) {
  md.inline.ruler.push("classy", parse);
  md.core.ruler.push("classy", parseBlock);
};

module.exports = classy;
