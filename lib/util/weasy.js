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

const Child = require( "child_process" );

const { BufferReadStream, BufferWriteStream } = require( "../util/buffer-stream" );


/**
 * @typedef {object} ChildProcessResult
 * @property {int} code exit code of child process
 * @property {?Buffer} stdout buffer containing stdout of child process
 * @property {Buffer} stderr buffer containing stderr of child process
 */

/**
 * Runs weasyprint executable in a child process.
 *
 * @param {string[]} args arguments to be passed on invoking child process
 * @param {Buffer|Readable} input stream or buffer to provide on child's stdin
 * @param {true|Writable} output stream to capture output passed on stdout
 * @returns {Promise<ChildProcessResult>}
 */
module.exports.run = function( args = [], input = null, output = null ) {

	const child = Child.spawn( "weasyprint", args, {
		env: process.env,
		shell: true,
	} );

	return new Promise( ( resolve, reject ) => {
		if ( input instanceof Readable ) {
			input.pipe( child.stdin );
		} else if ( Buffer.isBuffer( input ) ) {
			new BufferReadStream( input ).pipe( child.stdin );
		}

		let stdout = null;

		if ( output instanceof Writable ) {
			child.stdout.pipe( output );
		} else if ( output === true ) {
			stdout = new BufferWriteStream();
			child.stdout.pipe( stdout );
		}

		const stderr = new BufferWriteStream();

		child.on( "exit", code => {
			Promise.all( [
				stdout ? stdout.asPromise : null,
				stderr
			] )
				.then( ( [ stdout, stderr ] ) => {
					( code ? reject : resolve )( {
						code: code || 0,
						stdout,
						stderr,
					} );
				} );
		} );
	} );
};
