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

const Profile = require( "../../util/profile" );
const Weasy = require( "../../util/weasy" );


module.exports = function( app ) {

	/**
	 * "GET /print" converts selected online HTML document into PDF document.
	 *
	 * Supported arguments are:
	 *  `url=<url>`       selects URL of HTML document to fetch for conversion
	 *  `css[]=<cssURL>`  selects (another) CSS file by URL to include
	 *  `profile=<name>`  selects profile to load implicitly
	 *
	 * Streams back converted PDF document or some JSON object on error.
	 */
	app.get( "/print", function( req, res, next ) {
		const htmlDocumentUrl = req.query.url;
		if ( !htmlDocumentUrl ) {
			return next( Object.assign( new Error( "missing URL of page to be printed" ), { httpCode: 400 } ) );
		}

		_process( req, res, next, htmlDocumentUrl );
	} );

	/**
	 * "POST /print" converts HTML document posted in request body into PDF
	 * document.
	 *
	 * Supported arguments are:
	 *  `css[]=<cssURL>`  selects (another) CSS file by URL to include
	 *  `profile=<name>`  selects profile to load implicitly
	 *
	 * Streams back converted PDF document or some JSON object on error.
	 */
	app.post( "/print", function( req, res, next ) {
		_process( req, res, next, "-", req );
	} );

	/**
	 * Commonly processes requests for printing either remote URL or some posted
	 * HTML code.
	 *
	 * @param {IncomingMessage} req
	 * @param {ServerResponse} res
	 * @param {function(error:Error=)} next
	 * @param {string} source
	 * @param {?Readable} input
	 * @private
	 */
	function _process( req, res, next, source, input = null ) {
		let args = [ "-f", "pdf" ];

		const sessionFolder = req.ourSessionFolder;
		if ( sessionFolder ) {
			args.push( "--base-url" );
			args.push( sessionFolder );

			let promise;

			if ( req.query.profile ) {
				promise = Profile.load( req.query.profile, sessionFolder );
			} else {
				promise = Promise.resolve();
			}

			promise.then( function() {
				// include all CSS files available in session
				File.readdir( sessionFolder, ( error, entries ) => {
					if ( error ) {
						return next( Object.assign( new Error( "failed reading assets from session" ), { httpCode: 500 } ) );
					}


					let length = entries.length;
					let cssFiles = new Array( length );
					let write = 0;

					for ( let i = 0; i < length; i++ ) {
						const entry = entries[i];

						if ( /\.css$/.test( entry ) ) {
							cssFiles[write++] = entry;
						}
					}

					cssFiles.splice( write, length - write );
					cssFiles.sort();

					for ( let i = 0; i < write; i++ ) {
						args.push( "-s" );
						args.push( Path.join( sessionFolder, cssFiles[i] ) );
					}


					_print( args, req, res, source, input );
				} );
			}, error => next( error ) );
		} else if ( req.query.profile ) {
			next( Object.assign( new Error( "missing session for loading profile" ), { httpCode: 400 } ) );
		} else {
			_print( args, req, res, source, input );
		}
	}

	/**
	 * Continues request processing after some optional asynchronous task.
	 *
	 * @param {string[]} args
	 * @param {IncomingMessage} req
	 * @param {ServerResponse} res
	 * @param {string} source
	 * @param {Readable} data
	 * @private
	 */
	function _print( args, req, res, source, data = null ) {
		const styles = req.query.css;
		if ( Array.isArray( styles ) ) {
			for ( let i = 0, length = styles.length; i < length; i++ ) {
				args.push( "-s" );
				args.push( styles[i] );
			}
		}

		args.push( source );
		args.push( "-" );

		res
			.status( 200 )
			.type( "pdf" )
			.set( "content-disposition", `attachment; filename=${( req.query.name || "printed" ).replace( /[ a-z0-9_.-]/i, "" )}.pdf` );

		console.log( `converting from ${source} with arguments ${args.join( " " )}` );

		Weasy.run( args, data, res )
			.then( () => {
				res.end();
			} );
	}

};
