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

const OS = require( "os" );
const Path = require( "path" );
const File = require( "fs" );


/**
 * Implements filter ensuring to have a common temporary folder dedicated to
 * current process.
 *
 * @param {object} app
 * @returns {Promise} promises having injected middleware managing access on temporary folder
 */
module.exports = function( app ) {
	return new Promise( ( resolve, reject ) => {
		File.mkdtemp( Path.join( OS.tmpdir(), "pdf-printer-" ), ( error, pathName ) => {
			if ( error || !pathName ) {
				return reject( new Error( "cannot create temporary folder" ) );
			}

			console.log( `using ${pathName} for temporary files` );

			app.use( function( req, res, next ) {
				req.ourTempFolder = pathName;

				next();
			} );

			resolve();
		} );
	} );
};
