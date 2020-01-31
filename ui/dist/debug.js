'use strict';

var DEBUG = false;
if(siteConfigEnableClientSideLogs === 'true' && DEBUG === false) {
	DEBUG = true;
}

 // true - enable debug mode

function time(){ //set time format
	var d = new Date();
	var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var dateString = d.getDate()  + " " + (monthNames[d.getMonth()]) + " " + d.getFullYear() + " "
	dateString += ((d.getHours() <10) ? '0' : '') + d.getHours() + ":" + ((d.getMinutes() <10) ? '0' : '') + d.getMinutes() + ":" + ((d.getSeconds() <10) ? '0' : '') + d.getSeconds();
	var offset = d.getTimezoneOffset(), tzone = Math.abs(offset);
	tzone = (offset < 0 ? "+" : "-") + ("00" + Math.floor(tzone / 60)).slice(-2) + ":" + ("00" + (tzone % 60)).slice(-2);
	
	dateString += ', ' + tzone;
	//dateString += ' (' + Intl.DateTimeFormat().resolvedOptions().timeZone + ')';
	
	return dateString;
}

// Clear console.log
if(!DEBUG){ // hidden console log data
	if(!window.console) window.console = {};
	var method;
	var noop = function () {};
	var methods = [
		'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
		'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
		'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
		'timeStamp', 'trace', 'warn'
	];
	var length = methods.length;
	var console = (window.console = window.console || {});
 
	while (length--) {
		method = methods[length];
		// Only stub undefined methods.
		if (!console[method]) {
			console[method] = noop;
		}
	}
}
// Include timestamps in logs
/*console.logCopy = console.log.bind(console);
console.log = function(data){
	var currentDate = '[' + time() + '] ';
	this.logCopy(currentDate, data);
};*/