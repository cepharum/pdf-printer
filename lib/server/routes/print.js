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

const Weasy = require( "../../util/weasy" );


module.exports = function( app ) {

	app.get( "/print", function( req, res, next ) { // eslint-disable-line no-unused-vars
		if ( !req.query.url ) {
			return next( Object.assign( new Error( "missing URL of page to be printed" ), { httpCode: 400 } ) );
		}

		res
			.status( 200 )
			.type( "pdf" )
			.set( "content-disposition", "attachment; filename=printed.pdf");

		let args = [ "-f", "pdf" ];

		const styles = req.query.css;
		if ( Array.isArray( styles ) ) {
			for ( let i = 0, length = styles.length; i < length; i++ ) {
				args.push( "-s" );
				args.push( styles[i] );
			}
		}

		args.push( req.query.url );
		args.push( "-" );

		Weasy.run( args, null, res )
			.then( () => {
				res.end();
			} );
	} );

	app.post( "/print", function( req, res, next ) { // eslint-disable-line no-unused-vars
		res
			.status( 200 )
			.type( "pdf" );

		let args = [ "-f", "pdf" ];

		const styles = req.query.css;
		if ( Array.isArray( styles ) ) {
			for ( let i = 0, length = styles.length; i < length; i++ ) {
				args.push( "-s" );
				args.push( styles[i] );
			}
		}

		args.push( "-" );
		args.push( "-" );

		req.resume();

		Weasy.run( args, req, res )
			.then( () => {
				res.end();
			} );
	} );

};
