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
  it("should work for the final list item in a ul", function () {
    var result = md.render("- foo\n- baz {bar}");
    result.should.containEql("<ul>");
    result.should.containEql("<li class=\"bar\">baz</li>\n</ul>");
  });
  it("should work with a contrived situation where every li AND the containing ul have classes", function () {
    var result = md.render("- foo {foo-class}\n- bar {bar-class}\n{baz}");
    result.should.containEql("<ul class=\"baz\">");
    result.should.containEql("<li class=\"foo-class\">foo</li>");
    result.should.containEql("<li class=\"bar-class\">bar</li>");
  });
  it("should work with blockquotes", function () {
    md.render("> foo bar\n{baz}").should.containEql("<blockquote class=\"baz\">");
  });
  it("should work for the final paragraph in a quote", function () {
    var result = md.render("> foo\n>\n> bar {baz}");
    result.should.containEql("<blockquote>");
    result.should.containEql("<p class=\"baz\">bar</p>\n</blockquote>");
  });
  it("should work with a contrived situation where every paragraph AND the containing blockquote have classes", function () {
    var result = md.render("> foo {foo-class}\n>\n> bar {bar-class}\n{baz}");
    result.should.containEql("<blockquote class=\"baz\">");
    result.should.containEql("<p class=\"foo-class\">foo</p>");
    result.should.containEql("<p class=\"bar-class\">bar</p>");
  });
  it("should handle empty markdown elements", function () {
    md.render("*").should.containEql("<ul>");
  });
});
