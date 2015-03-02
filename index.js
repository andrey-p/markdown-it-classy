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
    classString = "";

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

  state.push({
    type: "classy",
    level: state.level,
    content: classString
  });

  return true;
}

function getClassyFromBlockElement(tokens, idx, fullName) {
  var classy,
    secondToLastToken,
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

  // only proceed if the last token of the inline content
  // is of type "classy"
  if (inlineContents[inlineContents.length - 1].type !== "classy") {
    return null;
  }

  // this is where things get hairy

  // we know that the last token is classy, but we also need to know
  // whether classy was separated from the inline text by a newline or space
  // so grab the second to last token...
  secondToLastToken = inlineContents[inlineContents.length - 2];

  if (secondToLastToken.type === "softbreak") {
    // ... if it's split with a newline, we always apply the class
    // to the containing block element
    // so remove it from the inline contents
    classy = inlineContents.pop();

    // get rid of the soft break token too
    inlineContents.pop();
  } else if (secondToLastToken.type === "text"
      && ["blockquote", "ordered_list", "bullet_list"].indexOf(fullName) === -1) {
    // ... if it wasn't a newline, and container isn't a blockquote,
    // ol, or ul, apply this the class to it
    classy = inlineContents.pop();

    // trim whitespace of that last bit of text
    secondToLastToken.content = secondToLastToken.content.trim();
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
