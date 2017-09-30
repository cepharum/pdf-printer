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

const Weasy = require( "../../util/weasy" );


module.exports = function( app ) {

	/**
	 * "GET /print" converts selected online HTML document into PDF document.
	 *
	 * Supported arguments are:
	 *  `url=<url>`       selects URL of HTML document to fetch for conversion
	 *  `css[]=<cssURL>`  selects (another) CSS file by URL to include
	 *
	 * Streams back converted PDF document or some JSON object on error.
	 */
	app.get( "/print", function( req, res, next ) { // eslint-disable-line no-unused-vars
		const htmlDocumentUrl = req.query.url;
		if ( !htmlDocumentUrl ) {
			return next( Object.assign( new Error( "missing URL of page to be printed" ), { httpCode: 400 } ) );
		}

		let args = [ "-f", "pdf" ];

		const sessionFolder = req.ourSessionFolder;
		if ( sessionFolder ) {
			// include all CSS files available in session
			File.readdir( sessionFolder, ( error, entries ) => {
				if ( error ) {
					return next( Object.assign( new Error( "failed reading assets from session" ), { httpCode: 500 } ) );
				}

				_collectUploadedStylesheets( entries, args, sessionFolder );

				_print( args, req, res, htmlDocumentUrl );
			} );
		} else {
			_print( args, req, res, htmlDocumentUrl );
		}
	} );

	/**
	 * "POST /print" converts HTML document posted in request body into PDF
	 * document.
	 *
	 * Supported arguments are:
	 *  `css[]=<cssURL>`  selects (another) CSS file by URL to include
	 *
	 * Streams back converted PDF document or some JSON object on error.
	 */
	app.post( "/print", function( req, res, next ) { // eslint-disable-line no-unused-vars
		res
			.status( 200 )
			.type( "pdf" );

		let args = [ "-f", "pdf" ];

		const sessionFolder = req.ourSessionFolder;
		if ( sessionFolder ) {
			// include all CSS files available in session
			File.readdir( sessionFolder, ( error, entries ) => {
				if ( error ) {
					return next( Object.assign( new Error( "failed reading assets from session" ), { httpCode: 500 } ) );
				}

				_collectUploadedStylesheets( entries, args, sessionFolder );

				_print( args, req, res, "-", req );
			} );
		} else {
			_print( args, req, res, "-", req );
		}
	} );


	/**
	 * Commonly collects all CSS stylesheet files found in current session due
	 * to being uploaded in separate request(s) before.
	 *
	 * This method is taking names of all files found in current session's
	 * folder to extract all previously uploaded CSS files adding proper
	 * arguments for use with invoking weasyprint.
	 *
	 * @param {string[]} entries
	 * @param {string[]} args
	 * @param {string} sessionFolder
	 * @private
	 */
	function _collectUploadedStylesheets( entries, args, sessionFolder ) {
		// include all CSS files pushed in current session before
		console.log( entries );
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
