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

const Path = require( "path" );
const File = require( "fs" );


/**
 * Implements filter rejecting any request lacking proper API key.
 *
 * @param {object} app
 * @returns {Promise}
 */
module.exports = function( app ) {

	return new Promise( ( resolve, reject ) => {
		File.readFile( process.env.KEYS_FILE || Path.join( __dirname, "keys.lst" ), ( error, content ) => {
			let keys = {};

			if ( error ) {
				if ( error.code === "ENOENT" ) {
					keys = null;
				} else {
					return reject( error );
				}
			}

			if ( keys ) {
				content.toString( "utf8" )
					.split( "/(?:\r?\n)+/" )
					.forEach( line => {
						line = line.replace( /\s+/g, "" );
						if ( line.length > 0 && line[0] !== "#" ) {
							if ( line[0] === "!" ) {
								keys[line.substr( 1 )] = false;
							} else {
								keys[line] = true;
							}
						}
					} );

				app.use( function( req, res, next ) {
					const key = String( req.get( "x-api-key" ) || "" ).trim();

					if ( !keys.hasOwnProperty( key ) || !keys[key] ) {
						next( Object.assign( new Error( "missing valid API key" ), { httpCode: 403 } ) );
					} else {
						next();
					}
				} );
			}


			resolve();
		} );
	} );

};
