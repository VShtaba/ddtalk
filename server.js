// Original server modified
// RTCMultiConnection v3.6.9
// Open-Sourced: https://github.com/muaz-khan/RTCMultiConnection
// --------------------------------------------------
// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
// --------------------------------------------------

// http://127.0.0.1:9001
// http://localhost:9001

const fs = require('fs');
const path = require('path');
const url = require('url');
var httpServer = require('http');

const RTCMultiConnectionServer = require('rtcmulticonnection-server');

var PORT = 9001;
var isUseHTTPs = false;

const jsonPath = {
	config: 'config.json',
	logs: 'logs.json'
};

const BASH_COLORS_HELPER = RTCMultiConnectionServer.BASH_COLORS_HELPER;
const getValuesFromConfigJson = RTCMultiConnectionServer.getValuesFromConfigJson;
const getBashParameters = RTCMultiConnectionServer.getBashParameters;
const resolveURL = RTCMultiConnectionServer.resolveURL;
const pushLogs = RTCMultiConnectionServer.pushLogs; //#add

var config = getValuesFromConfigJson(jsonPath);
config = getBashParameters(config, BASH_COLORS_HELPER);

// if user didn't modifed "PORT" object
// then read value from "config.json"
if(PORT === 9001) {
	PORT = config.port;
}
if(isUseHTTPs === false) {
	isUseHTTPs = (config.isUseHTTPs) ? true : false;
}

function ResponseHeaders (request, contentType = 'text/plain', file = '') { //#add
	
	//If you use NodeJS without a proxy, here you can configure Content Security Policy Presentations
	
	if( (contentType == 'image/png' || contentType == 'image/jpg') && file.length > 0) {
		return {
			'Content-Type': contentType,
			'Content-Length': file.length,
			'Accept-Ranges': 'bytes'
		}
	} else {
		return {
			'Content-Type': contentType
		}
	}
	;
} 

function getFromFile(path) {
    var output = {};
    try {
        var json = fs.readFileSync(path,'utf-8');
        output = JSON.parse(json);
    }
    catch(e) {
        output = {};
    }
    return output;
}
var siteConfig = getFromFile('./site-config.json');
// #end add

