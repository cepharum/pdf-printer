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

const CreateFolder = require( "../../util/create-folder" );
const RemoveFolder = require( "../../util/remove-folder" );



/**
 * Implements filter rejecting any request due to lack of working weasyprint
 * installation.
 *
 * Sessions are supported by filling certain fields of request header:
 *
 * * **X-Start-Session** can be used to start new session. It results in a
 *   response header field **X-Session-ID** providing new session's ID.
 * * **X-Session-ID** must be used to address previously created session in
 *   succeeding requests.
 * * **X-Close-Session** can be included with any session-related request to
 *   close session resulting in dropping its related folder and all contained
 *   files and folders recursively.
 *
 * @note In opposition to **X-Close-Session** _requiring_ additional provision
 *       of **X-Session-ID** there _mustn't_ be any **X-Session-ID** in request
 *       header when trying to start new session using **X-Start-Session**.
 *
 * @param {object} app
 */
module.exports = function( app ) {
	app.use( function( req, res, next ) {
		req.ourSessionFolder = null;

		// always validate any session ID included with an incoming request
		const sessionId = ( req.get( "x-session-id" ) || "" ).replace( /[\s/.]+/g, "" );
		if ( sessionId ) {
			const pathName = Path.join( req.ourTempFolder, sessionId );

			File.stat( pathName, ( error, stat ) => {
				if ( error || !stat.isDirectory() ) {
					return next( Object.assign( new Error( "invalid session ID rejected" ), { httpCode: 403 } ) );
				}

				if ( req.get( "x-close-session" ) ) {
					const origFn = res.end;

					res.end = function() {
						if ( res._closedSession ) {
							return origFn.apply( res, arguments );
						}

						res._closedSession = true;

						RemoveFolder( pathName )
							.then( () => {
								console.log( `closed session ${sessionId}` );

								origFn.apply( res, arguments );
							}, () => {
								console.log( `failed removing data of session ${sessionId}` );

								origFn.apply( res, arguments );
							} );
					};
				}

				req.ourSessionFolder = pathName;

				next();
			} );
		} else {
			// there was no session ID in current header

			if ( req.get( "x-start-session" ) ) {
				// start new session on demand
				return CreateFolder( req.ourTempFolder )
					.then( ( { pathName, folderName } ) => {
						req.ourSessionFolder = pathName;
						res.set( "X-Session-ID", folderName );

						console.log( `started new session in ${pathName}` );

						next();
					}, next );
			}

			next();
		}
	} );
};
