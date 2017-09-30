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

const { Readable, Writable } = require( "stream" );


/**
 * Streams into buffer promising all streamed data when finished.
 *
 * @property {Promise<Buffer>} asPromise promises single buffer containing all received data when stream finished
 */
class BufferWriteStream extends Writable {
	/**
	 * @param {object} options
	 */
	constructor( options = {} ) {
		options.decodeStrings = false;

		super( options );

		this._buffers = [];

		Object.defineProperty( this, "asPromise", {
			value: new Promise( ( resolve, reject ) => {
				this.on( "finish", () => resolve( Buffer.concat( this._buffers ) ) );
				this.on( "error", reject );
			} )
		} );
	}

	/**
	 * @param {string|Buffer} chunk
	 * @param {string} encoding
	 * @param {function(error:Error)} doneFn
	 * @private
	 */
	_write( chunk, encoding, doneFn ) {
		if ( typeof chunk === "string" ) {
			chunk = Buffer.from( chunk, encoding );
		}

		this._buffers.push( chunk );
		doneFn();
	}
}

/**
 * Streams from buffer in chunks of definable size.
 */
class BufferReadStream extends Readable {
	/**
	 * @param {Buffer} buffer single buffer to be streamed from.
	 * @param {int} chunkSize
	 * @param {object} options
	 */
	constructor( buffer, chunkSize = 4096, options = {} ) {
		super( options );

		this._buffer = buffer;
		this._size = chunkSize;
		this._offset = 0;
	}

	/**
	 * Streams chunk(s) from buffer.
	 *
	 * @private
	 */
	_read() {
		while ( this._offset < this._buffer.length ) {
			let start = this._offset;
			let end = start + this._size;

			const slice = this._buffer.slice( start, end );
			this._offset = end;

			if ( this.push( slice ) === false ) {
				return;
			}
		}

		// met EOB
		this.push( null );
	}
}


module.exports = {
	BufferReadStream,
	BufferWriteStream,
};
