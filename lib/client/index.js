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
const Http = require( "http" );
const Url = require( "url" );

const { BufferReadStream, BufferWriteStream } = require( "../util/buffer-stream" );


/**
 *
 * @type {Client}
 * @name Client
 */
module.exports = class Client {
	/**
	 * @param {object} serviceUrl
	 * @param {string} apiKey
	 */
	constructor( serviceUrl, apiKey ) {
		Object.defineProperties( this, {
			url: { value: Url.parse( serviceUrl ) },
			apiKey: { value: String( apiKey ) },
		} );
	}

	/**
	 * Prints provided HTML code w/ optionally provided CSS code attached.
	 *
	 * @param {string} htmlCode
	 * @param {string|string[]} cssUrl
	 * @returns {Promise<Readable>} promises stream providing printed PDF
	 */
	printHtmlCode( htmlCode, cssUrl = [] ) {
		let path = Path.posix.join( this.url.path || "/", "/print" );

		if ( typeof cssUrl === "string" ) {
			cssUrl = [cssUrl];
		}

		cssUrl = cssUrl.map( u => "css[]=" + decodeURIComponent( u ) ).join( "&" );
		if ( cssUrl.length ) {
			path += "?" + cssUrl;
		}

		const url = Object.assign( {}, this.url, {
			timeout: 2000,
			path,
			headers: {
				"Content-Type": "text/html; charset=utf8",
				Accept: "application/pdf",
				"X-API-Key": this.apiKey,
			},
			method: "POST",
		} );

		return new Promise( ( resolve, reject ) => {
			const request = Http.request( url, response => {
				if ( response.statusCode === 200 ) {
					resolve( response );
				} else {
					// read whole answer to try getting JSON-encoded response
					const answer = new BufferWriteStream();
					response.pipe( answer );
					answer.asPromise
						.then( info => {
							info = JSON.parse( info.toString( "utf8" ) );
							reject( new Error( `request for printing HTML returned ${response.statusCode}: ${info.error || "no details on error provided"}` ) );
						}, reject );
				}
			} );

			if ( !Buffer.isBuffer( htmlCode ) ) {
				htmlCode = Buffer.from( htmlCode, "utf8" );
			}

			new BufferReadStream( htmlCode ).pipe( request );
		} );
	}
};
