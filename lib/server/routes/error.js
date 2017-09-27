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

module.exports = function( app ) {

	app.all( "/*", function( req, res, next ) {
		next( Object.assign( new Error( `request for unknown resource: ${req.path}` ), { httpCode: 404 } ) );
	} );

	app.use( function( error, req, res, next ) {	// eslint-disable-line no-unused-vars
		res
			.status( error.httpCode || error.code || 500 )
			.format( {
				json: () => {
					res.json( {
						error: String( error.message ),
					} );
				},
				pdf: () => {
					res.json( {
						error: String( error.message ),
					} );
				},
				default: () => {
					res
						.type( "html" )
						.end( `<html>
<head><title>Error: ${error.message}</title></head>
<body>
<h1>Error</h1>
<p>${error.message.replace( /</g, "&lt;" )}</p>
</body>
</html>` );
				}
			} );
	} );

};
