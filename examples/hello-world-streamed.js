/**
 * (c) 2017 cepharum GmbH, Berlin, http://cepharum.de
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 cepharum GmbH
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @author: cepharum
 */

"use strict";

const Client = require( "../lib/client" );
const { BufferReadStream } = require( "../lib/util/buffer-stream" );


new Client( process.env.SERVICE_URL || process.argv[2] || "127.0.0.1:3000" )
	.printHtmlCode( new BufferReadStream( Buffer.from( `<html>
<head>
</head>
<body>
<h1>Hello World!</h1>
<p>This is a very simple example querying this text formatted using HTML code to some service configured using environment variable or single argument to the related example script generating this. The HTML code itself is streamed from a readable stream.</p>
</body>
</html>`, "utf8" ) ) )
	.then( client => client.response.pipe( process.stdout ) )
	.catch( error => console.error( `request failed: ${error.message}` ) );
