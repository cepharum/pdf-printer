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


module.exports = copyFolder;


/**
 * Copies all files and sub-folders from one location to another.
 *
 * @param {string} source path name of folder containing files to be copied
 * @param {string} destination path name of folder copying files to
 * @returns {Promise}
 */
function copyFolder( source, destination ) {
	console.log( `copy folder ${source} -> ${destination}` );

	const stats = { files: 0, folders: 0 };

	return new Promise( ( resolve, reject ) => {
		const jobs = [];

		_collectJobsInFolder( source, "", jobs, () => {
			( jobs.length ? _process : resolve )();

			/**
			 * Processes next job in queue.
			 *
			 * @private
			 */
			function _process() {
				let [ action, relPath, mode ] = jobs.shift();

				const done = jobs.length ? _process : resolve;

				switch ( action ) {
					case "mkdir" :
						File.mkdir( Path.join( destination, relPath ), mode, relPath.length ? handle : error => {
							if ( error && error.code !== "EEXIST" ) {
								reject( error );
							} else {
								done();
							}
						} );
						break;

					case "copy" :
						const src = Path.join( source, relPath );
						const dst = Path.join( destination, relPath );

						const rs = File.createReadStream( src );
						const ws = File.createWriteStream( dst, { mode } );

						rs.on( "error", handle );
						ws.on( "error", handle );

						ws.on( "finish", handle );

						rs.pipe( ws );
				}

				/**
				 * Handles result of job processed before.
				 *
				 * @param {?Error} error
				 */
				function handle( error ) {
					if ( error ) {
						reject( error );
					} else {
						action === "mkdir" ? stats.folders++ : stats.files++;

						done();
					}
				}
			}
		} );


		/**
		 * Collects jobs to process in provided folder.
		 *
		 * @param {string} src
		 * @param {string} relPath
		 * @param {array} jobs
		 * @param {function} done
		 * @private
		 */
		function _collectJobsInFolder( src, relPath, jobs, done ) {
			File.stat( src, ( error, stat ) => {
				if ( error ) {
					return reject( error );
				}

				if ( stat.isDirectory() ) {
					jobs.push( [ "mkdir", relPath, stats.mode ] );

					File.readdir( src, ( error, filenames ) => {
						if ( error ) {
							return reject( error );
						}

						( filenames.length ? _next : done )();

						/**
						 * Processes next entry of current directory.
						 *
						 * @private
						 */
						function _next() {
							let filename = filenames.shift();

							switch ( filename ) {
								case "." :
								case ".." :
									process.nextTick( filenames.length ? _next : done );
									break;

								default :
									_collectJobsInFolder( Path.join( src, filename ), Path.join( relPath, filename ), jobs, ( filenames.length ? _next : done ) );
							}
						}
					} );
				} else if ( stat.isFile() ) {
					if ( relPath === "" ) {
						return reject( new Error( "source must be folder" ) );
					}

					jobs.push( [ "copy", relPath, stat.mode, stat.uid, stat.gid ] );

					done();
				}
			} );
		}
	} )
		.then( () => {
			console.log( `copied ${stats.files} file(s) in ${stats.folders} folder(s)` );
		} );
}
