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


module.exports = createFile;


/**
 * Creates file with random name in context of provided folder.
 *
 * @param {string} containerPathName path name of folder to contain created one
 * @param {string} extension extension to append optionally
 * @returns {Promise<Writable>}
 */
function createFile( containerPathName, extension ) {
	return new Promise( ( resolve, reject ) => {
		_try();

		/**
		 * Tries to create file with random name in selected folder.
		 *
		 * @private
		 */
		function _try() {
			File.readdir( containerPathName, ( error, entries ) => {
				if ( error ) {
					return reject( Object.assign( new Error( "failed generating random session ID" ), { httpCode: 500 } ) );
				}

				let found = 0;

				for ( let i = 0, length = entries.length; i < length; i++ ) {
					let name = entries[i];

					if ( name[0] !== "." && name.slice( -extension.length ) === extension ) {
						found++;
					}
				}

				const pathName = Path.join( containerPathName, String( "000" + ++found ).slice( -4 ) + extension.replace( /\.\./g, "" ) );

				try {
					resolve( File.createWriteStream( pathName, {
						flags: "wx+",
						mode: "0600",
					} ) );
				} catch ( error ) {
					if ( error.code === "EEXIST" ) {
						// got a collision -> try another name
						process.nextTick( _try );
					} else {
						return reject( Object.assign( new Error( "creating session storage failed" ), { httpCode: 500 } ) );
					}
				}
			} );
		}
	} );
}
