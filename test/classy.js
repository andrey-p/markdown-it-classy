"use strict";

var should = require("should"),
  classy = require("../"),
  MarkdownIt = require("markdown-it"),
  md;

describe("markdown-it-classy", function () {
  before(function () {
    md = new MarkdownIt();
    md.use(classy);
  });
  it("should work with paragraphs", function () {
    md.render("foo\n{bar}").should.containEql("<p class=\"bar\">foo</p>");
  });
  it("should work with paragraphs if class is specified on the same line", function () {
    md.render("foo {bar}").should.containEql("<p class=\"bar\">foo</p>");
  });
  it("shouldn't interpret curly braces in the middle of a paragraph as a class string", function () {
    md.render("foo {bar} baz").should.containEql("<p>foo {bar} baz</p>");
  });
  it("should work with atx-style headings", function () {
    md.render("# foo {bar}\n\n baz").should.containEql("<h1 class=\"bar\">foo</h1>");
  });
  it("should work with setext-style headings", function () {
    md.render("foo {bar}\n====\n baz").should.containEql("<h1 class=\"bar\">foo</h1>");
  });
  it("should work with em tags", function () {
    md.render("_foo {bar}_").should.containEql("<em class=\"bar\">foo</em>");
  });
  it("should work with strong tags", function () {
    md.render("__foo {bar}__").should.containEql("<strong class=\"bar\">foo</strong>");
  });
  it("should work with ul tags", function () {
    md.render("- foo\n- baz\n{bar}").should.containEql("<ul class=\"bar\">");
  });
  it("should work with blockquotes", function () {
    md.render("> foo bar\n{baz}").should.containEql("<blockquote class=\"baz\">");
  });
});
