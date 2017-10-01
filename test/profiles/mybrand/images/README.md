# Using Vector Images

Basically SVG images can be used for embedding vector graphics such as brands and logos. However they need to comply with some rules to work as expected:

* All contained text glyphs should be converted to pathes.
* Any styling should be applied using `style`-attributes on elements rather than embedded CSS block using separate `style`-element. Otherwise the SVG might appear in black, only. E.g. when using Adobe Illustrator styling option should be set to _inline format_ instead of _internal CSS_ on exporting to SVG.
* As of WeasyPrint 0.40 the SVG requires explicit definition of width and height for proper sizing. On root element attributes `width` and `height` must be used explicitly providing width and height in non-relative units such as `cm`.