function serverHandler(request, response) {
	// to make sure we always get valid info from json file
	// even if external codes are overriding it
	config = getValuesFromConfigJson(jsonPath);
	config = getBashParameters(config, BASH_COLORS_HELPER);
	
	// HTTP_GET handling code goes below
	try {
		var uri, filename;
		try {
			if (!config.dirPath || !config.dirPath.length) {
				config.dirPath = null;
			}

			uri = url.parse(request.url).pathname;
			
			if(uri.indexOf(resolveURL('/node_modules/')) !== -1) { //## add for download scr from node_modules dir
				filename = path.join(process.cwd(), uri);
			} else { //##
				filename = path.join(config.dirPath ? resolveURL(config.dirPath) : process.cwd(), uri);
			} //## end add
		
		} catch (e) {
			pushLogs(config, 'url.parse', e);
		}
		
		filename = (filename || '').toString();

		if (request.method !== 'GET' || uri.indexOf('..') !== -1) {
			try {
				response.writeHead(401, ResponseHeaders(request, 'text/plain')); // #change
				response.write('401 Unauthorized: ' + path.join('/', uri) + '\n');
				response.end();
				return;
			} catch (e) {
				pushLogs(config, '!GET or ..', e);
			}
		}

		if(filename.indexOf(resolveURL('/admin/')) !== -1 && config.enableAdmin !== true) {
			try {
				response.writeHead(401, ResponseHeaders(request, 'text/plain')); // #change
				response.write('401 Unauthorized: ' + path.join('/', uri) + '\n');
				response.end();
				return;
			} catch (e) {
				pushLogs(config, '!GET or ..', e);
			}
			return;
		}

		var matched = false;
		['/demos/', '/dev/', '/dist/', '/socket.io/', '/node_modules/canvas-designer/', '/admin/'].forEach(function(item) {
			if (filename.indexOf(resolveURL(item)) !== -1) {
				matched = true;
			}
		});

		// files from node_modules
		['RecordRTC.js', 'RecordRTC.min.js', 'FileBufferReader.js', 'FileBufferReader.min.js', 'getStats.js', 'getStats.min.js', 'adapter.js', 'MultiStreamsMixer.js'].forEach(function(item) {
			if (filename.indexOf(resolveURL('/node_modules/')) !== -1 && filename.indexOf(resolveURL(item)) !== -1) {
				matched = true;
			}
		});

		if (filename.search(/.js|.json/g) !== -1 && !matched) {
			try {
				response.writeHead(404, ResponseHeaders(request, 'text/plain')); // #change
				response.write('404 Not Found: ' + path.join('/', uri) + '\n');
				response.end();
				return;
			} catch (e) {
				pushLogs(config, '404 Not Found', e);
			}
		}

		['Video-Broadcasting', 'Screen-Sharing', 'Switch-Cameras'].forEach(function(fname) {
			try {
				if (filename.indexOf(fname + '.html') !== -1) {
					filename = filename.replace(fname + '.html', fname.toLowerCase() + '.html');
				}
			} catch (e) {
				pushLogs(config, 'forEach', e);
			}
		});

		var stats;

		try {
			stats = fs.lstatSync(filename);

			if (filename.search(/demos/g) === -1 && filename.search(/admin/g) === -1 && stats.isDirectory() && config.homePage === '/demos/index.html') {
				if (response.redirect) {
					response.redirect('/demos/');
				} else {
					response.writeHead(301, {
						'Location': '/demos/'
					});
				}
				response.end();
				return;
			}
		} catch (e) {
			response.writeHead(404, ResponseHeaders(request, 'text/plain')); // #change
			response.write('404 Not Found: ' + path.join('/', uri) + '\n');
			response.end();
			return;
		}

		try {
			if (fs.statSync(filename).isDirectory()) {
				response.writeHead(404, ResponseHeaders(request, 'text/html')); // #change

				if (filename.indexOf(resolveURL('/admin/')) !== -1) {
					filename = filename.replace(resolveURL('/admin/'), '');
					filename += resolveURL('/admin/index.html');
				} else if (filename.indexOf(resolveURL('/demos')) !== -1) {
					filename = filename.replace(resolveURL('/demos/'), '');
					filename = filename.replace(resolveURL('/demos'), '');
					filename += resolveURL('/demos/index.html');
				} else {
					filename += resolveURL(config.homePage);
				}
			}
		} catch (e) {
			pushLogs(config, 'statSync.isDirectory', e);
		}

		var contentType = 'text/plain';
		if (filename.toLowerCase().indexOf('.html') !== -1) {
			contentType = 'text/html';
		}
		if (filename.toLowerCase().indexOf('.css') !== -1) {
			contentType = 'text/css';
		}
		if (filename.toLowerCase().indexOf('.png') !== -1) {
			contentType = 'image/png';
		}
		//## add
		if (filename.toLowerCase().indexOf('.jpg') !== -1) {
			contentType = 'image/jpg';
		}
		if (filename.toLowerCase().indexOf('.js') !== -1) {
			contentType = 'text/javascript';
		}
		if (filename.toLowerCase().indexOf('.ico') !== -1) {
			contentType = 'image/x-icon';
		}// ## end add 
		
		fs.readFile(filename, 'binary', function(err, file) {
			if (err) {
				response.writeHead(500, ResponseHeaders(request, 'text/plain')); // #change
				response.write('404 Not Found: ' + path.join('/', uri) + '\n');
				response.end();
				return;
			}
			
			try {
				file = file.replace('connection.socketURL = \'/\';', 'connection.socketURL = \'' + config.socketURL + '\';');
			} catch (e) {}
			
			try {
				// add
				// for <!-- OPEN GRAPH META -->
				var protocol = (siteConfig.isUseProxyHTTPs || isUseHTTPs) ? 'https' : 'http';
				var host = request.headers['host'];
				var siteURL = protocol + '://'+ host;
				var dir		= siteConfig.imgDir;
				var imgURL = protocol + '://'+ host + '/' + dir;
				
				file = file.replace(/\$OG_TITLE/g, siteConfig.title);
				file = file.replace(/\$OG_DESCRIPTION/g, siteConfig.descriptionText);
				file = file.replace(/\$OG_IMAGE_1/g, imgURL + siteConfig.imgForShare1);
				file = file.replace(/\$OG_IMAGE_2/g, imgURL + siteConfig.imgForShare2);
				file = file.replace(/\$OG_IMAGE_3/g, imgURL + siteConfig.imgForShare3);
				file = file.replace(/\$OG_SITE_NAME/g, siteConfig.siteName);
				file = file.replace(/\$OG_URL/g, siteURL);
				file = file.replace(/\$OG_TYPE/g, siteConfig.ogType);
			} catch (e) {}
			
			try {
				file = file.replace(/\$DEBUG_CLIENT_SIDE_LOGS_ENABLE/g, siteConfig.enableClientSideLogs);
				file = file.replace(/\$TURN_USER/g, siteConfig.TURNUser);
				file = file.replace(/\$TURN_CREDENTIAL/g, siteConfig.TURNCredential);
				file = file.replace(/\$TURN_ADRESS/g, siteConfig.TURNAdress);
				file = file.replace(/\$STUN_ADRESS/g, siteConfig.STUNAdress);
				file = file.replace(/\$ENABLE_RECORD_VIDEO/g, siteConfig.EnableRecordVideo);
				
			} catch (e) {}
			// # end add
			
			response.writeHead(200, ResponseHeaders(request, contentType, file)); // #change
			response.write(file, 'binary');
			response.end();
		});
	} catch (e) {
		pushLogs(config, 'Unexpected', e);

		response.writeHead(404, ResponseHeaders(request, 'text/plain')); // #change

		response.write('404 Not Found: Unexpected error.\n' + e.message + '\n\n' + e.stack);
		response.end();
	}
}

