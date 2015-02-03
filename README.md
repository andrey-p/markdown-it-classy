markdown-it-classy
===

This is a plugin for the [markdown-it](https://github.com/markdown-it/markdown-it) markdown parser.

Need to style some text written with markdown but are lacking that extra *oomph*? Plug in `markdown-it-classy`.

Install
---

```
$ npm install --save markdown-it-classy
```

Plug
---

```
var classy = require("markdown-it-classy"),
  MarkdownIt = require("markdown-it"),
  md = new MarkdownIt();

md.use(classy);
```

Use
---

Anything in curly brackets (`{}`) gets interpreted as a class string for that element.

```
This is paragraph 1.

This is paragraph 2 and I wish there was a way to make it blue.
{blue}
```

converts to:

```html
<p>This is paragraph 1.</p>

<p class="blue">This is paragraph 2 and I wish there was a way to make it blue.</p>
```

Go crazy (or not)
---

```
# All kinds of headings work! {classy}

## Atx... {classy} ##

... and Setext {classy}
---

_em {classy}_ and __strong {classy}__ are supported as well.
{classy}

- so
- are
- ul tags
{classy}

> blockquotes?
> {classy}
>
> why not!
{classy}
```

converts to:

```html
<h1 class="classy">All kinds of headings work!</h1>

<h2 class="classy">Atx...</h2>

<h2 class="classy">... and Setext</h2>

<p class="classy"><em class="classy">em</em> and <strong class="classy">strong</strong> are supported as well.

<ul class="classy">
	<li>so</li>
	<li>are</li>
	<li>ul tags</li>
</ul>

<blockquote class="classy">
	<p class="classy">blockquotes?</p>
	<p>why not!</p>
</blockquote>
```

Very classy indeed!
