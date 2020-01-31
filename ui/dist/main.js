'use strict';

(function () {
	var scrptUrls = [
		'/socket.io/socket.io.js',
		'/dist/adapter.js',
		'/dist/RTCMultiConnection.min.js',
		'/dist/FileBufferReader.min.js',
		'/dist/debug.js',
		'/dist/DDTalk.min.js'
	];
	for(var i = 0; i < scrptUrls.length; i++){
		var s = document.createElement('script');
		s.src = scrptUrls[i];
		s.defer = true;
		s.async = false;
		document.body.appendChild(s);
	}
}());