var httpApp;
if (isUseHTTPs) {
	
	//# add
	if (process.cwd().indexOf(resolveURL('ddtalk-dev')) == -1){//disable for developer mode
		//for Let’s Encrypt webroot HTTP mechanisms authorisation for certificate renewal
		//and auto Redirect from http port 80 to https 443
		
		var http = require('http');
		http.createServer(function (req, res) {
			var requri = url.parse(req.url).pathname;
			var reqfilename = process.cwd() + requri;
			
			if(requri.indexOf(resolveURL('/.well-known/acme-challenge/')) !== -1){
				// if run command in console:
				// $ sudo certbot certonly --webroot --webroot-path /home/ddadmin/ddtalk -d ddtalk.donbassdialog.org.ua -d ddtalk.online-dialogue.org -d talk.donbassdialog.org.ua -d chat.donbassdialog.org.ua
				// After create tempoprary file web server waiting verification request from Let\'s Encrypt
				// For recive test request use --dry-run 

				fs.readFile(reqfilename, function(err, data){
					if(err){
						res.writeHead(404, {'Content-Type': 'text/html'});
						res.write("<h2>Let's Encrypt file Not Found in --webroot-path!</h2><br>certbot certonly --webroot --webroot-path /var/www/example -d www.example.com -d example.com<br><br> Request url: " + requri);
						res.end();
						//console.log(Date(), '\nLet\'s Encrypt request. But file not found. Maybe an access problem?\n');
					
					} else {
						res.writeHead(200, {'Content-Type': 'text/plain'});
						res.write(data);
						res.end();
						//console.log(Date(),'\n!!!!Let\'s Encrypt Request url: ' + requri);
					}
				});
			} else {//Automatic HTTPS redirect 
				res.writeHead(301, { "Location": "https://" + resolveURL(req.headers.host) + resolveURL(req.url) });
				res.end();
			}
		}).listen(80);
	} // end add

	httpServer = require('https');

	// See how to use a valid certificate:
	// https://github.com/muaz-khan/WebRTC-Experiment/issues/62
	var options = {
		key: null,
		cert: null,
		ca: null
	};

	var pfx = false;

	if (!fs.existsSync(config.sslKey)) {
		console.log(BASH_COLORS_HELPER.getRedFG(), 'sslKey:\t ' + config.sslKey + ' does not exist.');
	} else {
		pfx = config.sslKey.indexOf('.pfx') !== -1;
		options.key = fs.readFileSync(config.sslKey);
	}

	if (!fs.existsSync(config.sslCert)) {
		console.log(BASH_COLORS_HELPER.getRedFG(), 'sslCert:\t ' + config.sslCert + ' does not exist.');
	} else {
		options.cert = fs.readFileSync(config.sslCert);
	}

	if (config.sslCabundle) {
		if (!fs.existsSync(config.sslCabundle)) {
			console.log(BASH_COLORS_HELPER.getRedFG(), 'sslCabundle:\t ' + config.sslCabundle + ' does not exist.');
		}

		options.ca = fs.readFileSync(config.sslCabundle);
	}

	if (pfx === true) {
		options = {
			pfx: sslKey
		};
	}
	
	// #add desable old TLS v1
	//const { constants } = require('crypto');
	//options.secureOptions = constants.SSL_OP_NO_TLSv1;

	httpApp = httpServer.createServer(options, serverHandler);
} else {
	httpApp = httpServer.createServer(serverHandler);
}

RTCMultiConnectionServer.beforeHttpListen(httpApp, config);
httpApp = httpApp.listen(process.env.PORT || PORT, process.env.IP || "0.0.0.0", function() {
	RTCMultiConnectionServer.afterHttpListen(httpApp, config);
});

// --------------------------
// socket.io codes goes below

//# add
// and add parameter processing in the file /home/ddadmin/sandbox/ddtalk-dev/node_modules/rtcmulticonnection-server/node_scripts/get-values-from-config-json.js
const ioServer = require('socket.io')();
if (siteConfig.ioServerOrigins && siteConfig.ioServerOrigins.length) {
	var originHosts = (siteConfig.ioServerOrigins || '').toString();
	ioServer.origins(originHosts); //comma separated list: ['https://video-chat.example-1.org:9001', 'https://video-chat.example-2.org:443']
	//console.log('From siteConfig.json io Server Origins: ', originHosts);
}
ioServer.attach(httpApp, { 
  //pingInterval: 60000, //60000 ms (60 sec)
  //pingTimeout: 10000, //25000 ms (25 sec)
  cookie: false
}); // #add end
ioServer.on('connection', function(socket) {
	RTCMultiConnectionServer.addSocket(socket, config);

	// ----------------------
	// below code is optional

	const params = socket.handshake.query;

	if (!params.socketCustomEvent) {
		params.socketCustomEvent = 'custom-message';
	}

	socket.on(params.socketCustomEvent, function(message) {
		socket.broadcast.emit(params.socketCustomEvent, message);
	});
});
