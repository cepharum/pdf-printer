# PDF Printer

HTTP service wrapping [WeasyPrint](http://weasyprint.org/) including client library

## Installation

### Server

Running server is supported out-of-the-box using docker. Of course, it doesn't rely on docker and you might set it up on any sort of server you like.

    docker build https://github.com/cepharum/pdf-printer.git

### Client

    npm i pdf-printer

The client is exposed as API of this package. Thus using it is as simple as this:

```javascript
const Client = require( "pdf-printer" );

new Client( "http://server.foo.com:12345", "myApiKey" )
	.printHtmlCode( "<html><body>Hello World!</body></html>" )
	.then( client => client.response.pipe( process.stdout ) );
```

See the [examples](examples) folder for additional code examples.

