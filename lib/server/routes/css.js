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

const CreateFile = require( "../../util/create-file" );


module.exports = function( app ) {
	/**
	 * "POST /css" collects CSS file provided in request body for use with
	 * upcoming conversion.
	 *
	 * Supported arguments are:
	 *  `css[]=<cssURL>`  selects (another) CSS file by URL to include
	 *
	 * Streams back converted PDF document or some JSON object on error.
	 */
	app.post( "/css", function( req, res, next ) {
		const sessionFolder = req.ourSessionFolder;
		if ( !sessionFolder ) {
			return next( Object.assign( new Error( "missing session required for providing assets" ), { httpCode: 400 } ) );
		}

		CreateFile( sessionFolder, ".css" )
			.then( fileStream => {
				fileStream.on( "finish", _success );

				req.on( "error", _error );
				fileStream.on( "error", _error );

				req.pipe( fileStream );
				req.resume();
			} )
			.catch( next );

		/**
		 * Responds on success when writing file has finished w/o error.
		 *
		 * @private
		 */
		function _success() {
			res
				.status( 200 )
				.json( {
					success: true,
				} );
		}

		/**
		 * Responds on error when reading request body or writing file as
		 * emitted any error.
		 *
		 * @param {Error} error
		 * @private
		 */
		function _error( error ) {
			res
				.status( error.httpCode || 500 )
				.json( {
					error: String( error.message || "unknown error" ),
				} );
		}
	} );
};
