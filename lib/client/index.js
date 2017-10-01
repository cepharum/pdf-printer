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
const { Readable } = require( "stream" );

const { BufferReadStream, BufferWriteStream } = require( "../util/buffer-stream" );

const Config = require( "./config" );


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
			apiKey: { value: apiKey ? String( apiKey ) : undefined },
		} );
	}

	/**
	 * Requests to load named profile into sesion which is created implicitly
	 * unless having started session before.
	 *
	 * @param {string} profileName
	 * @returns {Promise<Client>} promises current client providing full response from service in volatile property `response`
	 */
	loadProfile( profileName ) {
		let path = Path.posix.join( this.url.path || "/", "profile", profileName );

		let headers = {
			Accept: "application/json",
		};

		if ( this._sessionId ) {
			headers["X-Session-ID"] = this._sessionId;
		} else {
			headers["X-Start-Session"] = 1;
		}

		const request = Object.assign( {}, this.url, { path, headers, method: "GET" } );

		return new Promise( ( resolve, reject ) => {
			this._query( request, resolve, reject, false ).end();
		} );
	}

	/**
	 * Prints provided HTML code w/ optionally provided CSS code attached.
	 *
	 * @param {Readable|Buffer|string} htmlCode
	 * @param {string|string[]} cssUrl
	 * @param {boolean} closeSession
	 * @param {string} profile name of profile to load implicitly
	 * @returns {Promise<Client>} promises current client providing full response from service in volatile property `response`
	 */
	printHtmlCode( htmlCode, cssUrl = [], closeSession = true, profile = null ) {
		let path = Path.posix.join( this.url.path || "/", "print" );

		if ( typeof cssUrl === "string" ) {
			cssUrl = [cssUrl];
		} else if ( !Array.isArray( cssUrl ) ) {
			cssUrl = cssUrl ? [String( cssUrl )] : [];
		}

		let query = cssUrl.map( u => "css[]=" + encodeURIComponent( u ) );

		if ( profile ) {
			query.push( "profile=" + encodeURIComponent( profile ) );
		}

		if ( query.length ) {
			path += "?" + query.join( "&" );
		}

		let headers = {
			"Content-Type": "text/html; charset=utf8",
			Accept: "application/pdf",
		};

		if ( !this._sessionId ) {
			if ( profile ) {
				headers["X-Start-Session"] = 1;
			}
		} else {
			headers["X-Session-ID"] = this._sessionId;
			if ( closeSession ) {
				headers["X-Close-Session"] = 1;
			}
		}

		const request = Object.assign( {}, this.url, { path, headers, method: "POST" } );

		return new Promise( ( resolve, reject ) => {
			const client = this._query( request, resolve, reject, true );

			if ( htmlCode instanceof Readable ) {
				htmlCode.pipe( client );
			} else {
				if ( !Buffer.isBuffer( htmlCode ) ) {
					htmlCode = Buffer.from( htmlCode, "utf8" );
				}

				new BufferReadStream( htmlCode ).pipe( client );
			}
		} );
	}

	/**
	 * Uploads provided CSS code to service's session for use with upcoming
	 * conversions of HTML document.
	 *
	 * @param {Readable|Buffer|string} cssCode
	 * @returns {Promise<Client>} promises current client providing full response from service in volatile property `response`
	 */
	uploadCssCode( cssCode ) {
		let path = Path.posix.join( this.url.path || "/", "css" );

		let headers = {
			"Content-Type": "text/css; charset=utf8",
			Accept: "application/json",
		};

		if ( !this._sessionId ) {
			headers["X-Start-Session"] = 1;
		} else {
			headers["X-Session-ID"] = this._sessionId;
		}

		const request = Object.assign( {}, this.url, { path, headers, method: "POST" } );

		return new Promise( ( resolve, reject ) => {
			const client = this._query( request, resolve, reject, false );

			if ( cssCode instanceof Readable ) {
				cssCode.pipe( client );
			} else {
				if ( !Buffer.isBuffer( cssCode ) ) {
					cssCode = Buffer.from( cssCode, "utf8" );
				}

				new BufferReadStream( cssCode ).pipe( client );
			}
		} );
	}

	/**
	 * Queries request commonly handling selected response cases.
	 *
	 * @param {object} request
	 * @param {function(client:Client)} resolve
	 * @param {function(error:Error)} reject
	 * @param {boolean} sessionIdOptional set true if response is okay w/o session ID
	 * @returns {ClientRequest}
	 * @protected
	 */
	_query( request, resolve, reject, sessionIdOptional ) {
		const info = {
			method: request.method,
			protocol: request.protocol,
			hostname: request.hostname,
			port: parseInt( request.port ),
			path: request.path,
			headers: request.headers,
			auth: request.auth,
			timeout: request.timeout,
		};

		if ( !( info.timeout > -1 ) ) {
			info.timeout = Config.timeout;
		}

		if ( this.apiKey ) {
			info.headers["X-API-Key"] = this.apiKey;
		}

		const client = Http.request( info, response => {
			if ( response.statusCode === 200 ) {
				if ( !this._sessionId ) {
					const sessionId = response.headers["x-session-id"];
					if ( sessionId ) {
						this._sessionId = sessionId;
					} else if ( !sessionIdOptional ) {
						return reject( new Error( "missing session ID in response to successful request" ) );
					}
				}

				this.response = response;

				resolve( this );
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

		client.on( "error", reject );

		return client;
	}
};
