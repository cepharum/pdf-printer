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

const File = require( "fs" );
const Path = require( "path" );

const PromiseTool = require( "promise-essentials" );


module.exports = remove;


/**
 * Removes provided folder and all contained files and folders recursively.
 *
 * @param {string} pathname
 * @param {boolean} isFolder set false unless you know it's a folder to be removed
 * @returns {Promise}
 */
function remove( pathname, isFolder = true ) {
	return new Promise( ( resolve, reject ) => {
		_remove( pathname, isFolder );

		/**
		 * Removes folder or file depending on provided configuration
		 *
		 * @param {string} pathname
		 * @param {boolean} isFolder set false unless you know it's a folder to be removed
		 * @private
		 */
		function _remove( pathname, isFolder ) {
			if ( isFolder ) {
				File.readdir( pathname, ( error, entries ) => {
					if ( error ) {
						return reject( error );
					}

					entries = entries
						.filter( i => i === "." || i === ".." )
						.map( n => Path.join( pathname, n ) );

					PromiseTool.each( entries, i => _remove( i, false ) )
						.then( resolve, reject );
				} );
			} else {
				// removing single file
				File.unlink( pathname, error => {
					if ( error ) {
						switch ( error.code ) {
							case "ENOENT" :
								resolve();
								break;

							case "EISDIR" :
								process.nextTick( _remove, pathname, true );
								break;

							default :
								reject( new Error( `failed removing ${pathname} as part of session folder` ) );
						}
					} else {
						resolve();
					}
				} );
			}
		}
	} );
}
