"use strict";

var classy,
  renderersToReplace = [
    { pattern: "p", fullName: "paragraph" },
    { pattern: "h\\d", fullName: "heading" },
    { pattern: "ul", fullName: "bullet_list" },
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
    posMax = state.posMax,
    classString = "";

  if (state.src.charCodeAt(pos) !== 0x7B) { // {
    return false;
  }

  if (state.src.charCodeAt(posMax - 1) !== 0x7D) { // }
    return false;
  }

  // advance to account for opening brace
  pos += 1;

  while (pos < posMax - 1) {
    if (!isValidClassChar(state.src.charCodeAt(pos))) {
      return false;
    }

    classString += state.src.charAt(pos);
    pos += 1;
  }

  state.pos = posMax;

  state.push({
    type: "classy",
    level: state.level,
    content: classString
  });

  return true;
}

function getClassyFromBlockElement(tokens, idx, fullName) {
  var classy,
    lastToken,
    i,
    inlineContents;

  // in a block element the inline content is always sandwiched
  // between the opening and the closing tags
  // (we look for the last inline token because
  // that's the one we're interested in for <ul>s and <ol>s)

  for (i = idx; i < tokens.length; i += 1) {
    if (tokens[i].type === "inline") {
      inlineContents = tokens[i].children;
    }

    if (tokens[i].type === fullName + "_close") {
      break;
    }
  }

  // In the case of empty markdown elements ("*" for example), there
  // won't be any inline content, so in that case just return null
  if (!(inlineContents && inlineContents.length)) {
    return null;
  }

  // if the last token of the inline content is of type "classy"
  // we have to do our thing
  if (inlineContents[inlineContents.length - 1].type !== "classy") {
    return null;
  }

  classy = inlineContents.pop();

  // might be some cleaning up to do...
  lastToken = inlineContents[inlineContents.length - 1];
  if (lastToken.type === "softbreak") {
    // if the class was added via a newline,
    // there'll be a rampant \n left
    inlineContents.pop();
  } else if (lastToken.type === "text") {
    // else there might be some whitespace to trim
    lastToken.content = lastToken.content.trim();
  }

  return classy;
}

function getClassyFromInlineElement(tokens, idx, fullName) {
  var classy,
    closingIdx,
    startingLevel = tokens[idx].level,
    i;

  // in an inline element, the opening and closing tags
  // may have multiple tokens between them
  // so we need to iterate through the remaining elements
  // and get the closing tag
  // the element *before* the closing tag should be "classy"

  for (i = idx; i < tokens.length; i += 1) {
    if (tokens[i].type === fullName + "_close"
        && tokens[i].level === startingLevel) {
      closingIdx = i;
      break;
    }
  }

  if (tokens[closingIdx - 1].type !== "classy") {
    return null;
  }

  // we can't remove the classy token
  // as it'll throw off markdown-it's token iteration
  classy = tokens[closingIdx - 1];

  // some whitespace we may need to trim on the previous element
  tokens[closingIdx - 2].content = tokens[closingIdx - 2].content.trim();

  return classy;
}

// replace all rules that we want to enable classy on
function replaceRenderer(md, renderer) {
  var openMethodName = renderer.fullName + "_open";
  replacedMethods[openMethodName] = md.renderer.rules[openMethodName];

  md.renderer.rules[openMethodName] = function (tokens, idx) {
    var classy, result;

    // first get the result as per the original method we replaced
    result = replacedMethods[openMethodName].apply(null, arguments).trim();

    if (renderer.inline) {
      classy = getClassyFromInlineElement(tokens, idx, renderer.fullName);
    } else {
      classy = getClassyFromBlockElement(tokens, idx, renderer.fullName);
    }

    if (classy) {
      result = result.replace(new RegExp("<" + renderer.pattern), "$& class=\"" + classy.content + "\"");
    }

    return result;
  };
}

classy = function (md) {
  md.inline.ruler.push("classy", parse);

  // no-op
  md.renderer.rules.classy = function () { return ""; };

  renderersToReplace.forEach(function (renderer) {
    replaceRenderer(md, renderer);
  });
};

module.exports = classy;
