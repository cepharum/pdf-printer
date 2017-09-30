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
const Crypt = require( "crypto" );


module.exports = createFolder;


/**
 * Creates folder with random name in context of provided folder.
 *
 * @param {string} containerPathName path name of folder to contain created one
 * @returns {Promise<{pathName:string, folderName:string}>}
 */
function createFolder( containerPathName ) {
	return new Promise( ( resolve, reject ) => {
		_try();

		/**
		 * Tries to create sub-folder with random name in selected folder.
		 *
		 * @private
		 */
		function _try() {
			Crypt.randomBytes( 16, ( error, bytes ) => {
				if ( error ) {
					return reject( Object.assign( new Error( "failed generating random session ID" ), { httpCode: 500 } ) );
				}

				const subFolder = bytes.toString( "hex" );

				const pathName = Path.join( containerPathName, subFolder );
				File.mkdir( pathName, error => {
					if ( error ) {
						if ( error.code === "EEXIST" ) {
							// got a collision -> try another name
							process.nextTick( _try );
						} else {
							return reject( Object.assign( new Error( "creating session storage failed" ), { httpCode: 500 } ) );
						}
					} else {
						resolve( {
							pathName: pathName,
							folderName: subFolder,
						} );
					}
				} );
			} );
		}
	} );
}
