'use strict';
// Last time updated: 2020-01-30 7:59:35 PM UTC
// DDTalk - v20.01.9 Author: DDP URL: https://online-dialogue.org 

// _________________________


(function(options){
var DDTalkVersionNumber = '20.01.9';

 // Source: ui/dev/connect-rtcmulticonnection.js
window.enableAdapter = true; // enable adapter.js
var connection = new RTCMultiConnection(); // Activating the RTCMultiConnection library
connection.autoCloseEntireSession = false; //False - so that the created room does not turn off when the initiator exits.  Any participants can become the owner of the room.

connection.socketURL = '/'; // socketURL" MUST end with a slash '/' 
//connection.sdpSemantics = 'unified-plan'; //'plan-b' or 'unified-plan'

connection.enableLogs = DEBUG; // DEBUG setup in index.html

DEBUG && console.info('Version RTCMultiConnection: ', connection.version);

connection.session = {
	audio: true,
	video: true,
	data: true
};

/* --/////-- */
 // Source: ui/dev/room-controls.js
// ......................................................
// ......................Handling Room-ID................
// ......................................................

var mess = '';
var statusBoxUI = document.getElementById('status-box');
var statusContentUI = document.getElementById('status-content');

function statusHeaderHandler(mess, interval, color) {
	interval = interval || 0;

	if (!mess || mess.length == 0) {
		statusContentUI.innerHTML = '';
		statusBoxUI.style.display = 'none';

		if (typeof Resize != 'undefined') Resize();
	} else {
		if (document.fullscreenElement) document.exitFullscreen(); //disable full-screen

		statusContentUI.style.color = color || 'black';
		statusContentUI.innerHTML = '' + mess + '';
		statusBoxUI.style.display = '';

		if (typeof Resize != 'undefined') Resize();

		if (interval > 0) {
			setTimeout(function() {
				statusContentUI.innerHTML = '';
				statusBoxUI.style.display = 'none';
				mess = '';
				if (typeof Resize != 'undefined') Resize();
			}, interval);
		} else {
			if (typeof Resize != 'undefined') Resize();
		}
	}
}


//check URL params
(function() { //Getting parameters from URL
	var params = {},
		r = /([^&=]+)=?([^&]*)/g;

	function d(s) {
		return decodeURIComponent(s.replace(/\+/g, ' '));
	}
	var match, search = window.location.search;
	while (match = r.exec(search.substring(1)))
		params[d(match[1])] = d(match[2]);
	window.params = params;
})();

var isClearlocalStorage = (params.cs == 'true') ? true : false;
if (isClearlocalStorage == true) {
	ClearlocalStorage();
}

function ClearlocalStorage() {
	localStorage.clear();
	sessionStorage.clear();
	var rUrl = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname;
	window.location.href = rUrl;
}

var roomid;
if (params.roomid) roomid = params.roomid.replace(/[^а-яА-ЯёЁA-Za-z0-9]+/g, ''); // roomid - parameter from URL replaces user settings. 
if (!roomid && localStorage.getItem('roomid')) {
	roomid = localStorage.getItem('roomid').replace(/[^а-яА-ЯёЁA-Za-z0-9]+/g, '');
} else if (!roomid && !localStorage.getItem('roomid')) {
	roomid = randomString() + randomString();
}

function randomString() {
	return (Math.random() * new Date().getTime()).toString(36).replace(/\./g, '');
}

document.getElementById('room-id').value = roomid;
localStorage.setItem('roomid', roomid);

document.getElementById('room-id').onkeyup = function(e) {
	this.value = this.value.replace(/[^а-яА-ЯёЁA-Za-z0-9]+/g, ''); // removing trailing/leading whitespace
	if (!this.value.length) {
		document.getElementById('open-or-join-room').disabled = true;
	} else {
		document.getElementById('open-or-join-room').disabled = false;
	}
	if (this.value) {
		localStorage.setItem('roomid', this.value);
		roomid = this.value;

		reSetRoomLinks();

		if (connection.streamEvents.selectAll().length != 0 || connection.getAllParticipants() != 0) location.reload();
	}
};

//Change the Room ID's
document.getElementById('ChangeRoomID').onclick = function() {
	roomid = document.getElementById('room-id').value = randomString() + randomString();
	localStorage.setItem('roomid', roomid);

	reSetRoomLinks();

	if (connection.streamEvents.selectAll().length != 0 || connection.getAllParticipants() != 0) location.reload();
}


var isView = (params.isview === 'true') ? true : false;
var isAdmin = (params.admin === 'true') ? true : false;
var autoStart = (params.autostart === 'true') ? true : false;
var soundOff = (params.soundoff === 'true') ? true : false;
if (soundOff === true) {
	document.getElementById('sound-off').style.display = '';
}
if (params.quality) {
	params.quality = params.quality.replace(/[^а-яА-ЯёЁA-Za-z0-9]+/g, '');
}
if (params.bandwidth) {
	params.bandwidth = params.bandwidth.replace(/[^а-яА-ЯёЁA-Za-z0-9]+/g, '');
}




var enableViewers = false;
enableViewers = (localStorage.getItem('addViewers') == 'true') ? true : false;
var enableViewersHTML = document.getElementById('enableviewers');
var viewersControlHTML = document.getElementById('viewers-control');
enableViewersHTML.checked = enableViewers;
enableViewersHTML.onchange = function() {
	enableViewers = this.checked;
	enableViewersHandler();
}

function enableViewersHandler() {
	enableViewersHTML.checked = enableViewers;
	localStorage.setItem('addViewers', enableViewers);

	if (enableViewers || isAdmin) {
		viewersControlHTML.style.display = 'inline';
		document.getElementById('view-number-panel').style.display = '';
	} else {
		viewersControlHTML.style.display = 'none';
		document.getElementById('view-number-panel').style.display = 'none';
	}

	if (connection.streamEvents.selectAll().length > 0) Resize();

	connection.extra.viewerEnableStatus = enableViewers;
	if (connection.extra.roomInitiator) connection.updateExtraData();

	connection.getAllParticipants().forEach(function(pid) { // for broadcasters disable viewer
		if (!connection.extra.broadcaster === true) return;
		if (!connection.peers[pid].extra.viewer === true) return;

		if (!enableViewers) {
			connection.disconnectWith(pid);
		}
	});
}



var enableAdmins = (localStorage.getItem('addAdmins') == 'true') ? true : false;
var enableAdminsHTML = document.getElementById('enable-admins');
var adminsControlHTML = document.getElementById('admin-url');
enableAdminsHTML.checked = enableAdmins;
enableAdminsHTML.onchange = function() {
	enableAdmins = this.checked;
	enableAdminsHandler();
}

function enableAdminsHandler() {
	enableAdminsHTML.checked = enableAdmins;
	localStorage.setItem('addAdmins', enableAdmins);

	if (enableAdmins || isAdmin) {
		adminsControlHTML.style.display = 'inline';
		document.getElementById('admin-number-panel').style.display = '';
	} else {
		adminsControlHTML.style.display = 'none';
		document.getElementById('admin-number-panel').style.display = 'none';
	}

	connection.extra.adminEnableStatus = enableAdmins;
	if (connection.extra.roomInitiator) connection.updateExtraData();
}


var webcamSwitchStatus = false;
var webcamSwitch = document.getElementById('webcam');
var webcamSwitchOff = document.getElementById('webcam-off');

webcamSwitch.onclick = function() {
	webcamSwitchStatus = true;
	webcamSwitchHandler();
}
webcamSwitchOff.onclick = function() {
	webcamSwitchStatus = false;
	webcamSwitchHandler();
}

function webcamSwitchHandler() {
	if (cameraPermission) {
		if (webcamSwitchStatus) {
			webcamSwitch.style.display = 'none';
			webcamSwitchOff.style.display = '';
			selectStreamQuality.value = 'OFF';
			selectStreamQuality.onchange();
		} else {
			webcamSwitch.style.display = '';
			webcamSwitchOff.style.display = 'none';

			selectStreamQuality.value = 'NL';
			selectStreamQuality.onchange();
		}
	} else {
		webcamSwitch.style.display = 'none';
		webcamSwitchOff.style.display = '';
	}
}


var walkieTalkieModeEnable = (params.togglemic == 'true') ? true : false; //spacebar toggle on local microphone
walkieTalkieModeEnable = (sessionStorage.getItem('walkieTalkieModeEnable') == 'true') ? true : false;
var micHTML = document.getElementById('mic');
micHTML.src = (walkieTalkieModeEnable) ? 'mic-off.png' : 'mic-on.png';
micHTML.onclick = function() {
	if (!walkieTalkieModeEnable) {
		walkieTalkieModeEnable = true;
	} else {
		walkieTalkieModeEnable = false;
	}
	SpacebarToggleLocalMicrophone();
}

var spacebarPressed = false;
window.addEventListener('keydown', function(e) {
	if (e.keyCode == 32) {
		//DEBUG && console.log(e);
		//e.preventDefault();
		if (document.activeElement.id != 'input-text-chat') {
			SpacebarToggleLocalMicrophone(true);
			spacebarPressed = true;
		}
	}
}, true);
window.addEventListener('keyup', function(e) {
	if (e.keyCode == 32) {
		e.preventDefault();
		SpacebarToggleLocalMicrophone(false);
		spacebarPressed = false;
	}
	if (e.keyCode == 27) {
		//DEBUG && console.log(e);
		e.preventDefault();
		toggleConfig();
		toggleRoomUrls();
	}
}, true);

function SpacebarToggleLocalMicrophone(activate) {
	if (walkieTalkieModeEnable) {
		if (walkieTalkieModeEnable && !activate) {

			micHTML.src = 'mic-off.png';
			if (connection.streamEvents.selectAll('local').length > 0) mute('audio');
		} else if (walkieTalkieModeEnable && activate) {
			micHTML.src = 'mic-spacebar-toggle.png';
			if (connection.streamEvents.selectAll('local').length > 0) unmute('audio');
		}
	} else {
		micHTML.src = 'mic-on.png';
		if (connection.streamEvents.selectAll('local').length > 0) unmute('audio');
	}

	sessionStorage.setItem('walkieTalkieModeEnable', walkieTalkieModeEnable);
}


//password processing
var isPassword = false;
if (params.password) {
	isPassword = sanitizePassParams(params.password);
	document.getElementById('room-password').value = isPassword;
	document.getElementById('labelPassword').style.display = '';
} else {
	document.getElementById('labelPassword').style.display = 'none';
	document.getElementById('room-password').value = '';
}
document.getElementById('setPassword').onclick = function() {
	var password = prompt('Please enter room password');
	if (!password || !password.length) {
		password = '';
		return;
	}
	isPassword = sanitizePassParams(password);
	document.getElementById('room-password').value = isPassword;
	document.getElementById('labelPassword').style.display = '';
	document.getElementById('setPassword').style.display = 'none';
}
document.getElementById('room-password').onkeyup = function(e) {
	this.value = isPassword = sanitizePassParams(this.value);
};

function sanitizePassParams(v) {
	if (!v || !v.length) v = '';
	return v.replace(/[^а-яА-ЯёЁA-Za-z0-9]+/g, ''); // removing trailing/leading whitespace
}



// Number of participants in the chatroom
//connection.maxParticipantsAllowed - maximum number of all devices in chatroom. If the value is 0, then the chatroom is created, and the broadcasters can communicate with each other. But they do not see and do not hear the initiator.
var setParticipants = 0;
var setMaxParticipants = 17;
var MaxParticipantsNumber = document.getElementById('participants-number');
MaxParticipantsNumber.max = setMaxParticipants;

if (params.num && !sessionStorage.getItem('participantsNum')) {
	setParticipants = params.num = sanitizeIntParams(params.num);
} else if (sessionStorage.getItem('participantsNum')) {
	setParticipants = sanitizeIntParams(sessionStorage.getItem('participantsNum'));
} else {
	setParticipants = setMaxParticipants;
}

setParticipants = (setParticipants <= setMaxParticipants) ? setParticipants : setMaxParticipants;
sessionStorage.setItem('participantsNum', setParticipants);

MaxParticipantsNumber.value = setParticipants;
MaxParticipantsNumber.max = setMaxParticipants;
MaxParticipantsNumber.min = 0;
MaxParticipantsNumber.step = 1;

MaxParticipantsNumber.onkeyup = MaxParticipantsNumber.oninput = participantsNumberOnchange;

function participantsNumberOnchange() {
	this.value = setParticipants = (sanitizeIntParams(this.value) <= setMaxParticipants) ? sanitizeIntParams(this.value) : setMaxParticipants;
	sessionStorage.setItem('participantsNum', setParticipants);
};

function sanitizeIntParams(v) {
	if (!v) v = '0';
	v = v.replace(/[^0-9]+/g, '') || 0;
	return v;
}



function setupURL(role, fullURL = true, pushState = false) {
	var userLink = (fullURL) ? (window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname) : '';
	userLink += (roomid) ? "?roomid=" + roomid : '';

	if (role === 'broadcaster') {
		userLink += '&ice=' + isICETransport;
		userLink += (selectStreamQuality.value) ? ('&quality=' + selectStreamQuality.value) : '';
		userLink += (selectBandwidth.value) ? ('&bandwidth=' + selectBandwidth.value) : '';
		userLink += (document.getElementById('autostart-for-joner').checked) ? '&autostart=true' : '';
		userLink += (soundOff) ? '&soundoff=true' : '';
	} else if (role === 'viewer') {
		userLink += '&ice=' + isICETransport;
		userLink += '&isview=true';
		userLink += (document.getElementById('soundoff').checked) ? '&soundoff=true' : '';
	} else if (role === 'admin') {
		userLink += '&admin=true';
	}

	if (pushState && history.pushState) {
		window.history.pushState({
			'New settings': userLink
		}, 'DD Talk Change room settings', userLink); //change address line
	}

	return userLink;
}

function changeURLinUI(htmlEl, url) {
	var el = document.getElementById(htmlEl);
	if (el) {
		el.setAttribute('href', url);
	}
}

function changeLinksInRoomUrlsPanel(role = 'all', fullURL = true, pushState = false) {
	if (role === 'broadcaster' || role === 'all') {
		changeURLinUI('share-url-for-join', setupURL('broadcaster', fullURL, pushState))
	}

	if (role === 'viewer' || role === 'all') {
		changeURLinUI('share-url-for-view', setupURL('viewer', fullURL, pushState))
	}

	if (role === 'admin' || role === 'all') {
		changeURLinUI('share-url-for-admin', setupURL('admin', fullURL, pushState))
	}
}

function reSetRoomLinks() {
	if (!isAdmin && !isView && params.quality) {
		changeLinksInRoomUrlsPanel('broadcaster', false, true);
		changeLinksInRoomUrlsPanel('viewer', false, false);
	} else if (isAdmin) {
		changeLinksInRoomUrlsPanel('admin', false, true);
	}
	changeLinksInRoomUrlsPanel();
}

document.getElementById('autostart-for-joner').onchange = function() {
	reSetRoomLinks();
};
document.getElementById('soundoff').onchange = function() {
	reSetRoomLinks();
};

document.getElementById('copy-join-url').onclick = function(e) {
	copyURL('share-url-for-join')
};
document.getElementById('copy-view-url').onclick = function(e) {
	copyURL('share-url-for-view')
};
document.getElementById('copy-admin-url').onclick = function(e) {
	copyURL('share-url-for-admin')
};

function copyURL(str) { //Copy links to clipboard
	str = document.getElementById(str).href;

	const el = document.createElement('textarea');
	el.value = str;
	document.body.appendChild(el);
	el.select();
	try {
		var successful = document.execCommand('copy');
		var msg = successful ? 'Successful ' : 'Unsuccessful ';
		DEBUG && console.log('Copying command was ' + msg);
		DEBUG && console.log('URL: ' + str);
		str = msg + ' copy URL: ' + str;
		statusHeaderHandler(str, 3000);
	} catch (err) {
		DEBUG && console.log('Oops, unable to copy');
	}
	document.body.removeChild(el);
}

//links UI
document.getElementById('share-room-urls').onclick = function() {
	if (document.getElementById("stop-share-room-urls").style.display == 'none') {
		document.getElementById("stop-share-room-urls").style.display = '';
		document.getElementById('share-room-urls').style.display = 'none';

		document.getElementById("room-params").style.display = '';
		document.getElementById('room-urls').style.display = '';

		document.getElementById('viewers-control').style.display = (enableViewers == true) ? 'inline' : 'none';
		document.getElementById('admin-url').style.display = (enableAdmins == true) ? 'inline' : 'none';

		if (connection.streamEvents.selectAll().length > 0) Resize();
	}
}
document.getElementById('stop-share-room-urls').onclick = function() {
	if (document.getElementById("stop-share-room-urls").style.display == '') {
		document.getElementById("stop-share-room-urls").style.display = 'none';
		document.getElementById('share-room-urls').style.display = '';

		document.getElementById("room-params").style.display = 'none';
		document.getElementById('room-urls').style.display = 'none';
	}

	if (connection.streamEvents.selectAll().length > 0) Resize(false);
}
document.getElementById('status-close-btn').onclick = function() {
	statusHeaderHandler();
}

function toggleRoomUrls() {
	if (document.getElementById('room-urls').style.display == 'none') {
		document.getElementById('share-room-urls').onclick();
	} else {
		document.getElementById('stop-share-room-urls').onclick();
	}
}

//settings UI
document.getElementById('config').onclick = function() {
	document.getElementById('room-settings').style.display = '';
	document.getElementById('config').style.display = 'none';
	document.getElementById('stop-config').style.display = '';

	if (connection.streamEvents.selectAll().length > 0) Resize(false);
}
document.getElementById('stop-config').onclick = function() {
	document.getElementById('room-settings').style.display = 'none';
	document.getElementById('config').style.display = '';
	document.getElementById('stop-config').style.display = 'none';

	if (connection.streamEvents.selectAll().length > 0) Resize(false);
}

function toggleConfig() {
	if (isView) return;
	if (document.getElementById('room-settings').style.display == 'none') {
		document.getElementById('config').onclick();
	} else {
		document.getElementById('stop-config').onclick();
	}
}

var additionalSettings = document.getElementById('additional-settings');
document.getElementById('additional-settings-checkbox').onchange = function() { //Toggle Screen-share Settings
	if (additionalSettings.style.display == 'none')
		additionalSettings.style.display = '';
	else
		additionalSettings.style.display = 'none';

	if (connection.streamEvents.selectAll().length > 0) Resize();
}

//Hiding connection settings
function uiBeforeConnect() {
	reSetRoomLinks();
	hideControls();
	navigatorTools();
}

function disableUIElements() {
	document.getElementById('open-or-join-room').disabled = true;
	document.getElementById('room-id').disabled = true;
	document.getElementById('room-password').disabled = true;
	document.getElementById('text-chat').disabled = false;
	document.getElementById('setPassword').style.display = 'none';
	document.getElementById('participants-number').disabled = true;
	document.getElementById('enable-admins').disabled = true;
	document.getElementById('enableviewers').disabled = true;
	document.getElementById('bottom').style.display = 'none';
	document.getElementById('manual-to-start').innerHTML = '';
	statusHeaderHandler();
}

function hideControls() {
	if (DDTalkVersionNumber) document.getElementById('lib-version').innerHTML = DDTalkVersionNumber;

	if (!isView && !isAdmin) {
		document.getElementById('enable-admins').disabled = false;
		document.getElementById('enableviewers').disabled = false;

		document.getElementById('share-room-urls').onclick();
		document.getElementById('config').onclick();
		if (sessionStorage.getItem('quality') === 'OFF') webcamSwitch.onclick();
	}

	if (isView) {
		document.getElementById('share-room-urls').style.display = 'none';
		document.getElementById('text-chat').style.display = 'none';
		document.getElementById('draw').style.display = 'none';
		document.getElementById("room-settings").style.display = 'none';
		document.getElementById('webcam').style.display = 'none';
		document.getElementById('mic').style.display = 'none';
		document.getElementById('pre-recorded-media').style.display = 'none';
		document.getElementById('share-screen').style.display = 'none';
		document.getElementById('share-file').style.display = 'none';
		document.getElementById('config').style.display = 'none';
		document.getElementById('stop-config').style.display = 'none';

	}

	if (isAdmin) {
		document.getElementById('mic').style.display = '';
		document.getElementById('text-chat').style.display = 'none';
		document.getElementById('draw').style.display = 'none';
		document.getElementById('pre-recorded-media').style.display = 'none';
		document.getElementById('share-screen').style.display = 'none';
		document.getElementById('stats-info-off').style.display = 'none';
		document.getElementById('full-screen').style.display = 'none';
		document.getElementById('video-devices').style.display = 'none';
		document.getElementById('audio-devices').style.display = 'none';

		document.getElementById('open-or-join-room').disabled = false;
		document.getElementById('participants-number').disabled = false;

		document.getElementById('share-room-urls').onclick();
		document.getElementById('config').onclick();

		document.getElementById('additional-settings-checkbox').checked = true;
		document.getElementById('additional-settings-checkbox').onchange();
	}
}


function uiAfterConnect() {
	if (connection.extra.broadcaster && connection.extra.roomInitiator) {
		document.title = 'DD Talk initiator role';
		document.getElementById('share-room-urls').onclick();
		document.getElementById('config').onclick();

	} else if (connection.extra.broadcaster && !connection.extra.roomInitiator) {

		document.getElementById('stop-share-room-urls').onclick();
		document.getElementById('stop-config').onclick();

		if (autoStart) document.title = 'DD Talk autoconnect broadcaster';
		else document.title = 'DD Talk broadcaster role';
	}

	if (connection.extra.viewer) {
		document.title = 'DD Talk View role';
	}

	if (connection.extra.admin) {
		document.title = 'DD Talk Admin role';
	}
}


//Information panel about participants and viewers
function numberParticipantsinRoom() {
	var lbroadcasters = 0,
		lviewers = 0,
		ladmins = 0;

	if (connection.extra.broadcaster) {
		lbroadcasters += 1;
	} else if (connection.extra.viewer) {
		lviewers += 1;
	} else if (connection.extra.admin) {
		ladmins += 1;
	}

	if (connection.getAllParticipants().length) {
		connection.getAllParticipants().forEach(function(pid) {
			if (connection.peers[pid].extra.broadcaster === true) lbroadcasters += 1;
			else if (connection.peers[pid].extra.viewer === true) lviewers += 1;
			else if (connection.peers[pid].extra.admin === true) ladmins += 1;
			else return;

			document.getElementById('participants-number-panel').style.display = '';
			document.getElementById('helpLinks').style.display = 'none';
		});
	} else {
		document.getElementById('participants-number-panel').style.display = 'none';
		document.getElementById('helpLinks').style.display = '';
	}

	document.getElementById('join-num').innerHTML = lbroadcasters;
	document.getElementById('view-num').innerHTML = lviewers;
	document.getElementById('admin-num').innerHTML = ladmins;

	if (ladmins > 0) {
		document.getElementById('admin-in-room').style.display = '';
		document.getElementById('admin-not-in-room').style.display = 'none'
	} else {
		document.getElementById('admin-in-room').style.display = 'none';
		document.getElementById('admin-not-in-room').style.display = ''
	}
	document.getElementById('join-num').className = 'blink';
	document.getElementById('view-num').className = 'blink';
	document.getElementById('admin-num').className = 'blink';


	if (connection.isLowBandwidth) { // if low speed internet connection
		document.getElementById('join-num').style.color = document.getElementById('view-num').style.color = document.getElementById('admin-num').style.color = 'red';
	}

	setTimeout(numberParticipantsinRoom, 2000);
}

function isOwnerStatusChangesUI() {
	if (connection.isInitiator == true) {
		enableViewersHTML.disabled = false;
		enableAdminsHTML.disabled = false;

		document.getElementById('menu').style.background = '#e2d4d1';
	} else {
		enableViewersHTML.disabled = true;
		enableAdminsHTML.disabled = true;

		document.getElementById('menu').style.background = '#ffffff';
	}
}

function navigatorTools() {

	if (DetectRTC.browser.name.indexOf('Chrome') == -1) return;

	// detect 2G connection
	if (navigator.connection && navigator.connection.type === 'cellular' && navigator.connection.downlinkMax <= 0.115) {
		alert('2G is not supported. Please use a better internet service.');
	}

	if (screen && screen.orientation) {
		//Detect mobile screen orientation
		screen.orientation.addEventListener('change', function(e) { // при вращении смартфона в горизонтальное положение по умолчанию включается полноэкранное воспроизведение видео ( chrome://flags/#rotate-to-fullscreen ). Здесь мы отключаем полноэкранный режим при повороте. Но это костыль, надо запретить разворачивать видео при повороте экрана
			if (!DetectRTC.isMobileDevice) return;

			if (screen.orientation.type === 'portrait-primary') return;
			//DEBUG && console.log('new orientation is ', e, screen.orientation.type, document.fullscreenElement);
			waitFullscreenElement();
		});
		var waitFullscreenTimeout;

		function waitFullscreenElement() {
			//DEBUG && console.log('detect rotate screen - wait Fullscreen Element ');

			if (document.fullscreenElement && document.fullscreenElement.nodeName == 'VIDEO') {
				DEBUG && console.log('waitFullscreenElement is ok');
				if (document.exitFullscreen) document.exitFullscreen();
				if (waitFullscreenTimeout) window.clearTimeout(waitFullscreenTimeout);
				setTimeout(ToggleFullScreen, 500);
				return;
			}
			waitFullscreenTimeout = setTimeout(waitFullscreenElement, 1000);
		}
	}

	//Controle battery charged
	if (typeof navigator.getBattery != 'undefined') {
		var batteryCharged = false;
		navigator.getBattery().then(function(battery) {
			battery.addEventListener('chargingchange', function() {
				batteryCharged = battery.charging;
				DEBUG && console.log(battery, batteryCharged);
			});
			battery.addEventListener('levelchange', function() {
				var batteryLevel = Math.floor(battery.level * 100) + '%';
				//DEBUG && console.log (battery, batteryLevel);

				if (!batteryCharged && (battery.level == 0.50 || battery.level == 0.30 || battery.level == 0.15)) {
					DEBUG && console.log('The battery is low. Plug in charging', batteryLevel);

					mess = 'The battery is low (' + batteryLevel + '). Plug in charging';
					statusHeaderHandler(mess, 5000);

					DetectRTC.isMobileDevice && window.navigator.vibrate([500, 100, 200]);
				}
				if (!batteryCharged && battery.level == 0.10) {
					DetectRTC.isMobileDevice && window.navigator.vibrate([100, 30, 100, 30, 100, 200, 200, 30, 200, 30, 200, 200, 100, 30, 100, 30, 100]); // Vibrate 'SOS' in Morse code.
				}
			});
		});
	}
}

/* --/////-- */
 // Source: ui/dev/user-media-permissions.js
if (!isView && !isAdmin) {

	var revisitSite = false;
	revisitSite = localStorage.getItem('revisitSite');
	if (!revisitSite) {
		disableHTMLInterface();


		var permissionToStartHTML = document.getElementById('manual-to-start');
		permissionToStartHTML.className = 'manual-to-start';

		var fileNameParkingPage = (!params.quality) ? 'parking.html' : 'first-connect.html';
		fetch(fileNameParkingPage)
			.then(response => response.text())
			.then(html => {
				permissionToStartHTML.innerHTML = html;
				document.getElementById('user-media-permission').addEventListener('click', () => givePermission());
			})
			.catch(function(error) {
				DEBUG && console.log('Failed to load the template.', error);
			});

		function givePermission() {
			mess = '<h2>Please provide access to your webcam and microphone</h2>';
			mess += '<p>' + DetectRTC.browser.name + ' v.' + DetectRTC.browser.fullVersion + '<br /><i>' + window.navigator.userAgent + '</i></p>';
			statusHeaderHandler(mess);

			permissionToStartHTML.innerHTML = '';
			const videoElement = document.createElement('video');
			videoElement.muted = "true";
			videoElement.controls = "true";
			videoElement.style.height = '50%';
			permissionToStartHTML.appendChild(videoElement);

			navigator.mediaDevices.getUserMedia({
					audio: true,
					video: {
						facingMode: 'environment'
					}
				})
				.then((stream) => {
					try {
						videoElement.srcObject = stream;
						videoElement.onloadedmetadata = () => {
							videoElement.play();

							revisitSite = true;
							localStorage.setItem('revisitSite', revisitSite);

							mess += '<h2>Access to the media is obtained!</h2>';
							statusHeaderHandler(mess);

							setTimeout(function() {
								videoElement.pause();
								mess += '<h2>DD Talk is reloading ...</h2>';
								statusHeaderHandler(mess);
								stream.getTracks().forEach(track => track.stop());
								//console.log (stream);
								setTimeout(location.reload(), 3000);
							}, 3000);
						}
					} catch (error) {
						videoElement.src = window.URL.createObjectURL(stream);
						mess = '<h2>Stream connect Issues</h2><p>' + error + '</p>';
						statusHeaderHandler(mess);
					}
				})
				.catch(function(error) {
					mess = '<br /><h3>' + error + '</h3>';
					statusHeaderHandler(mess);
					DEBUG && console.log('Error. Check permissions to Webcam or Microphone in your browser!', error);
				});
		}

		function disableHTMLInterface() {
			document.getElementById('full-screen').style.display = 'none';
			document.getElementById('share-room-urls').style.display = 'none';
			document.getElementById('webcam').style.display = 'none';
			document.getElementById('mic').style.display = 'none';
			document.getElementById('draw').style.display = 'none';
			document.getElementById('pre-recorded-media').style.display = 'none';
			document.getElementById('share-screen').style.display = 'none';
			document.getElementById('share-file').style.display = 'none';
			document.getElementById('stats-info-off').style.display = 'none';
			document.getElementById('open-or-join-room').disabled = true;
			document.getElementById('room-id').disabled = true;
			document.getElementById('room-password').disabled = true;
			document.getElementById('text-chat').style.display = 'none';
			document.getElementById('stop-text-chat').style.display = 'none';
			document.getElementById('setPassword').style.display = 'none';
			document.getElementById('stat').style.display = 'none';
			document.getElementById('participants-number').disabled = true;
			document.getElementById('enableviewers').disabled = true;
			document.getElementById('enable-admins').disabled = true;
			document.getElementById('transport-policy').disabled = true;
			document.getElementById('audio-devices').disabled = true;
			document.getElementById('video-devices').disabled = true;
			document.getElementById('video-quality').disabled = true;
			document.getElementById('rotate-video').disabled = true;
			document.getElementById('bandwidth').disabled = true;
			document.getElementById('audio-handling').disabled = true;
			document.getElementById('room-urls').style.display = 'none';
			document.getElementById("room-settings").style.display = 'none';
			document.getElementById('config').style.display = 'none';
		}

	} else {
		var cameraPermission = false;
		var microphonePermission = false;
		DetectRTC.load(function() {
			if (DetectRTC.isGetUserMediaSupported) {
				//Starting and stopping the stream for checking multimedia devices
				DetectRTC.hasMicrophone && navigator.mediaDevices.getUserMedia({
						audio: true,
						video: false
					})
					.then((stream) => {
						// check microphone available
						if (stream.getAudioTracks().length > 0) {
							//stream.getAudioTracks()[0].stop();
							stream.getTracks().forEach(track => track.stop());
							DEBUG && console.log('Check Audio stream', stream.getAudioTracks());

							microphonePermission = true;
						}
						setUserMicrophonePermission(microphonePermission);
					})
					.catch((e) => {
						setUserMicrophonePermission(microphonePermission);
						DEBUG && console.log('Error: microphone not available', e);

					})
					.then(() => {

						DetectRTC.hasWebcam && navigator.mediaDevices.getUserMedia({
								audio: false,
								video: true
							})
							.then((stream) => {
								// check camera available
								// Problem. if the camera is disabled in the OS, then Firefox does not recognize a camera status
								if (stream.getVideoTracks().length > 0) {
									//stream.getVideoTracks()[0].stop();
									stream.getTracks().forEach(track => track.stop());
									DEBUG && console.log('Check Video stream', stream.getVideoTracks());

									cameraPermission = true;
								}
								setUserCameraPermission(cameraPermission);
							})
							.then(() => {
								//start loader мedia parsms and constraints in file set-device-and-constraint.js
								loadMediaDeviceAndConstraints();
							})
							.catch((e) => {
								setUserCameraPermission(cameraPermission);
								loadMediaDeviceAndConstraints();

								DEBUG && console.log('Error: camera is not available', e);
								mess = '<h2>Web camera is not available. Try connect whithout video</h2>';
								statusHeaderHandler(mess);
							})
					});

				function setUserMicrophonePermission(permission) {
					DetectRTC.isWebsiteHasMicrophonePermissions = permission;
					sessionStorage.setItem('microphonePermission', permission);
					DEBUG && console.log('Microphone Access: ' + DetectRTC.isWebsiteHasMicrophonePermissions);
				}

				function setUserCameraPermission(permission) {
					DetectRTC.isWebsiteHasWebcamPermissions = permission;
					sessionStorage.setItem('cameraPermission', permission);
					DEBUG && console.log('Camera Access: ' + DetectRTC.isWebsiteHasWebcamPermissions);
				}

			} else { // offer user to change browser
				alert('Warning: getUserMedia() is not supported in your browser ' + DetectRTC.browser.name + ' (' + DetectRTC.browser.fullVersion + ')! Pls, use Google Chrome or Firefox last version if it\'s possible https://www.google.ru/intl/en_uk/chrome/');
				DEBUG && console.log('Service disconnected. Error: User Media not support ' + DetectRTC.isGetUserMediaSupported);
			}
		});
	}
}

/* --/////-- */
 // Source: ui/dev/setup-device-and-constraint.js
// ......................................................
// ..................Selectors Video Audio ..............
// ......................................................


/* if(revisitSite == 'true' && !isView && !isAdmin) {
	mess = document.getElementById('start-massage-for-broadcaster').innerHTML;
	
	if(DetectRTC.browser.name != 'Chrome' && DetectRTC.browser.version <= 69) {	
		mess += document.getElementById('start-warning-massage-for-broadcaster').innerHTML; 
	}
	document.getElementById('manual-to-start').innerHTML = mess;
}
 */

if (revisitSite == 'true' && !isView && !isAdmin) {
	mess = document.getElementById('start-massage-for-broadcaster').innerHTML;
	var warnMess = 'You browser: ' + DetectRTC.browser.name + ', OS name: ' + DetectRTC.osName + ', OS Version: ' + DetectRTC.osVersion;

	if (DetectRTC.osName === 'Mac OS X' || DetectRTC.osName === 'iOS') {
		if (DetectRTC.browser.name != 'Safari') {
			mess += document.getElementById('start-warning-massage-for-broadcaster-with-iOS').innerHTML;
			mess += warnMess;
		}
	} else {
		if (DetectRTC.browser.name != 'Chrome' && DetectRTC.browser.version <= 69) {
			mess += document.getElementById('start-warning-massage-for-broadcaster').innerHTML;
			mess += warnMess;
		}
	}

	document.getElementById('manual-to-start').innerHTML = mess;
}




var selectAudioDevices = document.getElementById('audio-devices');
var selectVideoDevices = document.getElementById('video-devices');
var selectStreamQuality = document.getElementById('video-quality');
var selectRotateVideo = document.getElementById('rotate-video');
var selectBandwidth = document.getElementById('bandwidth');

//select constraints for display mediaStream
var selectAspectRatio = document.querySelector('#aspectRatio');
var selectFrameRate = document.querySelector('#frameRate');
var selectCursor = document.querySelector('#cursor');


var dontDublA = {};
var dontDublV = {};

var libConstraints; // via https://www.rtcmulticonnection.org/docs/mediaConstraints/
var libBandwidth; // https://github.com/muaz-khan/RTCMultiConnection/wiki/Bandwidth-Management
// https://www.rtcmulticonnection.org/docs/bandwidth/
//connection.isLowBandwidth === true This property checks your internet connection is 2G or available bandwidth is too low.
// 50kbits  minimum - audio bitrates. Minimum 6 kbps and maximum 510 kbps
// 256kbits (both min-max) - video framerates. Minimum 100 kbps; maximum 2000 kbps

function loadMediaDeviceAndConstraints() {
	// 1. Load libs and bild selectors
	fetch('/dist/lib-media-constraints.json')
		.then(response => response.json())
		.then(json => {
			libConstraints = json;
			// 1.1. Bild stream params selectors
			var optionQ;
			Object.keys(libConstraints).forEach(function(key) {
				optionQ = document.createElement('option');
				optionQ.innerHTML = libConstraints[key].name;
				optionQ.value = key;
				selectStreamQuality.appendChild(optionQ);
			});
		})
		.then(() => {
			fetch('/dist/lib-bandwidth-constraints.json')
				.then(response => response.json())
				.then(json => {
					libBandwidth = json;
					// 1.2. Bild Bandwidth Selectors
					var optionB;
					var libPromises = [];
					Object.keys(libBandwidth).forEach(function(key) {
						optionB = document.createElement('option');
						optionB.innerHTML = libBandwidth[key].name;
						optionB.value = key;
						selectBandwidth.appendChild(optionB);
						libPromises.push(key);
					});
					Promise.all(libPromises)
						.then(() => {
							// 2. load media device
							setMedia();
							startICETransportHandler();
						})
						.then(() => {
							// 3. add selector handlers
							htmlSelectorHandlers();
							AdditionalVideoSettings();
							ShiftValue(); // for audio handling
						})
						.then(() => {
							// 4. add connections polici for broadcasters
							uiBeforeConnect();
							setTimeout(function() {
								if (!autoStart) connectionBroadcastersHandler();
								else autoConnectionBroadcastersHandler();
							}, 1000);
						});
				})
				.catch(err => DEBUG && console.error('Error bandwidth-constraints: ', err))
		})
		.catch(err => DEBUG && console.error('Error lib-media-constraints: ', err))
}


function setMedia() {
	if (isAdmin) return;

	navigator.mediaDevices.enumerateDevices()
		.then(function(devices) {
			devices.forEach(function(device) {
				if (device.kind === 'audioinput') {
					appendOption(device);
				} else if (device.kind === 'videoinput') {
					appendVOption(device);
				}
			});
		})
		.then(function() {
			sessionStorageRotateVideoItem();
			sessionStorageQualityItem();
			sessionStorageBandwidthItem();

			if (cameraPermission || selectStreamQuality.value != 'OFF') { //Write in the session storage the webcam ID
				sessionStorageVideoItem();
			}

			if (microphonePermission) { //iWrite in the session storage the microphone ID 
				sessionStorageAudioItem();
			}
			return null;
		})
		.catch(function(err) {
			DEBUG && console.log(err.name + ": " + err.message);
		});
}

function appendOption(device) {
	if (dontDublA[device.deviceId]) return;
	dontDublA[device.deviceId] = true;
	var option = document.createElement('option');
	option.innerHTML = device.label;
	option.value = (device.deviceId) ? device.deviceId : device.label;
	selectAudioDevices.appendChild(option);
};

function appendVOption(deviceV) {
	//DEBUG && console.log(deviceV);
	if (dontDublV[deviceV.deviceId]) return;
	dontDublV[deviceV.deviceId] = true;
	var optionV = document.createElement('option');
	optionV.innerHTML = deviceV.label;
	optionV.value = (deviceV.deviceId) ? deviceV.deviceId : deviceV.label;
	selectVideoDevices.appendChild(optionV);
};

function sessionStorageVideoItem() { //check if the parameters of the Video device are in Storage memory, and it`s device exist?
	var getStorageItem = sessionStorage.getItem('video');
	if (getStorageItem !== null) {
		for (var i = 0; i < selectVideoDevices.options.length; i++) {
			if (selectVideoDevices.options[i].text == getStorageItem) {
				selectVideoDevices.value = selectVideoDevices.options[i].value;
				var loadDataisCorrect = true;
			}
		}
		if (!loadDataisCorrect) {
			selectVideoDevices.value = selectVideoDevices.options[0].value;
			sessionStorage.setItem('video', selectVideoDevices.options[0].text);
		}
	} else {
		selectVideoDevices.value = selectVideoDevices.options[0].value;
		sessionStorage.setItem('video', selectVideoDevices.options[0].text);
	}
}

function sessionStorageAudioItem() { //check if the parameters of the Audio device are in Storage memory, and it`s device exist?
	var getStorageItem = sessionStorage.getItem('audio');
	if (getStorageItem !== null) {
		for (var i = 0; i < selectAudioDevices.options.length; i++) {
			if (selectAudioDevices.options[i].text == getStorageItem) {
				selectAudioDevices.value = selectAudioDevices.options[i].value;
				var loadDataisCorrect = true;
			}
		}
		if (!loadDataisCorrect) {
			selectAudioDevices.value = selectAudioDevices.options[0].value;
			sessionStorage.setItem('audio', selectAudioDevices.options[0].text);
		}
	} else {
		selectAudioDevices.value = selectAudioDevices.options[0].value;
		sessionStorage.setItem('audio', selectAudioDevices.options[0].text);
	}
}

function sessionStorageQualityItem() {
	if (!cameraPermission) { //disable video if access to the camera is denied
		selectStreamQuality.value = 'OFF';
		sessionStorage.setItem('quality', selectStreamQuality.value);
		selectVideoDevices.style.display = 'none'
		selectRotateVideo.style.display = 'none';
		selectStreamQuality.disabled = true;

	} else if (cameraPermission) { // Quality setting
		if (Object.keys(libConstraints).indexOf(params.quality) > -1) { // Check if there is such a value in the array.
			selectStreamQuality.value = params.quality; //Parameter from URL replaces user settings
		}

		if (!params.quality && Object.keys(libConstraints).indexOf(sessionStorage.getItem('quality')) > -1) {
			selectStreamQuality.value = sessionStorage.getItem('quality');
		} else if (!params.quality && !sessionStorage.getItem('quality')) {
			selectStreamQuality.value = Object.keys(libConstraints)[0]; // Take the first element in the array
		}
		sessionStorage.setItem('quality', selectStreamQuality.value);

		selectVideoDevices.style.display = ''
		selectRotateVideo.style.display = '';
	}
}

function sessionStorageBandwidthItem() {
	if (Object.keys(libBandwidth).indexOf(params.bandwidth) > -1) { // Setting the bandwidth parameter
		selectBandwidth.value = params.bandwidth; // Parameter from URL replaces user settings
	}
	if (!params.bandwidth && Object.keys(libBandwidth).indexOf(sessionStorage.getItem('bandwidth')) > -1) {
		selectBandwidth.value = sessionStorage.getItem('bandwidth');
	} else if (!params.bandwidth && !sessionStorage.getItem('bandwidth')) {
		selectBandwidth.value = Object.keys(libBandwidth)[0]; // Take the first element in the array
	}
	sessionStorage.setItem('bandwidth', selectBandwidth.value);
}

function sessionStorageRotateVideoItem() {
	var rotateVideoFromSessionStorage = sessionStorage.getItem('rotate-video');
	if (rotateVideoFromSessionStorage) {
		selectRotateVideo.value = rotateVideoFromSessionStorage;
	} else {
		selectRotateVideo.value = selectRotateVideo[0].value;
	}
	sessionStorage.setItem('rotate-video', selectRotateVideo.value);
}



function setConstraints() {
	connection.mediaConstraints.audio = libConstraints[selectStreamQuality.value].audio;
	connection.mediaConstraints.audio.deviceId = selectAudioDevices.value ? {
		exact: selectAudioDevices.value
	} : undefined;

	if (cameraPermission && selectStreamQuality.value != 'OFF') {
		connection.mediaConstraints.video = libConstraints[selectStreamQuality.value].video;
		connection.mediaConstraints.video.deviceId = selectVideoDevices.value ? {
			exact: selectVideoDevices.value
		} : undefined;

		if (selectStreamQuality.value === 'fit-screen') {
			connection.mediaConstraints.video.width = Resize().width;
			connection.mediaConstraints.video.height = Resize().height;
		}
		webcamSwitch.style.display = '';
		webcamSwitchOff.style.display = 'none';
	} else {
		connection.mediaConstraints.video = false;
		webcamSwitch.style.display = 'none';
		webcamSwitchOff.style.display = '';
	}
	sessionStorage.setItem('quality', selectStreamQuality.value);

	DEBUG && console.log('connection.mediaConstraints', connection.mediaConstraints);
	return connection.mediaConstraints;
}

function setBandwidth() {
	connection.bandwidth = { // all values in kbits/per/seconds
		audio: (!parseInt(libBandwidth[selectBandwidth.value].audio)) ? false : parseInt(libBandwidth[selectBandwidth.value].audio),
		video: (!parseInt(libBandwidth[selectBandwidth.value].video)) ? false : parseInt(libBandwidth[selectBandwidth.value].video)
	};

	DEBUG && console.log('connection.bandwidth', connection.bandwidth);

	/*var BandwidthHandler = connection.BandwidthHandler;
	connection.processSdp = function(sdp) {
		sdp = BandwidthHandler.setApplicationSpecificBandwidth(sdp, connection.bandwidth, !!connection.session.screen);
		sdp = BandwidthHandler.setVideoBitrates(sdp, {
			min: connection.bandwidth.video,
			max: connection.bandwidth.video
		});

		sdp = BandwidthHandler.setOpusAttributes(sdp, {
			"stereo": 1, // 0 to disable stereo (to force mono audio)
			//"sprop-stereo": 1,
			"maxaveragebitrate": connection.bandwidth.audio * 1024 * 8, // kbits
			"maxplaybackrate": connection.bandwidth.audio * 1024 * 8,
			//"cbr": 1,
			//"useinbandfec": 1,
			//"usedtx": 1,
			'maxptime': 3
		});
		//DEBUG && console.log ('!!!SDP', sdp);
		return sdp;
	};*/

	return connection.bandwidth;
}
//
// Selector Handlers
//
function htmlSelectorHandlers() {
	selectAudioDevices.onchange = function() {
		sessionStorage.setItem('audio', this.options[this.selectedIndex].text);
		SwitchMedia();
	}
	selectVideoDevices.onchange = function() {
		sessionStorage.setItem('video', this.options[this.selectedIndex].text);
		SwitchMedia();
	}
	selectStreamQuality.onchange = function() {
		sessionStorage.setItem('quality', selectStreamQuality.value);
		switchQuality();
	}
	selectBandwidth.onchange = function() {
		sessionStorage.setItem('bandwidth', selectBandwidth.value);
		switchBandwidth();
	}
}

function SwitchMedia() {
	if (isAdmin) return;

	recheckSetupParams();

	if (!cameraPermission || selectStreamQuality.value == 'OFF') {
		selectVideoDevices.style.display = 'none'
		selectRotateVideo.style.display = 'none';

		connection.session = {
			audio: true,
			video: false,
			data: true
		};
		//connection.sdpConstraints.mandatory.OfferToReceiveVideo = false;

	} else if (cameraPermission && selectStreamQuality.value != 'OFF') {
		selectVideoDevices.style.display = '';
		selectRotateVideo.style.display = '';

		connection.session = {
			audio: true,
			video: true,
			data: true
		};
		//connection.sdpConstraints.mandatory.OfferToReceiveVideo = true;
	}

	if (RMCMediaTrack.screen) {
		selectRotateVideo.value = 'default';
		selectRotateVideo.onchange();
	}


	if (RMCMediaTrack.preRecorededStream) {
		preRecordedMediaClose.onclick();
	}

	if (!connection.attachStreams.length) return;

	//remove stream
	if (!RMCMediaTrack.cameraVideoTrack && RMCMediaTrack.cameraAudioTrack) {
		// Пока удаляем поток и пергружаем страницу. 
		// В дальнейшем, нужно переработать код: к аудиопотоку добавить видео поток от вебкамеры
		RMCMediaTrack.cameraAudioTrack.stop();

		connection.getAllParticipants().forEach(function(p) {
			connection.disconnectWith(p);
		});
		//connection.close();
		//connection.closeSocket();
		setTimeout(function() {
			location.reload();
		}, 500);

		return;
	}

	connection.getAllParticipants().forEach(function(p) {
		connection.attachStreams.forEach(function(stream) {
			connection.peers[p].peer.removeStream(stream);
		});
	});
	connection.attachStreams.forEach(function(stream) {
		stream.stop();
	});
	connection.attachStreams = [];
	connection.renegotiate();

	// add stream				
	setTimeout(function() {
		if (selectStreamQuality.value == 'OFF' && RMCMediaTrack.cameraVideoTrack != null) {

			stopAudioHandling();
			RMCMediaTrack.cameraVideoTrack = null;

			connection.addStream({
				audio: true
			});
		} else {
			connection.addStream({
				audio: true,
				video: true
			});
		}

		if (!connection.extra.adminEnableStatus) return;
		connection.socket.emit(connection.socketCustomEvent, { //send to admin 
			userDeleteFromBackup: connection.userid
		});
	}, 2000);
}

function switchQuality() {
	setConstraints();
	reSetRoomLinks();

	if (isAdmin) return;
	if (connection.attachStreams.length == 0) return;

	if (!cameraPermission || selectStreamQuality.value == 'OFF' || !RMCMediaTrack.cameraStream.getVideoTracks()[0]) {
		SwitchMedia();
		return;
	}

	//RMCMediaTrack.cameraStream.getVideoTracks()[0].getCapabilities()
	/*if (connection.mediaConstraints.video.width > RMCMediaTrack.cameraStream.getVideoTracks()[0].getCapabilities().width.max || 
	connection.mediaConstraints.video.height > RMCMediaTrack.cameraStream.getVideoTracks()[0].getCapabilities().height.max) {
		DEBUG && console.log ('This resolution is not supported by your camera.');
		return;
	}*/
	var constraints = connection.mediaConstraints;
	if (RMCMediaTrack.screen != null || RMCMediaTrack.preRecorededStream != null || RMCMediaTrack.audioHandler != null) {
		delete constraints.video.deviceId;
		delete constraints.audio.autoGainControl;
		delete constraints.audio.echoCancellation;
		delete constraints.audio.noiseSuppression;
		delete constraints.audio.deviceId;
	}

	RMCMediaTrack.cameraStream.getVideoTracks()[0].applyConstraints(constraints.video)
		.then(function() {
			DEBUG && console.log(JSON.stringify(RMCMediaTrack.cameraStream.getVideoTracks()[0].getSettings(), null, 2));
		})
		.then(function() {
			RMCMediaTrack.cameraStream.getAudioTracks()[0].applyConstraints(constraints.audio)
			DEBUG && console.log(JSON.stringify(RMCMediaTrack.cameraStream.getAudioTracks()[0].getSettings(), null, 2));
		})
		.catch(function(e) {
			DEBUG && console.log(e);
		});
}

function switchBandwidth() { // experimental
	setBandwidth();
	reSetRoomLinks();

	if (isAdmin) return;
	if (!connection.getAllParticipants().length) return;

	// This is also done adaptively and automatically.
	// Regardless of the quality and size of provided media streams, the network stack implements its own flow and congestion control algorithms: every connection starts by streaming audio and video at a low bitrate (<500 Kbps) and then begins to adjust the quality of the streams to match the available bandwidth.

	// In Chrome, use RTCRtpSender.setParameters to change bandwidth without
	// (local) renegotiation. Note that this will be within the envelope of
	// the initial maximum bandwidth negotiated via SDP.
	if (DetectRTC.browser.name === "Chrome" && 'RTCRtpSender' in window && 'setParameters' in window.RTCRtpSender.prototype) {

		if (connection.attachStreams.length) {
			connection.getAllParticipants().forEach(function(pid) {
				if (connection.getExtraData(pid).admin == true || connection.getExtraData(pid).broadcaster == false) return;

				selectBandwidth.disabled = true;
				RenegotiateBandwidthOnTheFly(pid);
			});
		}

		function RenegotiateBandwidthOnTheFly(pid) {
			connection.peers[pid].peer.getSenders().forEach(function(rtpSender) {
				if (!rtpSender || !rtpSender.track) return;

				updateBandwidth('video', rtpSender);
				updateBandwidth('audio', rtpSender);

				function updateBandwidth(typeStream, rtpSender) {
					if (rtpSender.track.kind === typeStream) {
						const parameters = rtpSender.getParameters();
						const bandwidth = (typeStream == 'video') ? connection.bandwidth.video : connection.bandwidth.audio;
						if (bandwidth == false) {
							delete parameters.encodings[0].maxBitrate;
						} else {
							parameters.encodings[0].maxBitrate = bandwidth * 8 * 1024;
							//parameters.encodings[0].active = false //Enable/disable sent media
						}

						rtpSender.setParameters(parameters)
							.then(() => {
								DEBUG && console.log('Renegotiate Bandwidth parameters ' + typeStream + ':', parameters);
								selectBandwidth.disabled = false;
							})
							.catch(e => {
								DEBUG && console.error('Renegotiate Bandwidth error', e);
							})
					}
				}
			})
		}
	} else {
		location.reload();
	}
}

function AdditionalVideoSettings() { // for screen share
	if (sessionStorage.getItem('display-aspectRatio')) {
		selectAspectRatio.value = sessionStorage.getItem('display-aspectRatio');
	} else {
		selectAspectRatio.value = selectAspectRatio[0].value;
	}
	selectAspectRatio.onchange = function() {
		sessionStorage.setItem('display-aspectRatio', this.value);
		if (RMCMediaTrack.cameraStream && RMCMediaTrack.cameraStream.getVideoTracks()[0]) RMCMediaTrack.cameraStream.getVideoTracks()[0].applyConstraints(selectConstraintsForDisplayMediaStream());
	}

	if (sessionStorage.getItem('display-frameRate')) {
		selectFrameRate.value = sessionStorage.getItem('display-frameRate');
	} else {
		selectFrameRate.value = selectFrameRate[0].value;
	}
	selectFrameRate.onchange = function() {
		sessionStorage.setItem('display-frameRate', this.value);
		if (RMCMediaTrack.cameraStream && RMCMediaTrack.cameraStream.getVideoTracks()[0]) RMCMediaTrack.cameraStream.getVideoTracks()[0].applyConstraints(selectConstraintsForDisplayMediaStream());
	}

	if (sessionStorage.getItem('display-cursor')) {
		selectCursor.value = sessionStorage.getItem('display-cursor');
	} else {
		selectCursor.value = selectCursor[0].value;
	}
	selectCursor.onchange = function() {
		sessionStorage.setItem('display-cursor', this.value);
		if (RMCMediaTrack.cameraStream && RMCMediaTrack.cameraStream.getVideoTracks()[0]) RMCMediaTrack.cameraStream.getVideoTracks()[0].applyConstraints(selectConstraintsForDisplayMediaStream());
	}
}

function selectConstraintsForDisplayMediaStream() {
	var videoConstraints = {};

	if (selectAspectRatio.value !== 'default') {
		videoConstraints.aspectRatio = selectAspectRatio.value;
	}

	if (selectFrameRate.value !== 'default') {
		videoConstraints.frameRate = selectFrameRate.value;
	}

	if (selectCursor.value !== 'default') {
		videoConstraints.cursor = selectCursor.value;
	}
	return videoConstraints;
}

/* --/////-- */
 // Source: ui/dev/turn-server-status.js
// copyrights goes to: webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
// ......................................................
// ..................Selectors Turnservers and transport policy ..............
// ......................................................


var transportPolicyHTML = document.getElementById('transport-policy');
var libIceServers;
var isICETransport;

function startICETransportHandler() {
	fetch('/dist/lib-ice-servers.json')
		.then(response => response.json())
		.then(json => {
			libIceServers = json;
			var optionS;
			Object.keys(libIceServers).forEach(function(key) {
				optionS = document.createElement('option');
				optionS.innerHTML = key;
				optionS.value = libIceServers[key].name;;
				transportPolicyHTML.appendChild(optionS);

				// Check JSON params 
				// If the JSON file contains non-empty values,
				// then they will replace value from server side site-config.json 
				if (key === getKeyByValue(libIceServers, 'stun') && libIceServers[key].urls.length === 0) {
					if (siteConfigSTUNAdress.length === 0) siteConfigSTUNAdress = "stun:stun.l.google.com:19302";

					libIceServers[key].urls = siteConfigSTUNAdress;
				} else if (key === getKeyByValue(libIceServers, 'turn') && libIceServers[key].urls.length === 0) {
					libIceServers[key].urls = siteConfigTURNAdress;
					if (libIceServers[key].username.length === 0) {
						libIceServers[key].username = siteConfigTURNUser;
					}
					if (libIceServers[key].credential.length === 0) {
						libIceServers[key].credential = siteConfigTURNCredential;
					}
				}
			});
		})
		.then(() => {
			if (params.ice) {
				if (params.ice === 'default') {
					isICETransport = 'default';
				} else if (params.ice === 'turn') {
					isICETransport = 'turn';
				} else if (params.ice === 'stun') {
					isICETransport = 'stun';
				} else if (params.ice === 'google') {
					isICETransport = 'google';
				} else {
					isICETransport = 'default';
				}
			} else {
				if (sessionStorage.getItem('transport-policy')) {
					isICETransport = sessionStorage.getItem('transport-policy');
				} else {
					isICETransport = 'default';
				}
			}
			setTransportPolicy();
			CheckTURNServer();
		})
		.catch(err => DEBUG && console.error('Error lib-ice-servers.json: ', err));
}
transportPolicyHTML.onchange = function() {
	isICETransport = this.value;
	setTransportPolicy();
}

//Set ice-transport-policy
function setTransportPolicy() {
	if (isICETransport === 'default') {
		connection.candidates = { // to get both STUN and TURN candidate pairs
			host: true, // local ip-addresses
			stun: true, // (peer) "reflexive" ip-addresses
			turn: true // "relay" ip-addresses
		};
		connection.iceTransportPolicy = 'all'; //'all' - to get both STUN and TURN candidate pairs

		connection.iceServers = [];
		Object.keys(libIceServers).forEach(function(key) {
			if (key === getKeyByValue(libIceServers, 'stun') || key === getKeyByValue(libIceServers, 'turn')) {
				connection.iceServers.push(libIceServers[key]);
			}
		});

	} else if (isICETransport === 'turn') { //only TURN - enable only relay ip-addresses
		connection.candidates = {
			turn: true,
			stun: false,
			host: false
		};
		connection.iceTransportPolicy = 'relay';
		connection.iceServers = [];
		connection.iceServers.push(libIceServers[getKeyByValue(libIceServers, isICETransport)]);
	} else if (isICETransport === 'stun') { //without TURN 
		connection.candidates = {
			host: true,
			stun: true,
			turn: false
		};
		connection.iceTransportPolicy = null;
		connection.iceServers = [];
		connection.iceServers.push(libIceServers[getKeyByValue(libIceServers, isICETransport)]);
	} else if (isICETransport === 'google') {
		connection.candidates = {
			host: true,
			stun: true,
			turn: false
		};
		connection.iceTransportPolicy = null;
		connection.iceServers = [];
		connection.iceServers.push(libIceServers[getKeyByValue(libIceServers, isICETransport)]);
	}

	transportPolicyHTML.value = isICETransport;
	sessionStorage.setItem('transport-policy', isICETransport);

	DEBUG && console.log('isICETransport:', isICETransport, 'connection.candidates:', connection.candidates);

	reSetRoomLinks();

	if (!isAdmin && connection.getAllParticipants().length) {
		connection.close();
		connection.closeSocket();
		setTimeout(function() {
			afterReConnection();
		}, Math.floor(Math.random() * 1000) + 1000);
	}
}

function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key].name === value);
}


function CheckTURNServer() {
	if (!connection.iceServers[1]) return;

	checkIfTURNServerIsActive(libIceServers[getKeyByValue(libIceServers, 'turn')], function(isActive) {
		document.getElementById('coturn-status').title = isActive ? 'CoTURN is Active' : 'CoTURN is off line';
		document.getElementById('coturn-status').innerHTML = isActive ? '&#10033;' : '&#10048;';
		document.getElementById('coturn-status').style.color = isActive ? '#f17f5d' : '#ff0000';

		DEBUG && console.log('TURN Server is Active', isActive);
	});
}

function checkIfTURNServerIsActive(turnServer, callback) {
	let pc;
	let candidates;
	start();

	function start() {
		const iceServers = [turnServer];
		const config = {
			iceServers: iceServers,
			iceTransportPolicy: 'relay',
			iceCandidatePoolSize: 0
		};
		const offerOptions = {
			offerToReceiveAudio: 1
		};
		pc = new RTCPeerConnection(config);
		pc.onicecandidate = iceCallback;
		pc.onicegatheringstatechange = gatheringStateChange;
		pc.createOffer(
			offerOptions
		).then(
			gotDescription,
			noDescription
		);
	}

	function gotDescription(desc) {
		candidates = [];
		pc.setLocalDescription(desc);
	}

	function noDescription(error) {
		console.error('TURN Server error:', error);
	}

	function parseCandidate(text) {
		const candidateStr = 'candidate:';
		const pos = text.indexOf(candidateStr) + candidateStr.length;
		let [foundation, component, protocol, priority, address, port, , type] =
		text.substr(pos).split(' ');
		return {
			'component': component,
			'type': type,
			'foundation': foundation,
			'protocol': protocol,
			'address': address,
			'port': port,
			'priority': priority
		};
	}

	function formatPriority(priority) {
		return [
			priority >> 24,
			(priority >> 8) & 0xFFFF,
			priority & 0xFF
		].join(' | ');
	}

	var number_of_relay_pairs = 0;

	function iceCallback(event) {
		if (event.candidate) {
			const c = parseCandidate(event.candidate.candidate);
			// component, type, foundation, protocol, address, port, formatPriority(c.priority)
			if (c.type === 'relay') {
				number_of_relay_pairs++;
			}
		} else {
			callback && callback(number_of_relay_pairs > 0);
			callback = null;

			if (!('onicegatheringstatechange' in RTCPeerConnection.prototype)) {
				pc.close();
				pc = null;
			}
		}
	}

	function gatheringStateChange() {
		if (pc.iceGatheringState !== 'complete') {
			return;
		}
		pc.close();
		pc = null;
	}
}

/* --/////-- */
 // Source: ui/dev/connection-open-join.js
// ......................................................
// ..................open or join room roles.............
// ......................................................

function recheckSetupParams() { // for broadcasters and admins
	connection.socketCustomEvent = 'DDTalkService' + roomid;
	connection.socketMessageEvent = roomid;
	if (!isView) {
		connection.mediaConstraints = setConstraints();
		connection.bandwidth = setBandwidth();
	}
	connection.maxParticipantsAllowed = setParticipants; //maximum users are allowed to join room
	if (isPassword) connection.password = isPassword;
}


var buttonOpenjoin = document.getElementById('open-or-join-room');
buttonOpenjoin.disabled = true;

function connectionBroadcastersHandler() {
	buttonOpenjoin.disabled = false;
	buttonOpenjoin.focus();
	buttonOpenjoin.onclick = function() {
		recheckSetupParams();
		disableUIElements();
		connection.checkPresence(roomid, function(isRoomExist) {
			if (isRoomExist == true) {
				startJoinRoom(); //join to the room		
			} else {
				startOpenRoom(); //open the room
			}
		});
	}
};

// ......................................................
// ..................is Autostart for broadcasters role..
// ......................................................
function autoConnectionBroadcastersHandler() {
	if (autoStart && !isView && !isAdmin) { // auto-join-room for broadcasters
		DEBUG && console.log('Broadcasters auto-join-room');
		recheckSetupParams();
		disableUIElements();
		startJoinRoom();
	}
}

// ......................................................
// .......... Join room...........................
// ......................................................
var joinTimeoutFunction;
var reconnectCounter = -1;

function startJoinRoom() {
	connection.isInitiator = false;

	if (isView) {
		connection.extra = {
			joinedAt: time(),
			roomInitiator: false,
			broadcaster: false,
			viewer: true,
			viewerEnableStatus: enableViewers,
			admin: false,
			adminEnableStatus: false
		};
	} else if (isAdmin) {
		connection.extra = {
			joinedAt: time(),
			roomInitiator: false,
			broadcaster: false,
			viewer: false,
			viewerEnableStatus: enableViewers,
			admin: true,
			adminEnableStatus: false
		};
	} else {
		connection.extra = {
			joinedAt: time(),
			roomInitiator: false,
			broadcaster: true,
			viewer: false,
			viewerEnableStatus: enableViewers,
			admin: false,
			adminEnableStatus: false
		};
	}

	roomViewer = []; //clear array with viewers id

	mess = 'Joining...';
	statusHeaderHandler(mess);

	connection.connectionDescription = connection.join(roomid, function(isRoomJoined, roomid, error) {
		// connection.connectionDescription = connection.join(roomid); //https://github.com/muaz-khan/RTCMultiConnection/blob/e64e1f7c813352b5ca9b74102ed38fe0e538ee57/demos/Disconnect%2BRejoin.html
		// connection.rejoin(connection.connectionDescription);

		if (error) {
			if (error === connection.errors.ROOM_FULL) {
				mess = 'Room is full.\n\nPlease wait for someone to leave the room';
				statusHeaderHandler(mess);
				DEBUG && console.info(mess);

				setTimeout(startJoinRoom, 5000);
				return;
			}
			if (error === connection.errors.INVALID_PASSWORD) {
				mess = 'Invalid password';
				DEBUG && console.info(mess);

				isPassword = connection.password = sanitizePassParams(prompt('Please enter room password'));
				mess = 'Сhecking the password...';
				statusHeaderHandler(mess);
				setTimeout(startJoinRoom, 5000);
				return;
			}
		}


		if (isRoomJoined == true) {
			reconnectCounter++;
			uiAfterConnect();
			afterConnectingSocket();
			checkInternetConnect();
			reCheckWhoisRoomOwner();
			numberParticipantsinRoom();
			enableViewersHandler();
			enableAdminsHandler();

			if (!isAdmin) removeBrokenMediaContainers();
			if (connection.extra.broadcaster) { //change URL for auto join broadcaster
				autoStart = true;
				changeLinksInRoomUrlsPanel('broadcaster', false, true);

				broadcasterSendsPeerstoViewers();
			}

			mess = 'Join to room ' + roomid;
			statusHeaderHandler(mess, 2000);
			DEBUG && console.info('Join to room' + roomid + ' Start session time', time(), 'Number off reconnect', reconnectCounter);

		} else {
			mess = 'This room does not exist. Wait for the initiator to open it.'
			if (connection.extra.broadcaster) mess += ' Or <a href="/">open the room</a> yourself';
			statusHeaderHandler(mess);

			joinTimeoutFunction = setTimeout(startJoinRoom, Math.floor(Math.random() * 1000) + 3000);
		}
	});
}

function startOpenRoom() {
	if (isAdmin) {
		connection.extra = {
			joinedAt: time(),
			roomInitiator: true,
			broadcaster: false,
			viewer: false,
			viewerEnableStatus: enableViewers,
			admin: true,
			adminEnableStatus: enableAdmins
		};
	} else {
		connection.extra = {
			joinedAt: time(),
			roomInitiator: true,
			broadcaster: true,
			viewer: false,
			viewerEnableStatus: enableViewers,
			admin: false,
			adminEnableStatus: enableAdmins
		};
	}

	connection.open(roomid, function(isRoomOpen) {
		if (isRoomOpen === false) {
			mess = 'This room already exsists.  Trying to join the room';
			statusHeaderHandler(mess);
			DEBUG && console.info(mess);
			setTimeout(startJoinRoom, 1000); //join to the room

		} else {
			reconnectCounter++;
			uiAfterConnect();
			afterConnectingSocket();
			checkInternetConnect();
			enableViewersHandler();
			enableAdminsHandler();
			reCheckWhoisRoomOwner();
			numberParticipantsinRoom();
			if (!isAdmin) removeBrokenMediaContainers();

			mess = 'The room is open. Copy and share the link for communication';
			statusHeaderHandler(mess, 5000);
			DEBUG && console.log('Ok. The room is open: ' + roomid + ' Start session time', time());
		}
	});
}

// ......................................................
// ..........Reconnect after Internet Disconnect.........
// ......................................................
var reconnectStatus = false; // prevents closure of the socket
function afterReConnection() {
	if (connection.getAllParticipants().length == 0 && (socketHandler == true || connection.isOnline == false) && reconnectStatus == false) {
		mess = 'Start Reconnect function';
		statusHeaderHandler(mess);
		DEBUG && console.warn('Start afterReConnection');

		reconnectStatus = true;
		connection.dontCaptureUserMedia = true;

		connection.getAllParticipants().forEach(function(pid) {
			connection.disconnectWith(pid);
		});

		if (isAdmin) clearAdminUsersPanel();
		if (!isView) recheckSetupParams();

		connection.close();
		connection.closeSocket();
		socketHandler = false;

		changeUserIDinLocalMediaContainer(); //change local user id

		/*window.currentUserMediaRequest.streams = [];
		window.currentUserMediaRequest.mutex = false;
		window.currentUserMediaRequest.queueRequests = [];*/
		window.RemoteMediaTrack = [];
		roomViewer = [];

	} else if (connection.getAllParticipants().length == 0 && connection.isOnline == true && socketHandler == false && reconnectStatus == true) {
		reconnectStatus = false;

		setTimeout(function() {
			//location.reload();
			startJoinRoom(); //join to the room
		}, 3000);

		return;
	}
	setTimeout(afterReConnection, 3000);
}

function checkInternetConnect() { // if offline - disconnect from all participants
	if (connection.isOnline == false) {
		mess = 'No Internet access. Check Internet connect';
		statusHeaderHandler(mess);
		DEBUG && console.warn('Offline status');

		connection.getAllParticipants().forEach(function(pid) {
			connection.disconnectWith(pid);
		});
	}

	setTimeout(checkInternetConnect, 2000);
}



// ......................................................
// ..........Recheck connect params.........
// ......................................................
var isOwnerStatus = connection.isInitiator;

function reCheckWhoisRoomOwner() { //check local user isInitiator status
	//DEBUG && console.warn('Status isOwnerStatus', isOwnerStatus);

	if (connection.getAllParticipants.length != 0 && isOwnerStatus != connection.isInitiator) {
		DEBUG && console.warn('Status changed to ' + ((connection.isInitiator) ? 'isInitiator' : 'isJoiner'));
		isOwnerStatus = connection.extra.roomInitiator = connection.isInitiator;
		if (isOwnerStatus == true) {
			enableAdminsHandler();
			enableViewersHandler();
			connection.updateExtraData();
		}
		isOwnerStatusChangesUI();
	}
	setTimeout(reCheckWhoisRoomOwner, 5000);
}


var roomViewer = [];

function broadcasterSendsPeerstoViewers() { //broadcaster resends stream to viewers who are connected to the room
	if (isView || isAdmin || !enableViewers) return;

	connection.getAllParticipants().forEach(function(pid) {
		if (pid == connection.userid) return;

		if (connection.peers[pid].extra.viewer === true) {
			if (roomViewer[pid] == pid) return;
			roomViewer[pid] = pid;
			/*false && setTimeout(function () { //disable, use renegotiate()
				connection.peers[pid].addStream({
					audio: true,
					video: true,
					oneway: true
				});
			}, 100);*/
			connection.renegotiate();
			DEBUG && console.warn('Broadcaster send stream to viewer: ', roomViewer[pid]);
		}
	});
	setTimeout(broadcasterSendsPeerstoViewers, 2000);
}



function changeUserIDinLocalMediaContainer() { //change local user id
	//if(!document.getElementById(connection.userid)) return;

	var localMediaContainer = document.getElementById(connection.userid); // set html element with old userid
	var UIuserIDOwnerIndicator = document.getElementById(connection.userid + '-initiator');

	if (!localMediaContainer || !UIuserIDOwnerIndicator) return;

	setTimeout(function() {
		connection.userid = connection.token(); // change local user id

		if (!isAdmin && !isView) { // change id params in html
			localMediaContainer.setAttribute('id', connection.userid);
			localMediaContainer.querySelector('h2').innerHTML = connection.userid;
			localMediaContainer.querySelector('video').setAttribute('data-userid', connection.userid);

		} else if (isAdmin) {
			localMediaContainer.setAttribute('id', connection.userid);
			localMediaContainer.innerHTML = connection.userid;

			if (UIuserIDOwnerIndicator) {
				UIuserIDOwnerIndicator.setAttribute('id', connection.userid + '-initiator');
				UIuserIDOwnerIndicator.innerHTML = '';
			}
		}
	}, 200);
}

/* --/////-- */
 // Source: ui/dev/connect-viewer.js
// ......................................................
// ..................is View role........................
// ......................................................
if (isView) { // auto-join-room for viewers	
	connection.session = {
		oneway: true
	};
	connection.direction = 'one-way';
	connection.dontCaptureUserMedia = true;
	startICETransportHandler();
	recheckSetupParams();
	uiBeforeConnect();
	disableUIElements();

	DEBUG && console.log('Viewer auto-join-room.');
	startJoinRoom();
}

/* --/////-- */
 // Source: ui/dev/connect-admin.js
// ......................................................
// ..................Autostart for Admins role...........
// ......................................................
if (isAdmin) {
	cameraPermission = true;
	revisitSite = true;
	enableViewers = true;


	// 1. Load libs and bild selectors
	fetch('/dist/lib-media-constraints.json')
		.then(response => response.json())
		.then(json => {
			libConstraints = json;
			// 1.1. Bild stream params selectors
			var optionQ;
			Object.keys(libConstraints).forEach(function(key) {
				optionQ = document.createElement('option');
				optionQ.innerHTML = libConstraints[key].name;
				optionQ.value = key;
				selectStreamQuality.appendChild(optionQ);
			});
		})
		.then(() => {
			fetch('/dist/lib-bandwidth-constraints.json')
				.then(response => response.json())
				.then(json => {
					libBandwidth = json;
					// 1.2. Bild Bandwidth Selectors
					var optionB;
					var libPromises = [];
					Object.keys(libBandwidth).forEach(function(key) {
						optionB = document.createElement('option');
						optionB.innerHTML = libBandwidth[key].name;
						optionB.value = key;
						selectBandwidth.appendChild(optionB);
						libPromises.push(key);
					});

					Promise.all(libPromises)
						.then(() => {
							sessionStorageRotateVideoItem();
							sessionStorageQualityItem();
							sessionStorageBandwidthItem();
							startICETransportHandler();
						})
						.then(() => {
							htmlSelectorHandlers();
							AdditionalVideoSettings();

							connection.socketCustomEvent = 'DDTalkService' + roomid;
							connection.socketMessageEvent = roomid;
							connection.sessionid = roomid;

							connection.session = {
								data: true
							};
							connection.mediaConstraints = {
								audio: false,
								video: false
							};
							connection.sdpConstraints.mandatory = {
								OfferToReceiveAudio: false,
								OfferToReceiveVideo: false
							};

							connection.direction = 'one-way';
							connection.dontAttachStream = true;
							connection.dontCaptureUserMedia = true;
							connection.dontGetRemoteStream = true;
							connection.setUserPreferences = function(userPreferences) {
								if (connection.dontAttachStream) {
									userPreferences.dontAttachLocalStream = true;
								}
								if (connection.dontGetRemoteStream) {
									userPreferences.dontGetRemoteStream = true;
								}
								return userPreferences;
							};

							//next 2 string need if don`t work connection.dontGetRemoteStream = true;
							connection.autoCreateMediaElement = false;
							connection.onstream = connection.onmute = connection.onunmute = function(event) {};

							hideControls();

							buttonOpenjoinAdminHandler();
						})
						.then(() => {
							reSetRoomLinks();
							recheckSetupParams();
							startJoinRoom(); // auto-join-room for admins
						}).then(() => {
							startAdminPanel();
						})
				})
				.catch(err => console.error('Error: ', err));
		})
		.catch(err => console.error('Error: ', err));
}

function buttonOpenjoinAdminHandler() {
	buttonOpenjoin.focus();
	buttonOpenjoin.onclick = function() { //reset event && function for admin mode
		if (joinTimeoutFunction) clearTimeout(joinTimeoutFunction);

		connection.getAllParticipants().forEach(function(pid) {
			connection.disconnectWith(pid);
		});

		clearAdminUsersPanel();

		var UIuserID = document.getElementById(connection.userid); // set html element with old userid
		var UIuserIDOwnerIndicator = document.getElementById(connection.userid + '-initiator');

		setTimeout(function() {
			disableAfterSocketDisconnectReconnect = true;
			connection.closeSocket();

			recheckSetupParams();

			connection.checkPresence(roomid, function(isRoomExist) {
				disableAfterSocketDisconnectReconnect = false;
				if (isRoomExist == true) {
					startJoinRoom(); //join to the room
				} else {
					startOpenRoom(); //open the room
				}
			});

		}, 500);
	}
}

/* --/////-- */
 // Source: ui/dev/admin-panel.js
var adminMessageContainerHTML, usresHTML, usersPanelHTML, usersClosedHTML;
var userBackup = [];
var usersArray = [];
var userControlsHTML = [];
var adminEnableStatus = false;
var adminUIContainer = document.getElementById('manual-to-start'); //container for admin panel

function startAdminPanel() {
	if (!isAdmin) return;

	// create admin panel
	adminUIContainer.style.display = '';

	var newSS = document.createElement('link');
	newSS.rel = 'stylesheet';
	newSS.type = 'text/css';
	newSS.href = './admin.css';
	document.getElementsByTagName("head")[0].appendChild(newSS);

	adminMessageContainerHTML = document.createElement('div');
	adminMessageContainerHTML.id = 'admin-message-container';
	adminMessageContainerHTML.innerHTML = '<h2>Admin ID <span id="' + connection.userid + '">' + connection.userid + '</span> <span id="' + connection.userid + '-initiator"></span></h2><br />';
	adminUIContainer.appendChild(adminMessageContainerHTML);

	var messageText = document.createElement('textarea');
	messageText.id = 'message-input';
	messageText.style = 'width: 80%; padding:20px';
	messageText.placeholder = '...';
	messageText.value = '';
	adminMessageContainerHTML.appendChild(messageText);
	adminMessageContainerHTML.appendChild(document.createElement('br'));
	document.getElementById('message-input').onclick = messageTextHandler;

	var messageSendButton = document.createElement('button');
	messageSendButton.id = 'send-message-button';
	messageSendButton.style = 'margin-bottom: 20px;';
	messageSendButton.innerHTML = 'Send to all broadcasters';
	adminMessageContainerHTML.appendChild(messageSendButton);
	document.getElementById('send-message-button').onclick = function() {
		adminMessageHandler();
	};


	usresHTML = document.createElement('div');
	usresHTML.id = 'participantList';
	usresHTML.style = "text-align: left; padding-left: 5%;";
	usresHTML.innerHTML = '<h2>Partisipanst list</h2>';
	usresHTML.innerHTML += '<div>&#10093; Send commands to all autoconnect participants: <span id="all-change-room" style="color:orange;cursor:pointer;" title="Change random RoomID for all broadcasters and admins">CHANGE ROOM</span> || <span id="all-reload" style="color:orange;cursor:pointer;" title="for all users">RELOAD</span> || <span id="all-reconnect" style="color:orange;cursor:pointer;" title="for all users">RECONNECT</span> || <span id="all-close-connect" style="color:orange;cursor:pointer;" title="for all users">CLOSE CONNECT</span> || <span id="all-quality-setup" style="color:orange;cursor:pointer;" title="for all users">SEND SETTINGS</span> || <span title="disable microphones for current and new broadcasters">DISABLE ALL MICROPHONES <label class="switch"><input type="checkbox" id="all-switch"><div class="slider"></span></div></label></div><br />';
	adminUIContainer.appendChild(usresHTML);
	document.getElementById('all-change-room').onclick = function() {
		sendChangeRoom();
	};
	document.getElementById('all-reload').onclick = function() {
		sendReload();
	};
	document.getElementById('all-reconnect').onclick = function() {
		sendReconnect();
	};
	document.getElementById('all-close-connect').onclick = function() {
		sendCloseConnect();
	};
	document.getElementById('all-quality-setup').onclick = function() {
		sendParams();
	};
	document.getElementById('all-switch').onclick = function() {
		audioOnOffSwitch();
	};

	var getStorageBroadcasterAudioStatus = parseFloat(sessionStorage.getItem('mic-for-broadcaster-all'));
	if (!isNaN(getStorageBroadcasterAudioStatus) && getStorageBroadcasterAudioStatus == '1') {
		document.getElementById('all-switch').checked = true;
		setTimeout(function() {
			Object.keys(userBackup).forEach(function(pid) {
				if (userBackup[pid] === 'Broadcaster') {
					sessionStorage.setItem('mic-for-broadcaster-' + pid, 1);
				}
			})
			audioOnOffSwitch();
		}, 3000);
	}

	usersPanelHTML = document.createElement('div');
	usresHTML.appendChild(usersPanelHTML);
	usersClosedHTML = document.createElement('div');
	usresHTML.appendChild(usersClosedHTML);

	checkwhoisRoomOwner();
	allParticipantsHandler();
}

function checkwhoisRoomOwner() {
	if (!isAdmin) return;

	if (connection.isInitiator == true) {
		document.getElementById(connection.userid + '-initiator').innerHTML = '(Room Owner)';

		adminEnableStatus = connection.extra.adminEnableStatus;

	} else {
		connection.getAllParticipants().forEach(function(pid) {
			var initiatorUI = document.getElementById(pid + "-initiator");
			if (connection.peers[pid].extra.roomInitiator === true) {
				if (initiatorUI) initiatorUI.innerHTML = '(Room Owner)';

				adminEnableStatus = connection.getExtraData(pid).adminEnableStatus;
			} else {
				if (initiatorUI) initiatorUI.innerHTML = '';
				if (document.getElementById(connection.userid + '-initiator')) document.getElementById(connection.userid + '-initiator').innerHTML = '';
			}
		});
	}

	setTimeout(checkwhoisRoomOwner, 2000);
}

function allParticipantsHandler() {
	if (!isAdmin) return;

	var usersArray = [];
	var getAllPIDPromises = [];
	connection.getAllParticipants().forEach(function(pid) {
		if (pid === connection.userid) return;

		if (!adminEnableStatus) {
			clearAdminUsersPanel();
			return;
		}
		if (connection.getExtraData(pid).joinedAt == connection.extra.joinedAt) return;

		if (connection.getExtraData(pid).broadcaster === true) usersArray[pid] = 'Broadcaster';
		else if (connection.getExtraData(pid).viewer === true) usersArray[pid] = 'Viewer';
		else if (connection.getExtraData(pid).admin === true) usersArray[pid] = 'Admin';
		else {
			setTimeout(allParticipantsHandler, 1000);
			return;
		}

		getAllPIDPromises.push(pid);
	});
	Promise.all(getAllPIDPromises)
		.then(() => {

			Object.keys(usersArray).forEach(function(pid) {
				if (Object.keys(userBackup).indexOf(pid) <= -1) {
					userBackup[pid] = usersArray[pid];
					listParticipantsInRoom(pid, userBackup[pid]);
					//DEBUG && console.log('set new value in backup', pid, userBackup[pid]);
				}

				if (userBackup[pid] != usersArray[pid]) { //delete if user change own role
					usersClosedHTML.appendChild(userControlsHTML[pid]);
					disableUserParams(pid, userBackup[pid]);
					delete userBackup[pid];
					userDeleteHandler(pid);
					//DEBUG && console.log('change role', pid);
				}
			});
		})
		.then(() => {
			//DEBUG && console.log('usersArray', usersArray, 'userBackup', usersArray);
			Object.keys(userBackup).forEach(function(pid) { // delete old user id
				if (Object.keys(usersArray).indexOf(pid) <= -1) {
					usersClosedHTML.appendChild(userControlsHTML[pid]);
					disableUserParams(pid, userBackup[pid]);
					delete userBackup[pid];
					//DEBUG && console.log('delete old user id', pid);
				}
			});
			setTimeout(allParticipantsHandler, 2000);
		})
}

var listenerForVolumeSliderAudio = [];
var listenerForReload = [];
var listenerForReconnect = [];
var listenerForCloseConnect = [];
var listenerForQuality = [];
var listenerForMessage = [];
var listenerForAudioStatus = [];
var listenerForDeleteHandler = [];

function listParticipantsInRoom(pid, role) {
	if (!isAdmin) return;
	if (document.getElementById(pid)) userDeleteHandler(pid);
	DEBUG && console.warn('!!!PID', pid, 'role', role);

	var reload, reconnect, closeConnect, roleColor, quality, message, audioStatusSwitch, volumeSliderAudio, volumeLabelAudio;

	if (role == 'Broadcaster') roleColor = '#ff9b00';
	else if (role == 'Viewer') roleColor = '#fff900';
	else if (role == 'Admin') roleColor = '#9e9e9e';
	else roleColor = '#ff0000';

	var userControls = '&#10093; <b>' + pid + ' <span style="color:red;" id="' + pid + '-initiator"></span>' + '</b> is <span id="' + pid + '-role" style="background:' + roleColor + '; padding:4px;">' + role + '</span> <span style="color:back;cursor:pointer;" id="' + pid + '-reload">Reload</span> || <span style="color:back;cursor:pointer;" id="' + pid + '-reconnect">Reconnect</span> || <span style="color:back;cursor:pointer;" id="' + pid + '-close-connect">Close connect</span> || <span style="color:black;cursor:pointer;" id="' + pid + '-quality">Send Settings</span> ||<span style="color:black;cursor:pointer;" id="' + pid + '-message">Private message</span> <span id="' + pid + '-volume-audio-label" style= "vertical-align:middle;display:none;"> || Mic level for viewers: </span><span id="' + pid + '-volume-audio-label-value">1.00</span><input id="' + pid + '-volume-audio" type="range" min="0" max="1" step="0.01" value="1" style= "vertical-align:middle; cursor: pointer; display:none;" /><span id="' + pid + '-mic-controle" style= "vertical-align:middle;display:none;"> || Microphone OFF <label class="switch"><input type="checkbox" id="' + pid + '-switch"><div class="slider"></div></label></span><br />';
	userControlsHTML[pid] = document.createElement('p');
	userControlsHTML[pid].id = pid;
	userControlsHTML[pid].style = "";
	userControlsHTML[pid].innerHTML = userControls;
	usersPanelHTML.appendChild(userControlsHTML[pid]);

	volumeSliderAudio = document.getElementById(pid + "-volume-audio");
	volumeLabelAudio = document.getElementById(pid + "-volume-audio-label-value");
	if (role == 'Broadcaster') {

		var getStorageBroadcasterVolume = parseFloat(sessionStorage.getItem('volume-for-broadcaster-' + pid)).toFixed(2);
		if (!isNaN(getStorageBroadcasterVolume)) volumeSliderAudio.value = volumeLabelAudio.innerHTML = getStorageBroadcasterVolume;
		else volumeSliderAudio.value = volumeLabelAudio.innerHTML = '1.00';

		listenerForVolumeSliderAudio[pid] = function() {
			volumeHandler(pid);
		};
		volumeSliderAudio.addEventListener("change", listenerForVolumeSliderAudio[pid]);
		volumeSliderAudio.addEventListener("input", listenerForVolumeSliderAudio[pid]);

		volumeSliderAudio.style.display = '';
		volumeLabelAudio.style.display = '';
		document.getElementById(pid + "-volume-audio-label").style.display = '';
	} else {
		volumeLabelAudio.innerHTML = '';
	}

	listenerForReload[pid] = function() {
		reloadHandler(pid);
	};
	reload = document.getElementById(pid + "-reload");
	reload.addEventListener("click", listenerForReload[pid]);
	reload.style.color = 'orange';

	reconnect = document.getElementById(pid + "-reconnect");
	listenerForReconnect[pid] = function() {
		reconnectHandler(pid);
	};
	reconnect.addEventListener("click", listenerForReconnect[pid]);
	reconnect.style.color = 'orange';

	closeConnect = document.getElementById(pid + "-close-connect");
	listenerForCloseConnect[pid] = function() {
		closeConnectHandler(pid);
	};
	closeConnect.addEventListener("click", listenerForCloseConnect[pid]);
	closeConnect.style.color = 'orange';


	quality = document.getElementById(pid + "-quality");
	if (role == 'Broadcaster') {
		listenerForQuality[pid] = function() {
			qualityHandler(pid);
		};
		quality.addEventListener("click", listenerForQuality[pid]);
		quality.style.color = 'orange';
	} else {
		quality.innerHTML = 'Can\'t send quality param';
	}

	message = document.getElementById(pid + "-message");
	if (role == 'Broadcaster' || role == 'Admin') {
		listenerForMessage[pid] = function() {
			adminMessageHandler(pid);
		};
		message.addEventListener("click", listenerForMessage[pid]);
		message.style.color = 'orange';
	} else {
		message.innerHTML = 'Can\'t send message';
	}



	audioStatusSwitch = document.getElementById(pid + '-switch');
	if (role == 'Broadcaster') {
		listenerForAudioStatus[pid] = function() {
			audioOnOffSwitch(pid);
		};
		audioStatusSwitch.addEventListener('change', listenerForAudioStatus[pid]);
		document.getElementById(pid + '-mic-controle').style.display = '';

		var getStorageBroadcasterAudioStatus = parseFloat(sessionStorage.getItem('mic-for-broadcaster-' + pid));
		if ((!isNaN(getStorageBroadcasterAudioStatus) && getStorageBroadcasterAudioStatus == '1') || document.getElementById('all-switch').checked == true) {
			audioStatusSwitch.checked = true;
			audioOnOffSwitch(pid);
		}
	} else {
		audioStatusSwitch.innerHTML = '';
	}

	if (role == 'Viewer') { //send the broadcaster volume value to the viewer
		setTimeout(function() {
			Object.keys(userBackup).forEach(function(pid) {
				if (userBackup[pid] == 'Broadcaster') {
					listenerForVolumeSliderAudio[pid]();
				}
			});
		}, 2000);
	}
}


function disableUserParams(pid, role = 'Broadcaster') {
	if (!isAdmin) return;
	if (!userControlsHTML[pid]) return;

	var userStatus = document.getElementById(pid);
	if (!userStatus) return;

	DEBUG && console.log('====user Delete HTML block=====', pid, role);

	userStatus.style = 'color:red; text-decoration:line-through; opacity:0.4';
	document.getElementById(pid + "-reload").removeEventListener('click', listenerForReload[pid]);
	document.getElementById(pid + "-reload").style = 'cursor:auto';
	delete listenerForReload[pid];
	document.getElementById(pid + "-reconnect").removeEventListener('click', listenerForReconnect[pid]);
	document.getElementById(pid + "-reconnect").style = 'cursor:auto';
	delete listenerForReconnect[pid];
	document.getElementById(pid + "-close-connect").removeEventListener('click', listenerForCloseConnect[pid]);
	document.getElementById(pid + "-close-connect").style = 'cursor:auto';
	delete listenerForCloseConnect[pid];

	if (role == 'Broadcaster' || role == 'Admin') {
		document.getElementById(pid + "-message").removeEventListener('click', listenerForMessage[pid]);
		document.getElementById(pid + "-message").style = 'cursor:auto';
		delete listenerForMessage[pid];
	}
	if (role == 'Broadcaster') {
		document.getElementById(pid + "-quality").removeEventListener('click', listenerForQuality[pid]);
		document.getElementById(pid + "-quality").style = 'cursor:auto';
		document.getElementById(pid + "-switch").removeEventListener('click', listenerForAudioStatus[pid]);
		document.getElementById(pid + "-switch").disabled = true;
		document.getElementById(pid + "-volume-audio").removeEventListener('change', listenerForVolumeSliderAudio[pid]);
		document.getElementById(pid + "-volume-audio").removeEventListener('input', listenerForVolumeSliderAudio[pid]);
		document.getElementById(pid + "-volume-audio").style = 'cursor:auto';

		delete listenerForQuality[pid];
		delete listenerForVolumeSliderAudio[pid];
		delete listenerForAudioStatus[pid];

		sessionStorage.removeItem('volume-for-broadcaster-' + pid);
		sessionStorage.removeItem('mic-for-broadcaster-' + pid);
	}


	var userDelete = document.createElement('span');
	userDelete.style = 'color:black; text-decoration:none;';
	userDelete.setAttribute('id', pid + '-user-delete');
	userDelete.innerHTML = ' || Delete this';
	userStatus.appendChild(userDelete);

	listenerForDeleteHandler[pid] = function() {
		userDeleteHandler(pid);
	};
	document.getElementById(pid + "-user-delete").addEventListener("click", listenerForDeleteHandler[pid]);

}

function userDeleteHandler(pid) {
	if (!document.getElementById(pid)) return;

	document.getElementById(pid + '-user-delete').removeEventListener('click', listenerForDeleteHandler[pid]);
	document.getElementById(pid).remove();
	delete listenerForDeleteHandler[pid];
	delete userControlsHTML[pid];
}

function clearAdminUsersPanel() {
	usersArray = [];
	Object.keys(userBackup).forEach(function(pid) {
		disableUserParams(pid, userBackup[pid]);
		userDeleteHandler(pid);
		delete userBackup[pid];
	});
	usersClosedHTML.innerHTML = '';
	usersPanelHTML.innerHTML = '';
}



function closeConnectHandler(pid) {
	sendCloseConnect(pid);
	//DEBUG && console.log('====close connect=====', pid);
}

function reloadHandler(pid) {
	sendReload(pid);
	//DEBUG && console.log('====reload=====', pid);
}

function reconnectHandler(pid) {
	sendReconnect(pid);
	//DEBUG && console.log('====reconnect=====', pid);
}

function qualityHandler(pid) {
	sendParams(pid);
	//DEBUG && console.log('====quality=====', pid);
}

function messageTextHandler() {
	//document.getElementById('message-input').select();
	//document.execCommand('copy');
	//DEBUG && console.log (this);
}

function adminMessageHandler(pid = 'all') {
	var message = document.getElementById('message-input').value;

	sendAlert(message, pid);
	//DEBUG && console.log('====message===== to ', pid, 'messageText: ' + message);
}

function volumeHandler(pid) {
	var volumeSlider = document.getElementById(pid + "-volume-audio");
	var volume = parseFloat(volumeSlider.value).toFixed(2);
	document.getElementById(pid + "-volume-audio-label-value").innerHTML = volume;

	sendRemoteMediaVolume(volume, pid);
	sessionStorage.setItem('volume-for-broadcaster-' + pid, volume);
	//DEBUG && console.log('====volume Handler===== ', pid, ': ', volume);
}

function audioOnOffSwitch(pid = 'all') {
	var micStatusSwitch = document.getElementById(pid + '-switch');
	if (micStatusSwitch.checked) { //microphone disabled
		sendMuteAudio('0', pid);
		sessionStorage.setItem('mic-for-broadcaster-' + pid, 1);
		//DEBUG && console.log(pid, 'Mic Mute Checked');

		if (pid == 'all') {
			Object.keys(userBackup).forEach(function(pid) {
				if (userBackup[pid] === 'Broadcaster') {
					document.getElementById(pid + '-switch').checked = true;
					sessionStorage.setItem('mic-for-broadcaster-' + pid, 1);
				}
			})
		}

	} else {
		sendMuteAudio('1', pid);
		sessionStorage.setItem('mic-for-broadcaster-' + pid, 0);
		//DEBUG && console.log(pid, 'Mic UnMute');

		if (pid == 'all') {
			Object.keys(userBackup).forEach(function(pid) {
				if (userBackup[pid] === 'Broadcaster') {
					document.getElementById(pid + '-switch').checked = false;
					sessionStorage.setItem('mic-for-broadcaster-' + pid, 0);
				}
			})
		}
	}
}

/* --/////-- */
 // Source: ui/dev/stream-events.js
// ......................................................
// ..................RTCMultiConnection Events.............
// ......................................................

const scriptHarkHandler = document.createElement('script');
scriptHarkHandler.src = '/dist/hark.min.js';
scriptHarkHandler.defer = true;
document.body.appendChild(scriptHarkHandler);


var RMCMediaTrack = {
	cameraStream: null,
	selfVideo: null,
	cameraVideoTrack: null,
	cameraAudioTrack: null,
	audioHandler: null,
	screen: null,
	preRecorededStream: null
};
var RemoteMediaTrack = {};

connection.videosContainer = document.getElementById('videos-container');
connection.videosContainer.setAttribute('style', 'font-size:0'); //Since the whitespace between the inline elements is determined by the font-size, you could simply reset the font-size to 0, and thus remove the space between the elements
connection.onstream = function(event) {

	statusHeaderHandler();

	/*
	if(event.type === 'remote' && connection.peers[event.user].streams.length > 1) {
        // mux multiple tracks into single stream
        var stream1 = connection.peers[event.user].streams[0];
        var stream2 = connection.peers[event.user].streams[1];

        // remove old video tracks
        stream1.getVideoTracks().forEach(function(track) {
            stream1.removeTrack(track);
        });

        stream1.addTrack( stream2.getVideoTracks()[0] );
        removeVideoElement.src = URL.createObjectURL(stream1);
	}*/


	if (document.getElementById(event.userid)) { // skip duplicate videos
		//DEBUG && console.log('!!!connection.onstream\n', 'event.stream:\n', event.stream, '\n\n connection.peers["'+event.userid+'"].streams\n', event.mediaElement);
		if (event.mediaElement) {
			event.mediaElement.pause();
			event.mediaElement.srcObject = null;

			event.mediaElement.removeAttribute('src'); // empty source
			event.mediaElement.removeAttribute('srcObject');
			event.mediaElement.muted = true;
			event.mediaElement.volume = 0; //event.mediaElement.parentNode.removeChild(event.mediaElement);
			delete event.mediaElement;
			return;
		}
	}

	if (event.mediaElement) {
		event.mediaElement.removeAttribute('src');
		event.mediaElement.removeAttribute('srcObject');
		event.mediaElement.muted = true;
		event.mediaElement.volume = 0;
	}

	var mediaElement = document.createElement(event.stream.getVideoTracks().length ? 'video' : 'audio');


	mediaElement.setAttribute('data-userid', event.userid);
	mediaElement.setAttribute('autoplay', 'autoplay');
	mediaElement.setAttribute('playsinline', true);
	mediaElement.setAttribute('controls', true);
	mediaElement.setAttribute('poster', true);
	mediaElement.poster = 'preload.png';

	mediaElement.addEventListener("mouseout", function() {
		mediaElement.classList.add('media-controls-disable');

		if (event.type == 'local' && selectRotateVideo.value == 'default') mediaElement.classList.remove("media-controls-enable-rotate");
		else mediaElement.classList.remove("media-controls-enable");
	});
	mediaElement.addEventListener("mouseover", function() {
		if (event.type == 'local' && selectRotateVideo.value == 'default') mediaElement.classList.add('media-controls-enable-rotate');
		else mediaElement.classList.add('media-controls-enable');

		mediaElement.classList.remove("media-controls-disable");
	});

	if (event.type === 'local' || soundOff) {
		mediaElement.setAttribute('volume', 0);
		mediaElement.volume = 0;
		mediaElement.setAttribute('muted', true);
		mediaElement.muted = true;
	} else if (event.type === 'remote' && !soundOff) {
		mediaElement.setAttribute('volume', 1);
		mediaElement.volume = 1;
		mediaElement.setAttribute('muted', false);
		mediaElement.muted = false;
	}


	mediaElement.srcObject = event.stream;
	mediaElement.id = event.streamid;

	if (event.type === 'local') {
		if (selectRotateVideo.value == 'default') mediaElement.classList.add('local-video-rotate', 'media-controls-enable-rotate');
		else mediaElement.classList.add('media-controls-enable');

		selectRotateVideo.onchange = function() { // Rotate video from local camera
			if (this.options[this.selectedIndex].value == 'rotate')
				mediaElement.classList.remove('local-video-rotate', 'media-controls-enable-rotate');
			else mediaElement.classList.add('local-video-rotate', 'media-controls-enable');

			sessionStorage.setItem('rotate-video', this.value);
		}

		RMCMediaTrack.cameraStream = event.stream;
		if (cameraPermission && selectStreamQuality.value != 'OFF') {
			RMCMediaTrack.cameraVideoTrack = event.stream.getVideoTracks()[0];
		}
		RMCMediaTrack.cameraAudioTrack = event.stream.getAudioTracks()[0];
		RMCMediaTrack.selfVideo = mediaElement;

		mediaElement.addEventListener('pause', mute);
		mediaElement.addEventListener('play', unmute);
		mediaElement.addEventListener('playing', function() {
			SpacebarToggleLocalMicrophone();

			if (selectAudioHandling.value == 'pitch-shifter' && RMCMediaTrack.audioHandler) { //share pitch-shifter stream
				stopAudioHandling();
				setTimeout(function() {
					DEBUG && console.log('startAudioHandling');
					startAudioHandling();
				}, 2000);

			} else if (selectAudioHandling.value == 'pitch-shifter' && !RMCMediaTrack.audioHandler) {

				startAudioHandling();

			}

			startHark();

			if (!connection.extra.roomInitiator && connection.extra.broadcaster) {
				setTimeout(function() { // change URL for auto join broadcaster
					autoStart = true;
					params.quality = selectStreamQuality.value;
					changeLinksInRoomUrlsPanel('broadcaster', false, true);
				}, 1000);
			}
		});
	}


	if (event.type === 'remote') {
		mediaElement.classList.add('media-controls-enable');

		//hark
		var speechHarkHTML = document.createElement('div');
		speechHarkHTML.setAttribute('id', 'speechHark-' + event.userid);
		speechHarkHTML.className = 'speech-hark';

		RemoteMediaTrack[event.userid] = mediaElement;

		//for timeline Graph View
		var graphBox = document.createElement('div');
		graphBox.id = 'graph-box-' + event.userid;
		graphBox.className = 'graph-box';
		graphBox.style.display = "none";
		graphBox.innerHTML = '<div class="graph-container" id="bitrateGraph-' + event.userid + '"><div>Bitrate</div><canvas id="bitrateCanvas-' + event.userid + '"></canvas></div><div class="graph-container" id="packetGraph-' + event.userid + '"><div>Packets sent per second</div><canvas id="packetCanvas-' + event.userid + '"></canvas></div>';

	}


	var mediacontainer = document.createElement('div');
	mediacontainer.className = 'media-container';
	mediacontainer.setAttribute('id', event.userid);

	var mediacontrols = document.createElement('div');
	mediacontrols.className = 'media-controls';

	var mediaBox = document.createElement('div');
	mediaBox.className = 'media-box';

	var h2 = document.createElement('h2');
	h2.innerHTML = event.userid;
	if (event.type === 'local') {
		h2.style.backgroundColor = '#f17f5d';
		h2.title = 'local media';
	}

	var span = document.createElement('span');
	span.className = 'media-box-informer';


	mediacontainer.appendChild(mediacontrols);
	mediacontrols.appendChild(span);
	if (event.type === 'remote') mediacontrols.appendChild(graphBox);
	mediacontainer.appendChild(mediaBox);
	mediaBox.appendChild(h2);
	mediaBox.appendChild(mediaElement);
	if (speechHarkHTML) mediaBox.appendChild(speechHarkHTML);

	connection.videosContainer.appendChild(mediacontainer);
	setTimeout(Resize, 500);
};


connection.onmute = function(e) {
	//DEBUG && console.warn('onMute', e.mediaElement);
	if (e.mediaElement) {
		e.mediaElement.srcObject = null;
		e.mediaElement.setAttribute('poster', 'preload.png');
		e.mediaElement.style.background = 'transparent url(preload.png) no-repeat center center';
	}
};
connection.onunmute = function(e) {
	//DEBUG && console.warn('onUnmute', e.mediaElement);
	if (e.mediaElement) {
		if (e.mediaElement.hasAttribute('poster')) {
			e.mediaElement.removeAttribute('poster');
			e.mediaElement.removeAttribute('style');
			//DEBUG && console.warn('hasAttribute', e.mediaElement);
		}
		e.mediaElement.srcObject = e.stream;
	}
};


function mute(e) { // if 'e' = 'audio' its pause audio? else if 'video' - pause video
	connection.streamEvents.selectAll({
		local: true
	}).forEach(function(stream) {
		stream.stream.mute(e);
	});

	localMicrophoneSignalVolume(0);
	hark(connection.attachStreams[0]).stop();

	connection.onsilence({
		userid: connection.userid,
		volume: true,
		threshold: true
	});
}

function unmute(e) { //Start video
	if (walkieTalkieModeEnable && spacebarPressed == true) return;

	connection.streamEvents.selectAll({
		local: true
	}).forEach(function(stream) {
		stream.stream.unmute(e);
	});

	localMicrophoneSignalVolume(1);
	startHark();
}


function removeBrokenMediaContainers() {
	if (isAdmin) return;

	var mediaContainersArray = [];
	connection.getAllParticipants().forEach(function(pid) {
		if (connection.peers[pid].extra.broadcaster == true) {
			mediaContainersArray[pid] = true;
		}
	});

	Object.keys(RemoteMediaTrack).forEach(function(remoteUser) {
		if (Object.keys(mediaContainersArray).indexOf(remoteUser) == -1) {
			connection.streamEvents.selectAll({
				userid: remoteUser
			}).forEach(function(streamEvent) {
				connection.onleave(streamEvent);
				DEBUG && console.log('removeBrokenMediaContainers. Remove stream', streamEvent);
			});
		}
	});
	setTimeout(removeBrokenMediaContainers, 5000);
}

connection.onopen = function(event) {
	DEBUG && console.log('connection.onopen');

	var h2Initiator;
	setTimeout(function() {
		if (document.getElementById(connection.userid)) {
			h2Initiator = document.getElementById(connection.userid).querySelector('h2');
			if (h2Initiator) h2Initiator.style.maxWidth = RMCMediaTrack.selfVideo.clientWidth + 'px';
		}
	}, 3000);

	//for canvas designer
	// you seems having data to be synced with new user!
	if (designer && designer.pointsLength <= 0) {
		// make sure that remote user gets all drawings synced.
		setTimeout(function() {
			connection.send('plz-sync-points');
		}, 1000);
	}
};

connection.onstreamended = function(event) {
	DEBUG && console.info('connection.onstreamended user: ', event.userid, event);

	var videoElement = document.getElementById(event.streamid);
	if (videoElement) {
		videoElement.pause();
		videoElement.srcObject = null;
		videoElement.removeAttribute('src'); // empty source
		videoElement.load();
	}
	var mediaElement = document.getElementById(event.userid);
	if (mediaElement && mediaElement.parentNode) {
		//DEBUG && console.log('***connection.onstreamended: remove old stream \n', event.stream);
		//delete event.mediaElement;
		delete connection.streamEvents[event.streamid];
		mediaElement.parentNode.removeChild(mediaElement);
		setTimeout(Resize, 500);
	}

	if (typeof resetVideoStreamsForRecorder === 'function' && isView) {
		//if (connection.peers[event.userid] && connection.peers[event.userid].extra.broadcaster !== true) return;
		resetVideoStreamsForRecorder(event.streamid);
	}
};


connection.onleave = function(event) {
	DEBUG && console.info('connection.onleave user: ', event.userid, event);

	var mediaElement = document.getElementById(event.userid);
	if (mediaElement && mediaElement.parentNode) {
		mediaElement.parentNode.removeChild(mediaElement);
		setTimeout(Resize, 500);
	}

	if (RemoteMediaTrack[event.userid]) delete RemoteMediaTrack[event.userid];

	connection.streamEvents.selectAll({
		userid: event.userid
	}).forEach(function(e) {
		delete connection.streamEvents[e.streamid];

		if (typeof resetVideoStreamsForRecorder === 'function' && isView && connection.peers[event.userid] && connection.peers[event.userid].extra.broadcaster === true) {
			resetVideoStreamsForRecorder(e.streamid);
		}
	});


	setTimeout(afterReConnection, 500); //checked reconnect
};


connection.onNewParticipant = function(participantId, userPreferences) {
	DEBUG && console.log('onNewParticipant: new user in the room', participantId, 'userPreferences', userPreferences);

	if (connection.extra.broadcaster && !enableViewers && userPreferences.connectionDescription.message.isOneWay) { //if NOT enableViewers - don`t connect Viewers
		DEBUG && console.warn('Disabled connect with Viewer', participantId);
	} else {
		connection.acceptParticipationRequest(participantId, userPreferences);
	}

	if (isView && !userPreferences.connectionDescription.message.isOneWay) {
		connection.acceptParticipationRequest(participantId, userPreferences);
	}
};

var disableAfterSocketDisconnectReconnect = false; //for disable reconnect when admin open new room
var socketHandler = false; //for socket.io disconnected
connection.onSocketDisconnect = function(event) {
	DEBUG && console.warn('socket.io connection is closed. Status: ', event);

	mess = 'Signal server connection is closed';
	statusHeaderHandler(mess);

	if (reconnectStatus == true || disableAfterSocketDisconnectReconnect == true) return;
	socketHandler = true;

	connection.getAllParticipants().forEach(function(pid) {
		connection.disconnectWith(pid);
	});
};


connection.onUserIdAlreadyTaken = function(useridAlreadyTaken, yourNewUserId) {
	DEBUG && console.warn('Userid already taken.', useridAlreadyTaken, 'Your new userid:', yourNewUserId);

	connection.close();
	connection.closeSocket();
};


connection.onExtraDataUpdated = function(event) {
	//DEBUG && console.warn('connection.onExtraDataUpdated', event.userid, event.extra);
	if (!event.extra) return;
	if (!event.extra.roomInitiator) return;

	enableAdmins = (event.extra.adminEnableStatus === true) ? true : false;
	enableAdminsHandler();


	enableViewers = (event.extra.viewerEnableStatus === true) ? true : false;
	enableViewersHandler();
};

/*
connection.onRoomFull = function(roomid) {
  alert('Room is full.');
};*/

/*
connection.onUserStatusChanged = function(event) {
	//DEBUG && console.log('onUserStatusChanged', event);
};*/

connection.onMediaError = function(error, constraints) {
	DEBUG && console.log('onMediaError:' + JSON.stringify(error, null, '\t'), constraints);

	mess = 'Browser Error:\n\n' + error + JSON.stringify(constraints, null, '\t');
	mess += (!DetectRTC.hasMicrophone) ? '\nIs a microphone connected? ' : '';
	mess += (!DetectRTC.isWebsiteHasMicrophonePermissions) ? '\nIs access to the Microphone? ' : '';
	mess += (!cameraPermission) ? '\nIs access to the Camera? ' : '';

	statusHeaderHandler(mess, 0, 'red');

	connection.closeSocket(); // close socket.io connection
};

connection.onmessage = function(event) {
	if (isAdmin || isView) return;

	//DEBUG && console.log('custom message', event.userid, event.data);
	if (event.userid && event.data.userMessage) { //for Chat Messages
		document.getElementById('text-chat').onclick();
		appendDIV(event.userid, event.data.userMessage);
	}

	//for canvas designer
	if (event.data === 'plz-sync-points') {
		if (!designer) document.getElementById('draw').onclick();
		designer.sync();
		return;
	}
	if (event.data.designerMessage) {
		if (!designer) document.getElementById('draw').onclick();
		designer.syncData(event.data.designerMessage);
		getDataURL();
	}
};




//Microphone level meter
//if need STOP hark(connection.attachStreams[0]).stop();
connection.onspeaking = function(e) {
	//DEBUG && console.log('onspeaking == ', e)
	var userOnSpeaking = {
		pid: e.userid,
		speaking: true
	};
	try {
		connection.socket.emit(connection.socketCustomEvent, {
			userOnSpeaking
		});
	} catch (e) {
		//DEBUG && console.log('connection.socket.emit is false');
	}
};
connection.onsilence = function(e) {
	//DEBUG && console.log('onsilence == ', e)
	var userOnSilence = {
		pid: e.userid,
		silent: true
	};
	try {
		connection.socket.emit(connection.socketCustomEvent, {
			userOnSilence
		});
	} catch (e) {
		//DEBUG && console.log('connection.socket.emit is false');
	}
};
connection.onvolumechange = function(e) {
	//DEBUG && console.log('onvolumechange == ', e)
	var userOnVolumechange = {
		pid: e.userid,
		volume: e.volume
	};
	try {
		connection.socket.emit(connection.socketCustomEvent, {
			userOnVolumechange
		});
	} catch (e) {
		//DEBUG && console.log('connection.socket.emit is false');
	}
};

function initHark(args) {
	if (!window.hark) {
		DEBUG && console.log('Please link hark.js');
		return;
	}

	var connection = args.connection;
	var streamedObject = {
		userid: connection.userid,
		volume: true,
		threshold: true
	};

	var stream = args.stream;

	if (!stream) return;
	if (!stream.getAudioTracks()[0]) return;

	var options = args.options;
	var speechEvents = hark(stream, options);
	//speechEvents.setThreshold (-70);
	//speechEvents.setInterval (100);

	speechEvents.on('speaking', function() {
		connection.onspeaking(streamedObject);
	});

	speechEvents.on('stopped_speaking', function() {
		connection.onsilence(streamedObject);
	});

	/* speechEvents.on('volume_change', function(volume, threshold) {
		streamedObject.volume = volume;
		streamedObject.threshold = threshold;
		connection.onvolumechange(streamedObject);
	}); */
}

function startHark() {
	initHark({
		stream: connection.attachStreams[0], //event.stream
		connection: connection,
		options: {
			interval: 100, // ms
			threshold: -90 //-50 dB, from 0  to -100 dB
		}
	});
}

/* --/////-- */
 // Source: ui/dev/video-size.js
//.......................FullScreen.....................
document.getElementById("full-screen").onclick = ToggleFullScreen;
document.body.onresize = function(e) {
	setTimeout(Resize, 500);
}

function ToggleFullScreen() {
	if (connection.streamEvents.selectAll().length) {
		var elem = document.getElementById("videos-container");
		if (!document.fullscreenElement && // alternative standard method
			!document.mozFullScreenElement && !document.webkitFullscreenElement) { // current working methods
			//console.log('toggle full',elem);
			if (elem.requestFullscreen) {
				elem.requestFullscreen();
			} else if (elem.mozRequestFullScreen) {
				elem.mozRequestFullScreen();
			} else if (elem.webkitRequestFullscreen) {
				elem.webkitRequestFullscreen(elem.ALLOW_KEYBOARD_INPUT);
			}
		} else {
			//console.log('toggle exit full');
			document.exitFullscreen();
		}
	}
}

function ColRow(number, elem) { //Определяет по размеру экрана количество колонок и рядов
	var maxNumber;
	var Columns = parseInt(window.innerWidth / 240); //elem.clientWidth/240);
	var Rows = parseInt(window.innerHeight / 320); //elem.clientHeight/320);
	var portrait = (window.innerHeight > window.innerWidth) //(Columns<Rows);
	switch (number) {
		case 3:
			maxNumber = 3;
			break;
		case 4:
		case 7:
			maxNumber = 4;
			break;
		case 17:
			maxNumber = 6;
		default:
			maxNumber = Math.ceil(Math.sqrt(number));
			break;
	};
	if (portrait) {
		Columns = Math.ceil(number / maxNumber);
		Rows = maxNumber;
	} else {
		Columns = maxNumber;
		Rows = Math.ceil(number / maxNumber);
	}
	//console.log('isPortrait:', portrait, 'columns:',Columns, 'rows:',Rows);
	return {
		isPortrait: portrait,
		columns: Columns,
		rows: Rows
	};
}

function Resize(isAdd = false) { //Изменяет размеры видеоконтейнера и вложенных элементов при изменении размеров экрана
	var elem = document.getElementById('videos-container');
	var settings = document.getElementById('room-settings');
	var roomUrls = document.getElementById('room-urls');
	var roomParams = document.getElementById('room-params');
	var menu = document.getElementById('menu');
	var bottom = document.getElementById('bottom');
	var drawcontainer = document.getElementById('draw-container');
	var filecontainer = document.getElementById('file-container');
	var additionalSettings = document.getElementById('additional-settings');
	var isFullScreeMode = document.webkitIsFullScreen || document.mozFullScreen || document.fullscreen;
	var maxwidth = (isFullScreeMode) ? (window.innerWidth - 5) : window.innerWidth - 100;
	var maxheight = (isFullScreeMode) ? (window.innerHeight - 5) : window.innerHeight - (settings.clientHeight + additionalSettings.clientHeight + roomUrls.clientHeight + roomParams.clientHeight + menu.clientHeight + drawcontainer.clientHeight + filecontainer.clientHeight + bottom.clientHeight + 10);
	var isPortrait = false;
	if (elem.hasChildNodes()) { // Таким образом, сначала мы проверяем, не пуст ли объект, есть ли у него дети
		var children = elem.childNodes;
		var childrenL = elem.childNodes.length;
		var number = isAdd ? (childrenL + 1) : childrenL; //Если мы добавляем элемент следует учитывать и его
		var cr = ColRow(number, elem);
		var Columns = cr.columns;
		var Rem = number % Columns;
		var Rows = cr.rows;
		var i = 0;
		width = parseInt(maxwidth / cr.columns);
		height = maxheight / cr.rows;
		isPortrait = cr.isPortrait;
		//DEBUG && console.log(isPortrait, window.innerWidth ,width);
		for (var row = 0, col; row < Rows; row++) {
			if (row > 0 && Rem != 0 && Columns - Rem > 1) { //Здесь пересчитываем количество в ряду
				Columns--;
			}
			for (col = 0; col < Columns && i < childrenL; col++) {
				var childStyle = children[i].style;
				childStyle.width = width + 'px';
				childStyle.height = height + 'px';
				var childNStyle = children[i].childNodes[1].style;
				childNStyle.width = width + 'px';
				childNStyle.height = height + 'px';
				var childNNStyle = children[i].childNodes[1].childNodes[1].style;
				childNNStyle.width = width + 'px';
				childNNStyle.height = height + 'px';
				if (isPortrait) { //При расположении в портретном режиме другие стили
					elem.style.height = maxheight + 'px';
					elem.style.width = maxwidth + 'px';

					childStyle.minWidth = width + 'px';
					childStyle.maxHeight = height + 'px';
					if (childStyle.removeAttribute) {
						childStyle.removeAttribute('max-width');
						childStyle.removeAttribute('min-height');
					} else {
						childStyle.removeProperty('max-width');
						childStyle.removeProperty('min-height');
					}
					var childrenNodesStyle = children[i].childNodes[1].style;
					childNStyle.minWidth = width + 'px';
					childNStyle.maxHeight = height + 'px';
					if (childNStyle.removeAttribute) {
						childNStyle.removeAttribute('max-width');
						childNStyle.removeAttribute('min-height');
					} else {
						childNStyle.removeProperty('max-width');
						childNStyle.removeProperty('min-height');
					}
					childNNStyle.minWidth = width + 'px';
					childNNStyle.maxHeight = height + 'px';
					if (childNNStyle.removeAttribute) {
						childNNStyle.removeAttribute('max-width');
						childNNStyle.removeAttribute('min-height');
					} else {
						childNNStyle.removeProperty('max-width');
						childNNStyle.removeProperty('min-height');
					}
				} else {
					elem.style.height = maxheight + 'px';
					elem.style.width = maxwidth + 'px';

					childStyle.maxWidth = width + 'px';
					childStyle.minHeight = height + 'px';
					if (childStyle.removeAttribute) {
						childStyle.removeAttribute('min-width');
						childStyle.removeAttribute('max-height');
					} else {
						childStyle.removeProperty('min-width');
						childStyle.removeProperty('max-height');
					}
					childNStyle.maxWidth = width + 'px';
					childNStyle.minHeight = height + 'px';
					if (childNStyle.removeAttribute) {
						childNStyle.removeAttribute('min-width');
						childNStyle.removeAttribute('max-height');
					} else {
						childNStyle.removeProperty('min-width');
						childNStyle.removeProperty('max-height');
					}
					childNNStyle.maxWidth = width + 'px';
					childNNStyle.minHeight = height + 'px';
					if (childNNStyle.removeAttribute) {
						childNNStyle.removeAttribute('min-width');
						childNNStyle.removeAttribute('max-height');
					} else {
						childNNStyle.removeProperty('min-width');
						childNNStyle.removeProperty('max-height');
					}
				}
				i++;
			}
		}

	} else {
		var width = maxwidth / 2;
		var height = maxheight / 2;
	}

	Object.keys(document.querySelectorAll('h2')).forEach(function(pid) {
		if (isAdmin || connection.streamEvents.selectAll().length == 0) return;
		//console.log(document.querySelectorAll('h2')[pid]);
		document.querySelectorAll('h2')[pid].style.maxWidth = width + 'px';
		document.querySelectorAll('h2')[pid].style.maxHeight = height + 'px';
	});
	var chatTextarea = document.createElement('textarea');
	var chatBox = document.createElement('div');
	if (chatTextarea) chatTextarea.style.width = chatBox.style.width = width + 'px';
	if (chatBox) chatBox.style.height = height - chatTextarea.clientHeight + 'px';

	return {
		width: width,
		height: height,
		isPortrait: isPortrait
	};
}

/* --/////-- */
 // Source: ui/dev/stats.js
// ----------------------------------------------------
// getStats codes goes here
// ----------------------------------------------------

const scriptTimeLineGraphView = document.createElement('script');
scriptTimeLineGraphView.src = '/dist/graph.min.js';
scriptTimeLineGraphView.defer = true;
document.body.appendChild(scriptTimeLineGraphView);

const scriptGetStats = document.createElement('script');
scriptGetStats.src = '/dist/getStats.min.js'; // '/node_modules/getstats/getStats.min.js';
scriptGetStats.defer = true;
document.body.appendChild(scriptGetStats);



var statsOn = false;
document.getElementById('stats-info-off').onclick = function() {
	if (connection.streamEvents.selectAll().length == 0) return;
	if (isAdmin) return;

	this.style.display = 'none';
	document.getElementById('stats-info-on').style.display = '';

	statsOn = true;
};
document.getElementById('stats-info-on').style.display = 'none';
document.getElementById('stats-info-on').onclick = function() {
	this.style.display = 'none';
	document.getElementById('stats-info-off').style.display = '';

	statsOn = false;
};



connection.onPeerStateChanged = function(event) {
	if (isAdmin) return;


	if (event.iceConnectionState === 'connected' && event.signalingState === 'stable') {
		if (connection.peers[event.userid].gettingStats === true) {
			return;
		}
		connection.peers[event.userid].gettingStats = true; // do not duplicate
		var peer = connection.peers[event.userid].peer;
		var interval = 1000;

		if (DetectRTC.browser.name === 'Firefox') {
			getStats(peer, peer.getLocalStreams()[0].getTracks()[0], function(stats) {
				onGettingWebRTCStats(stats, event.userid);
			}, interval);
		} else {
			getStats(peer, function(stats) {
				onGettingWebRTCStats(stats, event.userid);
			}, interval);
		}
	}
};

var bitrateGraph = [];
var bitrateSeries = [];
var packetGraph = [];
var packetSeries = [];
var lastResult = [];

var timeStart = +new Date();
var timeNow, timeTotal;

function onGettingWebRTCStats(stats, remoteUserId) {
	if (isAdmin) stats.nomore();

	if (!statsOn) {
		if (document.getElementById(remoteUserId)) {
			document.getElementById(remoteUserId).querySelector('span').innerHTML = '';
			document.getElementById('graph-box-' + remoteUserId).style.display = "none";
		}
		return;
	}

	if (!connection.peers[remoteUserId]) {
		stats.nomore();
	}

	timeNow = +new Date();
	timeTotal = Math.floor(-1 * (timeStart - timeNow) / 1000);

	var statsData = '' + '\n';
	statsData += 'Current time: ' + time();
	statsData += '\n';
	statsData += 'Connection time from start: ' + timeFormat(timeTotal);
	statsData += '\n';
	if (reconnectCounter > 0) {
		statsData += 'The number of local reconnections: ' + reconnectCounter;
		statsData += '\n';
	}
	statsData += 'Bandwidth sent: ' + bitesToSize(stats.bandwidth.speed);
	statsData += '\n';
	statsData += 'Bandwidth audio send: ' + bitesToSize(stats.audio.send.availableBandwidth);
	statsData += '\n';
	statsData += 'Bandwidth audio recv: ' + bitesToSize(stats.audio.recv.availableBandwidth);
	statsData += '\n';
	statsData += 'Bandwidth video send: ' + bitesToSize(stats.video.send.availableBandwidth);
	statsData += '\n';
	statsData += 'Bandwidth video recv: ' + bitesToSize(stats.video.recv.availableBandwidth);
	statsData += '\n';
	statsData += 'Encryption: ' + stats.encryption;
	statsData += '\n';
	statsData += 'Codecs: ' + stats.audio.recv.codecs.concat(stats.video.recv.codecs).join(', ');
	statsData += '\n';
	statsData += 'Data Received: ' + bytesToSize(stats.audio.bytesReceived + stats.video.bytesReceived);
	statsData += '\n';
	statsData += 'ICE loc: ' + stats.connectionType.local.candidateType.join(', ') + '. IP: ' + stats.connectionType.local.ipAddress.join(', ') + '?transport=' + stats.connectionType.local.transport.join(', ');;
	statsData += '\n';
	statsData += 'ICE rem: ' + stats.connectionType.remote.candidateType.join(', ') + '. IP: ' + stats.connectionType.remote.ipAddress.join(', ') + '?transport=' + stats.connectionType.remote.transport.join(', ');;
	statsData += '\n';
	statsData += 'resol recv: ' + (stats.resolutions.recv.width + 'x' + stats.resolutions.recv.height);
	statsData += '\n';
	statsData += 'resol sent: ' + (stats.resolutions.send.width + 'x' + stats.resolutions.send.height);

	connection.streamEvents.selectAll({
		userid: remoteUserId
	}).forEach(function(streamEvent) {
		if (!streamEvent) return;
		statsData += '\n';
		statsData += 'AudioTracks res id: ' + streamEvent.stream.getAudioTracks()[0].id;
	});

	connection.streamEvents.selectAll({
		userid: connection.userid
	}).forEach(function(streamEvent) {
		if (!streamEvent) return;
		statsData += '\n';
		statsData += 'AudioTracks send id: ' + streamEvent.stream.getAudioTracks()[0].id;
	});
	//DEBUG && console.log ('stats',  stats);

	var remoteUserDIV = document.getElementById(remoteUserId);
	if (!remoteUserDIV) return;

	var statsInformer = remoteUserDIV.querySelector('span');
	statsInformer.innerHTML = statsData.replace(/\n/g, '<br>');

	statsInformer.style.maxWidth = RemoteMediaTrack[remoteUserId].clientWidth + 'px';


	// query getStats every second
	connection.peers[remoteUserId].peer.getSenders().forEach(function(rtpSender) {
		if (!rtpSender || !rtpSender.track) return;
		if (rtpSender.track.kind != 'video') return;
		if (!bitrateSeries[remoteUserId]) {
			bitrateSeries[remoteUserId] = new TimelineDataSeries();
			bitrateGraph[remoteUserId] = new TimelineGraphView('bitrateGraph-' + remoteUserId, 'bitrateCanvas-' + remoteUserId);
			bitrateGraph[remoteUserId].updateEndDate();

			packetSeries[remoteUserId] = new TimelineDataSeries();
			packetGraph[remoteUserId] = new TimelineGraphView('packetGraph-' + remoteUserId, 'packetCanvas-' + remoteUserId);
			packetGraph[remoteUserId].updateEndDate();
		}

		document.getElementById('graph-box-' + remoteUserId).style.display = "";
		document.getElementById('graph-box-' + remoteUserId).style.width = RemoteMediaTrack[remoteUserId].clientWidth + 'px';
		rtpSender.getStats().then(res => {
			res.forEach(report => {
				let bytes;
				let packets;
				const now = report.timestamp;
				if (report.type === 'outbound-rtp') {
					bytes = report.bytesSent;
					packets = report.packetsSent;
					if (lastResult[remoteUserId] && lastResult[remoteUserId].has(report.id)) {
						// calculate bitrate
						const bitrate = 8 * (bytes - lastResult[remoteUserId].get(report.id).bytesSent) /
							(now - lastResult[remoteUserId].get(report.id).timestamp);

						// append to chart
						bitrateSeries[remoteUserId].addPoint(now, bitrate);
						bitrateGraph[remoteUserId].setDataSeries([bitrateSeries[remoteUserId]]);
						bitrateGraph[remoteUserId].updateEndDate();

						// calculate number of packets and append to chart
						packetSeries[remoteUserId].addPoint(now, packets -
							lastResult[remoteUserId].get(report.id).packetsSent);
						packetGraph[remoteUserId].setDataSeries([packetSeries[remoteUserId]]);
						packetGraph[remoteUserId].updateEndDate();
					}
				}
			});
			lastResult[remoteUserId] = res;
		});
	})


}


function bytesToSize(bytes) {
	var k = 1000;
	var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	if (bytes === 0) {
		return '0 Bytes';
	}
	var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
	return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

function bitesToSize(bytes) {
	var k = 1024;
	var sizes = ['bites/s', 'kbs', 'mbs', 'gbs', 'tbs'];
	if (bytes === 0) {
		return '0 Bites';
	}
	bytes = bytes * 8;
	var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
	return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

function timeFormat(time) {
	// Hours, minutes and seconds
	var hrs = ~~(time / 3600); //  double tilde ~~ faster substitute for Math.floor().
	var mins = ~~((time % 3600) / 60);
	var secs = ~~time % 60;

	// Output like "1:01" or "4:03:59" or "123:03:59"
	var ret = "";

	if (hrs > 0) {
		ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
	}

	ret += "" + mins + ":" + (secs < 10 ? "0" : "");
	ret += "" + secs;
	return ret;
}

/* --/////-- */
 // Source: ui/dev/chat-message.js
document.getElementById('text-chat').onclick = function() {
	if (connection.streamEvents.selectAll().length == 0) return;
	this.style.display = 'none';
	document.getElementById('stop-text-chat').style.display = '';
	startChat();
}

document.getElementById('stop-text-chat').style.display = 'none';
document.getElementById('stop-text-chat').onclick = function() {
	this.style.display = 'none';
	document.getElementById('text-chat').style.display = '';
	stopChat();
};

var chatContainer, chatTextarea, chatBox;

function startChat() {
	if (!chatContainer) { //create chat
		chatContainer = document.getElementById(connection.userid).querySelector('span');

		chatTextarea = document.createElement('textarea');
		chatTextarea.id = 'input-text-chat';
		chatTextarea.title = 'To resise pull the corner';
		chatTextarea.placeholder = '\nChat. Press Enter to send';
		chatContainer.appendChild(chatTextarea);

		chatBox = document.createElement('div');
		chatBox.className = 'chat-output';
		chatContainer.appendChild(chatBox);

		checkChatContainerUI();

	} else {
		chatTextarea.style.display = '';
		chatBox.style.display = '';
	}

	chatTextarea.style.width = chatBox.style.width = RMCMediaTrack.selfVideo.clientWidth + 'px';

	chatTextarea.focus();
	chatTextarea.onkeyup = function(e) {
		if (e.keyCode == 13) { // Enter pressed
			if (e.shiftKey) return; // add Shift pressed
			if (!connection.getAllParticipants().length) return;

			this.value = this.value.replace(/^\s+|\s+$/g, ''); // removing trailing/leading whitespace
			this.value = encodeURIComponent(this.value);
			if (!this.value.length) return;
			var chatMessage = this.value;
			if (!isView) {
				connection.send({ // send custom messages to server
					userMessage: chatMessage
				});
			}
			if (!isView) appendDIV('My', chatMessage);
			this.value = '';
		}
	};
}

function stopChat() {
	if (!connection.streamEvents.selectAll().length || !chatTextarea) return;

	chatTextarea.style.display = 'none';
	chatBox.style.display = 'none';
}

var chatTabIndex = 1;

function appendDIV(sender, message) {
	if (!message || !sender) return;

	if (!chatBox) return;

	var div = document.createElement('div');
	div.className = 'chat-messages';
	div.innerHTML = '<a href="#" style="color:black" title="' + new Date() + '">' + sender + '</a>: ' + decodeURIComponent(message) + '';
	div.tabIndex = chatTabIndex;
	chatTabIndex++;

	chatBox.appendChild(div);

	chatTextarea.style.width = chatBox.style.width = RMCMediaTrack.selfVideo.clientWidth + 'px';
	chatBox.style.height = (RMCMediaTrack.selfVideo.clientHeight - chatTextarea.clientHeight) + 'px';

	chatBox.scrollTop = chatBox.scrollHeight;

	chatTextarea.focus();
}

var ifChatContainerisNull = false;

function checkChatContainerUI() { //if selectStreamQuality.onchange or selectBandwidth.onchange 
	if (!document.getElementById(connection.userid)) {
		ifChatContainerisNull = true;
	}
	if (document.getElementById(connection.userid) && ifChatContainerisNull == true) {
		ifChatContainerisNull = false;

		setTimeout(function() {
			document.getElementById(connection.userid).querySelector('span').appendChild(chatContainer);

			chatTextarea.style.width = chatBox.style.width = RMCMediaTrack.selfVideo.clientWidth + 'px';
			chatBox.style.height = (RMCMediaTrack.selfVideo.clientHeight - chatTextarea.clientHeight) + 'px';
		}, 500);
	}
	setTimeout(checkChatContainerUI, 3000);
}

/* --/////-- */
 // Source: ui/dev/pitch-shifter.js
//code via https://codepen.io/DonKarlssonSan/pen/WGbwJa
//https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/webrtc-integration.html

var selectAudioHandling = document.getElementById('audio-handling');
if (sessionStorage.getItem('audioHandling')) {
	selectAudioHandling.value = sessionStorage.getItem('audioHandling');
} else {
	sessionStorage.setItem('audioHandling', selectAudioHandling.value);
}

var shiftSlider = document.getElementById("shiftSlider");
var shiftSliderTextValue = document.getElementById("shiftSliderTextValue");
if (selectAudioHandling.value == 'pitch-shifter') {
	shiftSliderTextValue.style.display = shiftSlider.style.display = '';
} else {
	shiftSliderTextValue.style.display = shiftSlider.style.display = 'none';
}

if (sessionStorage.getItem('shiftSliderTextValue')) {
	shiftSlider.value = shiftSliderTextValue.value = parseFloat(sessionStorage.getItem('shiftSliderTextValue')).toFixed(2);;
} else {
	shiftSlider.value = shiftSliderTextValue.value = "-0.35";
}

selectAudioHandling.onchange = function() {
	AudioHandlingToggle(selectAudioHandling.value);
}

function AudioHandlingToggle(item) {

	sessionStorage.setItem('audioHandling', selectAudioHandling.value);
	sessionStorage.setItem('shiftSliderTextValue', shiftSliderTextValue.value);

	if (!isView && DetectRTC.isAudioContextSupported && DetectRTC.isCreateMediaStreamSourceSupported) {
		if (item == 'pitch-shifter') { //enable Pitch Shifter handler for local audio stream
			shiftSliderTextValue.style.display = shiftSlider.style.display = '';

			if (RMCMediaTrack.cameraStream) {
				startAudioHandling();
			}

		} else {
			shiftSliderTextValue.style.display = shiftSlider.style.display = 'none';

			if (RMCMediaTrack.cameraStream) {
				stopAudioHandling();
			}
		}
	}
}

function ShiftValue() {
	shiftSlider.addEventListener("change", function() {
		sessionStorage.setItem('shiftSliderTextValue', this.value);
		shiftSliderTextValue.value = this.value;
		if (jungle) jungle.setPitchOffset(this.value);
	});
	shiftSlider.addEventListener("input", function() {
		sessionStorage.setItem('shiftSliderTextValue', this.value);
		shiftSliderTextValue.value = this.value;
		if (jungle) jungle.setPitchOffset(this.value);

	});
	shiftSliderTextValue.onkeyup = function(e) {
		if (e.keyCode != 13) return;
		this.value = this.value.replace(/^\s+|\s+$/g, ''); // removing trailing/leading whitespace
		this.value = encodeURIComponent(this.value);
		if (!this.value.length) return;
		//DEBUG && console.log('shiftSliderTextValue = ', this.value);
		sessionStorage.setItem('shiftSliderTextValue', this.value);
		shiftSlider.value = this.value;
		if (jungle) jungle.setPitchOffset(this.value);
	};
}

function replaceAudioTrack(audioTrack) {
	if (!audioTrack) return;
	if (audioTrack.readyState === 'ended') {
		DEBUG && console.log('Can not replace an "ended" track. track.readyState: ' + audioTrack.readyState);
		return;
	}
	connection.getAllParticipants().forEach(function(pid) {
		var peer = connection.peers[pid].peer;
		if (!peer.getSenders) return;
		var trackToReplace = audioTrack;
		peer.getSenders().forEach(function(sender) {
			if (!sender || !sender.track) return;
			if (sender.track.kind === 'audio' && trackToReplace) {
				//DEBUG && console.log('!!!audioTrack  sender.replaceTrack(trackToReplace);',trackToReplace, 'sender', sender );
				sender.replaceTrack(trackToReplace);
				trackToReplace = null;

			}
		});
	});
	//DEBUG && console.log('!!!audioTrack.readyState is:' + audioTrack.readyState);
}

function stopAudioHandling() {
	if (RMCMediaTrack.audioHandler != null) {
		if (RMCMediaTrack.cameraStream.getAudioTracks()[0].readyState == "live") {
			if (RMCMediaTrack.cameraVideoTrack == null) {

				RMCMediaTrack.selfVideo.srcObject = RMCMediaTrack.cameraStream;

				// share audio again
				replaceAudioTrack(RMCMediaTrack.cameraAudioTrack);
			} else {
				RMCMediaTrack.cameraStream.getAudioTracks().forEach(function(track) {
					RMCMediaTrack.cameraStream.removeTrack(track);
				});
				RMCMediaTrack.cameraStream.addTrack(RMCMediaTrack.cameraAudioTrack);


				RMCMediaTrack.selfVideo.srcObject = RMCMediaTrack.cameraStream;

				// share audio again
				replaceAudioTrack(RMCMediaTrack.cameraAudioTrack);
				// now remove old audio from "attachStreams" array
				connection.attachStreams = [RMCMediaTrack.cameraStream];

			}

			RMCMediaTrack.audioHandler = null;
			if (window.audioContext) {
				audioContext.close().then(function() {
					window.audioContext = null;
					window.jungle = null;
				});
			}
		}
	}
}


function localMicrophoneSignalVolume(e = 1) {
	if (!audioContext) return;
	//DEBUG && console.log('localMicrophoneSignalVolume', e);
	return gainNode.gain.value = e; // 0 microphone signal is OFF, 1 is ON
}

var audioContext, jungle, peerTrack, gainNode, oldwalkieTalkieMode;

function startAudioHandling() {
	if (RMCMediaTrack.cameraStream && !RMCMediaTrack.audioHandler) {

		if (walkieTalkieModeEnable) { //disable walkie talkie mode
			oldwalkieTalkieMode = walkieTalkieModeEnable;
			walkieTalkieModeEnable = false;
			SpacebarToggleLocalMicrophone();
		}

		// Setup Audio Context
		if (!audioContext) {
			audioContext = new AudioContext();
		}

		var mediaStreamSource = audioContext.createMediaStreamSource(RMCMediaTrack.cameraStream); // from local stream
		peerTrack = audioContext.createMediaStreamDestination();
		var delay = audioContext.createDelay();
		delay.delayTime.value = 0.0; // delay in seconds
		mediaStreamSource.connect(delay);

		gainNode = audioContext.createGain();
		gainNode.gain.value = localMicrophoneSignalVolume();
		delay.connect(gainNode);

		if (!window.jungle) {
			jungle = new Jungle(audioContext);
		}

		jungle.setPitchOffset(shiftSliderTextValue.value); //-1 to 2

		gainNode.connect(jungle.input);
		//jungle.output.connect(audioContext.destination); // for test: Mic - Delay - Pitch shift + Out (speaker/phones)
		jungle.output.connect(peerTrack); // Mic - Delay - Pitch shift + Out (stream peers)

		RMCMediaTrack.audioHandler = peerTrack.stream.getAudioTracks()[0];
		//DEBUG && console.log('RMCMediaTrack.audioHandler', RMCMediaTrack.audioHandler);


		if (RMCMediaTrack.cameraVideoTrack == null) {
			DEBUG && console.log('cameraVideoTrack is null');
			// now add audio track into local video/audio object
			//RMCMediaTrack.selfVideo.srcObject = peerTrack.stream;
			// add audio track into that stream object
			connection.attachStreams = [peerTrack.stream];
			// share audio with connected participants
			replaceAudioTrack(RMCMediaTrack.audioHandler);

		} else {
			// now remove old audio track from "attachStreams" array
			// so that newcomers can listen audio as well
			connection.attachStreams.forEach(function(stream) {
				stream.getAudioTracks().forEach(function(track) {
					stream.removeTrack(track);
				});
				// now add audio track into that stream object
				stream.addTrack(RMCMediaTrack.audioHandler);
			});
		}

		if (oldwalkieTalkieMode) { //return walkie talkie mode
			walkieTalkieModeEnable = true;
			SpacebarToggleLocalMicrophone();
		}
	}
	replaceAudioTrack(RMCMediaTrack.audioHandler);


}

// Pitch shifter by Chris Wilson
// https://github.com/cwilso/Audio-Input-Effects/blob/master/js/jungle.js
// Copyright 2012, Google Inc.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
// 
//		 * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//		 * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//		 * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

function createFadeBuffer(context, activeTime, fadeTime) {
	var length1 = activeTime * context.sampleRate;
	var length2 = (activeTime - 2 * fadeTime) * context.sampleRate;
	var length = length1 + length2;
	var buffer = context.createBuffer(1, length, context.sampleRate);
	var p = buffer.getChannelData(0);

	var fadeLength = fadeTime * context.sampleRate;

	var fadeIndex1 = fadeLength;
	var fadeIndex2 = length1 - fadeLength;

	// 1st part of cycle
	for (var i = 0; i < length1; ++i) {
		var value;

		if (i < fadeIndex1) {
			value = Math.sqrt(i / fadeLength);
		} else if (i >= fadeIndex2) {
			value = Math.sqrt(1 - (i - fadeIndex2) / fadeLength);
		} else {
			value = 1;
		}

		p[i] = value;
	}

	// 2nd part
	for (var i = length1; i < length; ++i) {
		p[i] = 0;
	}


	return buffer;
}

function createDelayTimeBuffer(context, activeTime, fadeTime, shiftUp) {
	var length1 = activeTime * context.sampleRate;
	var length2 = (activeTime - 2 * fadeTime) * context.sampleRate;
	var length = length1 + length2;
	var buffer = context.createBuffer(1, length, context.sampleRate);
	var p = buffer.getChannelData(0);

	// 1st part of cycle
	for (var i = 0; i < length1; ++i) {
		if (shiftUp)
			// This line does shift-up transpose
			p[i] = (length1 - i) / length;
		else
			// This line does shift-down transpose
			p[i] = i / length1;
	}

	// 2nd part
	for (var i = length1; i < length; ++i) {
		p[i] = 0;
	}

	return buffer;
}

var delayTime = 0.100;
var fadeTime = 0.050;
var bufferTime = 0.100;

function Jungle(context) {
	this.context = context;
	// Create nodes for the input and output of this "module".
	var input = context.createGain();
	var output = context.createGain();
	this.input = input;
	this.output = output;

	// Delay modulation.
	var mod1 = context.createBufferSource();
	var mod2 = context.createBufferSource();
	var mod3 = context.createBufferSource();
	var mod4 = context.createBufferSource();
	this.shiftDownBuffer = createDelayTimeBuffer(context, bufferTime, fadeTime, false);
	this.shiftUpBuffer = createDelayTimeBuffer(context, bufferTime, fadeTime, true);
	mod1.buffer = this.shiftDownBuffer;
	mod2.buffer = this.shiftDownBuffer;
	mod3.buffer = this.shiftUpBuffer;
	mod4.buffer = this.shiftUpBuffer;
	mod1.loop = true;
	mod2.loop = true;
	mod3.loop = true;
	mod4.loop = true;

	// for switching between oct-up and oct-down
	var mod1Gain = context.createGain();
	var mod2Gain = context.createGain();
	var mod3Gain = context.createGain();
	mod3Gain.gain.value = 0;
	var mod4Gain = context.createGain();
	mod4Gain.gain.value = 0;

	mod1.connect(mod1Gain);
	mod2.connect(mod2Gain);
	mod3.connect(mod3Gain);
	mod4.connect(mod4Gain);

	// Delay amount for changing pitch.
	var modGain1 = context.createGain();
	var modGain2 = context.createGain();

	var delay1 = context.createDelay();
	var delay2 = context.createDelay();
	mod1Gain.connect(modGain1);
	mod2Gain.connect(modGain2);
	mod3Gain.connect(modGain1);
	mod4Gain.connect(modGain2);
	modGain1.connect(delay1.delayTime);
	modGain2.connect(delay2.delayTime);

	// Crossfading.
	var fade1 = context.createBufferSource();
	var fade2 = context.createBufferSource();
	var fadeBuffer = createFadeBuffer(context, bufferTime, fadeTime);
	fade1.buffer = fadeBuffer
	fade2.buffer = fadeBuffer;
	fade1.loop = true;
	fade2.loop = true;

	var mix1 = context.createGain();
	var mix2 = context.createGain();
	mix1.gain.value = 0;
	mix2.gain.value = 0;

	fade1.connect(mix1.gain);
	fade2.connect(mix2.gain);

	// Connect processing graph.
	input.connect(delay1);
	input.connect(delay2);
	delay1.connect(mix1);
	delay2.connect(mix2);
	mix1.connect(output);
	mix2.connect(output);

	// Start
	var t = context.currentTime + 0.050;
	var t2 = t + bufferTime - fadeTime;
	mod1.start(t);
	mod2.start(t2);
	mod3.start(t);
	mod4.start(t2);
	fade1.start(t);
	fade2.start(t2);

	this.mod1 = mod1;
	this.mod2 = mod2;
	this.mod1Gain = mod1Gain;
	this.mod2Gain = mod2Gain;
	this.mod3Gain = mod3Gain;
	this.mod4Gain = mod4Gain;
	this.modGain1 = modGain1;
	this.modGain2 = modGain2;
	this.fade1 = fade1;
	this.fade2 = fade2;
	this.mix1 = mix1;
	this.mix2 = mix2;
	this.delay1 = delay1;
	this.delay2 = delay2;

	this.setDelay(delayTime);
}

Jungle.prototype.setDelay = function(delayTime) {
	this.modGain1.gain.setTargetAtTime(0.5 * delayTime, 0, 0.010);
	this.modGain2.gain.setTargetAtTime(0.5 * delayTime, 0, 0.010);
}

Jungle.prototype.setPitchOffset = function(mult) {
	if (mult > 0) { // pitch up
		this.mod1Gain.gain.value = 0;
		this.mod2Gain.gain.value = 0;
		this.mod3Gain.gain.value = 1;
		this.mod4Gain.gain.value = 1;
	} else { // pitch down
		this.mod1Gain.gain.value = 1;
		this.mod2Gain.gain.value = 1;
		this.mod3Gain.gain.value = 0;
		this.mod4Gain.gain.value = 0;
	}
	this.setDelay(delayTime * Math.abs(mult));
}

/* --/////-- */
 // Source: ui/dev/message-exchange.js
// ......................................................
// ..........message exchange ...........................
// ..........connection.socketCustomEvent................
// ......................................................

function sendParams(item = 'all') {
	var userQualityParams = {
		quality: selectStreamQuality.value,
		bandwidth: selectBandwidth.value,
		audiohandling: selectAudioHandling.value,
		audiohandlingShiftSliderValue: shiftSlider.value,
		transportPolicy: transportPolicyHTML.value,
		enableviewers: enableViewers,
		enableadmins: enableAdmins,
		walkietalkie: walkieTalkieModeEnable,
		roomParticipantsNumber: setParticipants,

		rotatevideo: selectRotateVideo.value,
		displayaspectRatio: aspectRatio.value,
		displayframeRate: frameRate.value,
		displaycursor: cursor.value
		//soundOff
	};
	userQualityParams.pid = (item != 'all') ? item : 'all';
	connection.socket.emit(connection.socketCustomEvent, {
		userQualityParams
	});
	mess = 'Send Settings to ' + userQualityParams.pid;
	statusHeaderHandler(mess, 3000);
}

function sendRemoteMediaVolume(volumeMedia, item) {
	if (volumeMedia <= 1 || volumeMedia >= 0) {
		//DEBUG && console.log('====send volume sendRemoteMediaVolume===== ', item, ': ', volumeMedia);
		var userVolumeMedia = {
			pid: item,
			volume: volumeMedia
		};

		connection.socket.emit(connection.socketCustomEvent, {
			userVolumeMedia
		});
	}
}

function sendRenegotiate(item = 'all') { // or 'userid'
	var userRenegotiate = {
		pid: item
	};
	connection.socket.emit(connection.socketCustomEvent, {
		userRenegotiate
	});
}

function sendJoin(item = 'all') { // or 'userid'
	var userJoin = {
		pid: item
	};
	connection.socket.emit(connection.socketCustomEvent, {
		userJoin
	});
}


function sendReconnect(item = 'all') { // or 'userid'
	if (window.confirm('Please select "OK" to confirm Reconnect for ' + item.toUpperCase() + ' user') == false) return;

	var userReconnect = {
		pid: item
	};
	connection.socket.emit(connection.socketCustomEvent, {
		userReconnect
	});
}

function sendCloseConnect(item = 'all') { // or 'userid'
	if (window.confirm('Please select "OK" to confirm Close Connect for ' + item.toUpperCase() + ' user') == false) return;

	var userCloseConnect = {
		pid: item
	};
	connection.socket.emit(connection.socketCustomEvent, {
		userCloseConnect
	});
}

function sendReload(item = 'all') { // or 'userid'
	if (window.confirm('Please select "OK" to confirm Reload for ' + item.toUpperCase() + ' user') == false) return;

	var userReload = {
		pid: item
	};
	connection.socket.emit(connection.socketCustomEvent, {
		userReload
	});
}

function sendChangeRoom() {
	var newRoom = randomString() + randomString();
	if (window.confirm('Please select "OK" to confirm Change Room ' + newRoom + ' for all user') == false) return;
	connection.socket.emit(connection.socketCustomEvent, {
		newRoom
	});

	roomid = document.getElementById('room-id').value = newRoom.replace(/[^а-яА-ЯёЁA-Za-z0-9]+/g, '');
	reSetRoomLinks();

	setTimeout(function() {
		buttonOpenjoin.onclick(); // connect to new roomId
	}, Math.floor(Math.random() * 1000) + 1000);
}

function connectToNewRoom(newroom) {
	roomid = document.getElementById('room-id').value = newroom.replace(/[^а-яА-ЯёЁA-Za-z0-9]+/g, '');

	reSetRoomLinks();
	DEBUG && console.log('Command from Admin: change roomid ', roomid);
	connection.getAllParticipants().forEach(function(pid) {
		connection.disconnectWith(pid);
	});

	//if(connection.extra.broadcaster)changeLinksInRoomUrlsPanel('broadcaster', false, true);

	setTimeout(function() {
		connection.close();
		connection.closeSocket();

	}, Math.floor(Math.random() * 1000) + 500);
}


function sendAlert(message = '', item = 'all') { // or 'userid'
	var userAlert = {
		pid: item,
		adminid: connection.userid,
		message: encodeURIComponent(message)
	};
	connection.socket.emit(connection.socketCustomEvent, {
		userAlert
	});
}

function sendMuteAudio(volume = '0', item = 'all') { // or 'userid'
	var userMuteAudio = {
		pid: item,
		volume: volume
	};
	connection.socket.emit(connection.socketCustomEvent, {
		userMuteAudio
	});
}


function getRandomColor() {
	var letters = '0123456789ABCDEF'.split('');
	var color = '#';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.round(Math.random() * 15)];
	}
	return color;
}

function afterConnectingSocket() {
	connection.socket.on(connection.socketCustomEvent, function(message) {
		//DEBUG && console.log('custom message', message);

		//Hark.js
		if (message.userOnVolumechange) {
			if (document.getElementById('speechHark-' + message.userOnVolumechange.pid)) {
				var size = Math.round(1000 / Math.round(message.userOnVolumechange.volume) * -1 + 2);
				document.getElementById('speechHark-' + message.userOnVolumechange.pid).style.width = size + 'px';
				if (!isAdmin) document.getElementById('speechHark-' + message.userOnVolumechange.pid).style.height = size + 'px';
			}
		}
		if (message.userOnSilence) {
			//DEBUG && console.log('onsilence', message.userOnSilence.pid);
			var setSpeechHarkOnSilenceUI = document.getElementById('speechHark-' + message.userOnSilence.pid);
			if (setSpeechHarkOnSilenceUI) {
				setSpeechHarkOnSilenceUI.style.backgroundColor = 'grey';
				setSpeechHarkOnSilenceUI.style.width = setSpeechHarkOnSilenceUI.style.height = '20px';
			}

			if (isAdmin && document.getElementById(message.userOnSilence.pid)) {
				document.getElementById(message.userOnSilence.pid).style.backgroundColor = '#ffffff';
			}
		}
		if (message.userOnSpeaking) {
			//DEBUG && console.log('onspeaking', message.userOnSpeaking.pid);
			var setSpeechHarkOnSpeakingUI = document.getElementById('speechHark-' + message.userOnSpeaking.pid);
			if (setSpeechHarkOnSpeakingUI) {
				setSpeechHarkOnSpeakingUI.style.backgroundColor = '#ff9b00'; // getRandomColor();
				setSpeechHarkOnSpeakingUI.style.width = setSpeechHarkOnSpeakingUI.style.height = '20px';
			}
			if (isAdmin && document.getElementById(message.userOnSpeaking.pid)) {
				document.getElementById(message.userOnSpeaking.pid).style.backgroundColor = 'oldlace';
			}
		}

		if (message.userMuteAudio && !isView && !isAdmin) { //
			if (!connection.extra.adminEnableStatus) return;

			if (connection.extra.broadcaster && connection.userid == message.userMuteAudio.pid || message.userMuteAudio.pid == 'all') {
				if (message.userMuteAudio.volume == 0) mute('audio');
				if (message.userMuteAudio.volume == 1) unmute('audio');
				localMicrophoneSignalVolume(message.userMuteAudio.volume);

				DEBUG && console.log('==== userMuteAudio command from Admin ===== ', (message.userMuteAudio.volume == 1) ? 'on' : 'off');
			}
		}

		if (message.userAlert && !isView) { //send message to broadcasters
			if (!connection.extra.adminEnableStatus) return;

			//DEBUG && console.log('custom message', message);
			if (connection.userid == message.userAlert.pid || message.userAlert.pid == 'all') {
				mess = decodeURIComponent(message.userAlert.message) + '<br /><p style="font-size:10px;"><i>(Message from Admin ' + message.userAlert.adminid + ')</i></p>';
				statusHeaderHandler(mess, 10000);

				DEBUG && console.log('==== userAlert command from Admin =====', message.userAlert.adminid);
			}
		}

		if (message.userQualityParams && !isView && !isAdmin) { //to change stream quality to all broadcasters
			if (!connection.extra.adminEnableStatus) return;

			if (message.userQualityParams.pid.trim() == connection.userid || message.userQualityParams.pid == 'all') {

				if (Object.keys(libConstraints).includes(message.userQualityParams.quality) && cameraPermission) {
					if (selectStreamQuality.value != message.userQualityParams.quality) {
						selectStreamQuality.value = message.userQualityParams.quality;
						selectStreamQuality.onchange();
					}
				}
				if (Object.keys(libBandwidth).includes(message.userQualityParams.bandwidth)) {
					if (selectBandwidth.value != message.userQualityParams.bandwidth) {
						selectBandwidth.value = message.userQualityParams.bandwidth;
						selectBandwidth.onchange();
					}
				}
				if (message.userQualityParams.audiohandling == 'pitch-shifter' || message.userQualityParams.audiohandling == 'default') {
					selectAudioHandling.value = message.userQualityParams.audiohandling;
					shiftSliderTextValue.value = shiftSlider.value = message.userQualityParams.audiohandlingShiftSliderValue;
					AudioHandlingToggle(selectAudioHandling.value);
				}
				if (message.userQualityParams.transportPolicy === 'default' || message.userQualityParams.transportPolicy === 'stun' || message.userQualityParams.transportPolicy === 'turn' || message.userQualityParams.transportPolicy === 'google') {
					if (transportPolicyHTML.value != message.userQualityParams.transportPolicy) {
						transportPolicyHTML.value = message.userQualityParams.transportPolicy;
						transportPolicyHTML.onchange();
					}
				}
				if (message.userQualityParams.roomParticipantsNumber) {
					MaxParticipantsNumber.value = sanitizeIntParams(message.userQualityParams.roomParticipantsNumber);
				}

				if (message.userQualityParams.enableviewers === true || message.userQualityParams.enableviewers === false) {
					enableViewers = message.userQualityParams.enableviewers;
					enableViewersHandler();
				}
				if (message.userQualityParams.enableadmins === true || message.userQualityParams.enableadmins === false) {
					enableAdmins = message.userQualityParams.enableadmins;
					enableAdminsHandler();
				}

				if (message.userQualityParams.walkietalkie === true || message.userQualityParams.walkietalkie === false) {
					walkieTalkieModeEnable = message.userQualityParams.walkietalkie;
					SpacebarToggleLocalMicrophone();
				}

				if (message.userQualityParams.rotatevideo === 'default' || message.userQualityParams.rotatevideo === 'rotate') {
					selectRotateVideo.value = message.userQualityParams.rotatevideo;
					selectRotateVideo.onchange();
				}

				if (message.userQualityParams.displayaspectRatio) {
					aspectRatio.value = message.userQualityParams.displayaspectRatio;
					aspectRatio.onchange();
				}
				if (message.userQualityParams.displayframeRate) {
					frameRate.value = message.userQualityParams.displayframeRate;
					frameRate.onchange();
				}
				if (message.userQualityParams.displaycursor) {
					cursor.value = message.userQualityParams.displaycursor;
					cursor.onchange();
				}

				changeLinksInRoomUrlsPanel('broadcaster', false, true);

				DEBUG && console.log('==== userQualityParams command from Admin ===== ');
			}
		}

		if (message.userVolumeMedia && isView && !soundOff) {
			if (!connection.extra.adminEnableStatus) return;

			if (RemoteMediaTrack[message.userVolumeMedia.pid]) {
				RemoteMediaTrack[message.userVolumeMedia.pid].volume = message.userVolumeMedia.volume;
				//DEBUG && console.log(message.userVolumeMedia.pid, message.userVolumeMedia.volume);
			}
		}

		if (message.userCloseConnect) {
			if (!connection.extra.adminEnableStatus) return;

			if ((message.userCloseConnect.pid.trim() == connection.userid || message.userCloseConnect.pid == 'all')) {
				DEBUG && console.log('==== userCloseConnect command from Admin ===== ');
				setTimeout(function() {
					if (isAdmin) {
						mess = 'Stop admin mode';
						statusHeaderHandler(mess);
						connection.getAllParticipants().forEach(function(p) {
							connection.disconnectWith(p);
						})
						clearAdminUsersPanel();
						adminMessageContainerHTML.innerHTML = usresHTML.innerHTML = usersPanelHTML.innerHTML = '';

					} else if (isView) {
						mess = 'Stop view mode';
						statusHeaderHandler(mess);

						connection.getAllParticipants().forEach(function(p) {
							connection.peers[p].peer.getRemoteStreams().forEach(function(stream) {
								stream.stop();
							});
							connection.disconnectWith(p);
						});
						connection.videosContainer.remove();

					} else {
						mess = 'Stop broadcaster mode';
						statusHeaderHandler(mess);
						connection.getAllParticipants().forEach(function(p) {
							connection.attachStreams.forEach(function(stream) {
								connection.peers[p].peer.removeStream(stream);
							});
							connection.disconnectWith(p);
						});
						connection.attachStreams.forEach(function(stream) {
							stream.stop();
						});
					}

					setTimeout(function() {
						disableAfterSocketDisconnectReconnect = true;
						connection.close();
						connection.closeSocket();

						buttonOpenjoin.onclick = connection.join = connection.open = connection.onstream = removeBrokenMediaContainers = function() {};
					}, 500);
				}, 500);
			} else {

			}
		}

		if (message.userReload) {
			if (!connection.extra.adminEnableStatus) return;

			if ((message.userReload.pid.trim() == connection.userid || message.userReload.pid == 'all')) {
				DEBUG && console.log('==== userReload command from Admin ===== ');

				if (connection.extra.broadcaster) changeLinksInRoomUrlsPanel('broadcaster', false, true);

				setTimeout(function() {
					location.reload();
				}, Math.floor(Math.random() * 1500) + 1000);
			}
		}

		if (message.newRoom) { //for broadcasters and admins
			if (!connection.extra.adminEnableStatus) return;
			if (connection.extra.viewer) return;

			DEBUG && console.log('==== newRoom command from Admin ===== ');
			connectToNewRoom(message.newRoom);
		}

		if (message.userReconnect) {
			if (!connection.extra.adminEnableStatus) return;

			if ((message.userReconnect.pid.trim() == connection.userid || message.userReconnect.pid == 'all')) {
				setTimeout(function() {
					connection.getAllParticipants().forEach(function(pid) {
						connection.disconnectWith(pid);
					});

					if (connection.extra.broadcaster) changeLinksInRoomUrlsPanel('broadcaster', false, true);

					setTimeout(function() {
						connection.close();
						connection.closeSocket();

						DEBUG && console.log('==== userReconnect command from Admin ===== ');
					}, Math.floor(Math.random() * 1000) + 500);
				}, 1000);
			}
		}

		if (message.userRenegotiate) {
			if (!connection.extra.adminEnableStatus) return;

			if ((message.userRenegotiate.pid.trim() == connection.userid || message.userRenegotiate.pid == 'all') && !isAdmin) {
				if (connection.extra.broadcaster) changeLinksInRoomUrlsPanel('broadcaster', false, true);
				setTimeout(function() {
					connection.renegotiate();
					DEBUG && console.log('==== userRenegotiate command from Admin ===== ');
				}, Math.floor(Math.random() * 1000) + 500);
			}
		}

		if (message.userJoin) {
			if (!connection.extra.adminEnableStatus) return;

			if (connection.extra.broadcaster) changeLinksInRoomUrlsPanel('broadcaster', false, true);

			DEBUG && console.info('Command to Join');
			if (message.userJoin.pid.trim() == connection.userid || message.userJoin.pid == 'all') {
				setTimeout(function() {
					DEBUG && console.info('Command to Join');
					startJoinRoom();
					DEBUG && console.log('==== userJoin command from Admin ===== ');
				}, Math.floor(Math.random() * 1000) + 500);
			}
		}

		if (message.userDeleteFromBackup && isAdmin) {
			if (!connection.extra.adminEnableStatus) return;
			var pid = message.userDeleteFromBackup;
			disableUserParams(pid, userBackup[pid]);
			userDeleteHandler(pid);
			delete userBackup[pid];
			DEBUG && console.log('==== userDeleteFromBackup from Broadcaster ', message.userDeleteFromBackup, '===== ');
		}
	});
}

/* --/////-- */
 // Source: ui/dev/share-screen.js
// screen sharing codes goes here
// from  https://github.com/muaz-khan/WebRTC-Experiment/tree/master/getDisplayMedia
document.getElementById('share-screen').onclick = function() {
	if (RMCMediaTrack.cameraVideoTrack) {
		captureScreenStream();
	}
};
document.getElementById('stop-share-screen').style.display = 'none';
document.getElementById('stop-share-screen').onclick = function() {
	this.style.display = 'none';
	stopCaptureScreenStream();
};


function stopCaptureScreenStream() {

	if (RMCMediaTrack.screen != null) {
		RMCMediaTrack.screen.stop();

		if (RMCMediaTrack.cameraStream.getVideoTracks()[0].readyState) {
			RMCMediaTrack.cameraStream.getVideoTracks().forEach(function(track) {
				RMCMediaTrack.cameraStream.removeTrack(track);
			});
			RMCMediaTrack.cameraStream.addTrack(RMCMediaTrack.cameraVideoTrack);


			RMCMediaTrack.selfVideo.srcObject = RMCMediaTrack.cameraStream;

			// share camera again
			replaceTrack(RMCMediaTrack.cameraVideoTrack);
			// now remove old screen from "attachStreams" array
			connection.attachStreams = [RMCMediaTrack.cameraStream];
		}

		document.getElementById('share-screen').style.display = '';
		document.getElementById('stop-share-screen').style.display = 'none';

		selectRotateVideo.value = selectRotateVideo[0].value; //default
		selectRotateVideo.onchange();
		RMCMediaTrack.screen = null;
	}
}


function replaceTrack(videoTrack) {
	if (!videoTrack) return;
	if (videoTrack.readyState === 'ended') {
		DEBUG && console.log('Can not replace an "ended" track. track.readyState: ' + videoTrack.readyState);
		return;
	}
	connection.getAllParticipants().forEach(function(pid) {
		var peer = connection.peers[pid].peer;
		if (!peer.getSenders) return;
		var trackToReplace = videoTrack;
		peer.getSenders().forEach(function(sender) {
			if (!sender || !sender.track) return;
			if (sender.track.kind === 'video' && trackToReplace) {
				sender.replaceTrack(trackToReplace);
				trackToReplace = null;
			}
		});
	});
}


function captureScreenStream() {
	if (navigator.getDisplayMedia || navigator.mediaDevices.getDisplayMedia) {

		if (!RMCMediaTrack.cameraVideoTrack) return;

		function onGettingSteam(screen) {

			if (RMCMediaTrack.preRecorededStream) {
				preRecordedMediaClose.onclick();
			}

			replaceTrack(screen.getVideoTracks()[0]);

			RMCMediaTrack.screen = screen.getVideoTracks()[0];
			RMCMediaTrack.selfVideo.srcObject = screen;

			// now remove old video track from "attachStreams" array
			// so that newcomers can see screen as well
			connection.attachStreams.forEach(function(stream) {
				stream.getVideoTracks().forEach(function(track) {
					stream.removeTrack(track);
				});
				// now add screen track into that stream object
				stream.addTrack(screen.getVideoTracks()[0]);
			});

			// event Handler for stop sharing button in chrome browser. The "stop sharing" button will trigger the MediaStreamTracks 'ended' event.
			addStreamStopListener(screen, function() {
				DEBUG && console.log('screensharing has ended');
				stopCaptureScreenStream();
			});


			if (connection.enableLogs) {
				DEBUG && console.info('capabilities:\n\n' + JSON.stringify(RMCMediaTrack.screen.getCapabilities(), null, '\t'));
			}

			document.getElementById('stop-share-screen').style.display = '';
			selectRotateVideo.value = selectRotateVideo[1].value; // rotate
			selectRotateVideo.onchange();
		}


		function addStreamStopListener(stream, callback) {
			stream.addEventListener('ended', function() {
				callback();
				callback = function() {};
			}, false);
			stream.addEventListener('inactive', function() {
				callback();
				callback = function() {};
			}, false);
			stream.getTracks().forEach(function(track) {
				track.addEventListener('ended', function() {
					callback();
					callback = function() {};
				}, false);
				track.addEventListener('inactive', function() {
					callback();
					callback = function() {};
				}, false);
			});
		}

		var displayConstraints;
		if (!Object.keys(selectConstraintsForDisplayMediaStream()).length) {
			displayConstraints = true;
		} else {
			displayConstraints = selectConstraintsForDisplayMediaStream();
		}

		var displayMediaStreamConstraints = {
			video: displayConstraints
		};

		if (navigator.mediaDevices.getDisplayMedia) {
			navigator.mediaDevices.getDisplayMedia(displayMediaStreamConstraints)
				.then(stream => {
					//DEBUG && console.log(displayMediaStreamConstraints);
					onGettingSteam(stream);
					document.getElementById('share-screen').style.display = 'none';
				})
				.catch(err => {
					getDisplayMediaError(err);
				});
		} else if (navigator.getDisplayMedia) {
			navigator.getDisplayMedia(displayMediaStreamConstraints)
				.then(stream => {
					onGettingSteam(stream);
				})
				.catch(err => getDisplayMediaError(err));
		}
	} else {
		if (DetectRTC.browser.name === 'Chrome') {
			if (DetectRTC.browser.version == 71) {
				showErrorMessage('Please enable "Experimental WebPlatform" flag via chrome://flags.');
			} else if (DetectRTC.browser.version < 71) {
				showErrorMessage('Please upgrade your Chrome browser.');
			} else {
				showErrorMessage('Please make sure that you are not using Chrome on iOS.');
			}
		}
		if (DetectRTC.browser.name === 'Firefox') {
			showErrorMessage('Please upgrade your Firefox browser.');
		}
		if (DetectRTC.browser.name === 'Edge') {
			showErrorMessage('Please upgrade your Edge browser.');
		}
		if (DetectRTC.browser.name === 'Safari') {
			showErrorMessage('Safari does NOT supports getDisplayMedia API yet.');
		}
	}
}

function getDisplayMediaError(error) {
	if (location.protocol === 'http:') {
		showErrorMessage('Please test this WebRTC experiment on HTTPS.');
	} else {
		showErrorMessage(error.toString());
	}
}

function showErrorMessage(error, color) {
	color = color || 'red';
	statusHeaderHandler(error, 5000, color);
}

/* --/////-- */
 // Source: ui/dev/send-file.js
// https://github.com/muaz-khan/RTCMultiConnection/blob/master/demos/Audio%2BVideo%2BTextChat%2BFileSharing.html
// https://www.rtcmulticonnection.org/docs/onFileStart/

// ......................................................
// ................FileSharing Code.............
// ......................................................
connection.enableFileSharing = true; // by default, it is "false"
// both chrome/firefox now accepts 64 kilo-bits for each data-chunk
connection.chunkSize = 60 * 1000;

connection.filesContainer = document.getElementById('file-container');
connection.filesContainer.style = 'background-color: #FFE0B2;';


var clearFileContainerButton = document.createElement('button');
clearFileContainerButton.style.display = 'none';
clearFileContainerButton.setAttribute('id', 'clear-button');
clearFileContainerButton.innerHTML = 'Clear file container';
clearFileContainerButton.setAttribute('onclick', 'clearFileContainer()');


var blobFileSelector;
document.getElementById('share-file').disabled = false;
document.getElementById('share-file').onclick = function(file) {
	if (connection.getAllParticipants().length == 0) return;
	//if (connection.fbr) return;

	var fileSelector = new FileSelector();
	fileSelector.selectSingleFile(function(file) {
		if (!file && !file.size) {
			return;
		}

		connection.filesContainer.innerHTML = 'Wait a bit...';

		blobFileSelector = file;
		connection.getAllParticipants().forEach(function(pid) {
			if (pid == connection.userid) return;
			if (connection.peers[pid].extra.viewer === true) return;
			//console.log('blob file', file, file.url);
			connection.send(file, pid);
		});

	});
};


connection.onFileProgress = function(chunk) {
	//DEBUG && console.log('onFileProgress', chunk);

	var helper = progressHelper[chunk.remoteUserId];
	helper.progress.value = chunk.currentPosition || chunk.maxChunks || helper.progress.max;
	updateLabel(helper.progress, helper.label);
};

function updateLabel(progress, label) {
	if (progress.position == -1) return;
	var position = +progress.position.toFixed(2).split('.')[1] || '---';
	label.innerHTML = position + '%';
}

var progressHelper = {};
connection.onFileStart = function(file) {
	//DEBUG && console.log('onFileStart', file);


	var div = document.createElement('div');
	div.id = 'share-div-box-' + file.remoteUserId + '-' + file.uuid;
	div.title = file.name;
	div.className = 'file-info';
	if (connection.userid == file.userid) {
		div.innerHTML = 'Send to user ' + file.remoteUserId + ' the file ' + file.name + ' (' + Math.round(file.size / 1000) + ' kbytes) <label>0%</label> <progress></progress>';
	} else {
		div.innerHTML = 'You receive file from user ' + file.userid + ' the file ' + file.name + ' (' + Math.round(file.size / 1000) + ' kbytes) <label>0%</label> <progress></progress>';
	}

	if (clearFileContainerButton.style.display == 'none') {
		clearFileContainerButton.style.display = '';

	}
	connection.filesContainer.innerHTML = '';
	connection.filesContainer.appendChild(div);
	connection.filesContainer.appendChild(clearFileContainerButton);

	progressHelper[file.remoteUserId] = {
		div: div,
		progress: div.querySelector('progress'),
		label: div.querySelector('label')
	};
	progressHelper[file.remoteUserId].progress.max = file.maxChunks;
};




var fileStatusBox = {};
connection.onFileEnd = function(file) {
	//DEBUG && console.log(file);
	//DEBUG && console.log('onFileEnd', file, fileStatusBox[file.uuid]);

	setTimeout(function() {
		if (document.getElementById('share-div-box-' + file.remoteUserId + '-' + file.uuid)) document.getElementById('share-div-box-' + file.remoteUserId + '-' + file.uuid).remove();
	}, 200);

	if (fileStatusBox[file.uuid]) return;

	var div = document.createElement('div');
	div.id = 'preview-div-box-' + file.uuid;
	div.title = file.name;

	connection.filesContainer.appendChild(div);

	fileStatusBox[file.uuid] = {
		div: div
	};

	if (file.remoteUserId !== connection.userid) {
		fileStatusBox[file.uuid].div.innerHTML = '<br />You sent the file: ';
	} else {
		fileStatusBox[file.uuid].div.innerHTML = '<br />Receive from user <span style="color:#f17f5d">' + file.remoteUserId + '</span> the file: ';
	}

	fileStatusBox[file.uuid].div.innerHTML += '<a href="' + file.url + '" target="_blank" download="' + file.name + '">' + file.name + ' (' + bytesToSize(file.size) + ') Click to Download</a> || <a href="#" id="file-attachment-delete-' + file.name + '">Delete</a>';

	var fileNameMatches = (file.name || '').toLowerCase().match(/.webm|.wav|.mp3|.ogg|.flac|.mp4|.avi|.pdf|.txt|.js|.css|.cs|.png|.jpg|.jpeg|.gif/g);
	if (fileNameMatches) {
		fileStatusBox[file.uuid].div.innerHTML += ' || <a href="#" id="file-attachment-display-on-' + file.name + '">Preview</a><br />';

		// watch the attachment
		var attachmentDisplayOn = document.getElementById('file-attachment-display-on-' + file.name);

		if (attachmentDisplayOn) {
			attachmentDisplayOn.addEventListener("click", function(e) {
				attachmentDisplayOn.style.display = 'none';
				fileStatusBox[file.uuid].div.innerHTML += getFileHTML(file);
				attachmentDelete(file);
			});
		}
	}

	connection.filesContainer.appendChild(clearFileContainerButton);
	attachmentDelete(file);
	fileLinksArray.push(file.url);
	setTimeout(Resize, 500);
};

var fileLinksArray = [];

function clearFileContainer() {
	connection.filesContainer.innerHTML = '';
	clearFileContainerButton.style.display = 'none';
	for (var i = 0; i < fileLinksArray.length; i++) {
		window.URL.revokeObjectURL(fileLinksArray[i]);
	}
	if (blobFileSelector && blobFileSelector.url) window.URL.revokeObjectURL(blobFileSelector.url);
	fileLinksArray = [];
	connection.fbr = null;

	setTimeout(Resize, 500);
}

function attachmentDelete(file) {
	var attachmentElemDelete = document.getElementById('file-attachment-delete-' + file.name);
	if (attachmentElemDelete) {
		attachmentElemDelete.addEventListener("click", function(e) {
			window.URL.revokeObjectURL(file.url);

			fileStatusBox[file.uuid].div.remove();
			remove(fileLinksArray, file.url);


			if (fileLinksArray.length == 0) clearFileContainerButton.style.display = 'none';

			setTimeout(Resize, 500);
		});
	}
}


function remove(array, element) {
	const index = array.indexOf(element);
	array.splice(index, 1);
}

function getFileHTML(file) {
	var url, attachment;
	url = file.url || URL.createObjectURL(file);

	if (file.type.indexOf('image') != -1) {
		attachment = '<br /><img src="' + url + '" title="' + file.name + '" style="max-width: 80%;">';
	} else {
		attachment = '<br /><iframe src="' + url + '" title="' + file.name + '" style="width: 80%;height: inherit;border: 0;display:block; margin: 0 auto;"></iframe><br />';
	}

	return attachment;
}

/* --/////-- */
 // Source: ui/dev/pre-recoreded-stream.js
var preRecorededStreamStatus = false;
var preRecordedMedia = document.getElementById('pre-recorded-media');
var preRecordedMediaClose = document.getElementById('pre-recorded-media-on');
preRecordedMedia.onclick = function() {
	preRecorededStreamStatus = true;

	if (typeof(connection.attachStreams[0]) == "undefined") return;

	var selector = new FileSelector();
	selector.accept = '*.webm'; // webm or mp4 or mp3 or wav or ogg
	selector.selectSingleFile(function(file) {

		if (!file && !file.size) {
			return;
		}
		if (file.name.search(/.webm|.wav|.mp3|.ogg|.flac|.mp4/g) === -1) {
			alert('Please select either .webm, .wav, .mp3, .ogg, .flac or .mp4 file.');
			return;
		}

		if (RMCMediaTrack.screen) {
			stopCaptureScreenStream();
		}

		preRecordedMedia.style.display = 'none';
		preRecordedMediaClose.style.display = '';


		var video = document.createElement('video');
		var blobURI = URL.createObjectURL(file);
		var timeId = '0' // starts at few seconds
		video.src = blobURI + '#t=' + timeId; //here you set the fragId

		video.loop = true;
		video.poster = 'preload.png';
		video.muted = true;
		video.volume = 0;
		video.play();

		RMCMediaTrack.selfVideo.setAttribute('loop', true);
		selectRotateVideo.value = selectRotateVideo[1].value; // rotate
		selectRotateVideo.onchange();

		setTimeout(function() {
			try {
				if ('captureStream' in video) {
					RMCMediaTrack.preRecorededStream = video.captureStream();
				} else if ('mozCaptureStream' in video) {
					RMCMediaTrack.preRecorededStream = video.mozCaptureStream();
				} else if ('webkitCaptureStream' in video) {
					RMCMediaTrack.preRecorededStream = video.webkitCaptureStream();
				}
			} catch (e) {
				RMCMediaTrack.preRecorededStream = null;
			}
			if (!RMCMediaTrack.preRecorededStream) {
				return;
			}

			// attach pre-recorded steam
			if (RMCMediaTrack.cameraVideoTrack !== null) {
				if (RMCMediaTrack.preRecorededStream.getAudioTracks()[0]) {
					replaceAudioTrack(RMCMediaTrack.preRecorededStream.getAudioTracks()[0]);
					connection.attachStreams.forEach(function(stream) {
						stream.getAudioTracks().forEach(function(track) {
							stream.removeTrack(track);
						});
						stream.addTrack(RMCMediaTrack.preRecorededStream.getAudioTracks()[0]);
					});
				}
				if (RMCMediaTrack.preRecorededStream.getVideoTracks()[0]) {
					replaceTrack(RMCMediaTrack.preRecorededStream.getVideoTracks()[0]);

					connection.attachStreams.forEach(function(stream) {
						stream.getVideoTracks().forEach(function(track) {
							stream.removeTrack(track);
						});
						stream.addTrack(RMCMediaTrack.preRecorededStream.getVideoTracks()[0]);
					});
				}
			} else {

				RMCMediaTrack.selfVideo.srcObject = RMCMediaTrack.preRecorededStream;

				connection.attachStreams = [RMCMediaTrack.preRecorededStream];
				setTimeout(function() {
					if (RMCMediaTrack.preRecorededStream.getAudioTracks()[0]) {
						replaceAudioTrack(RMCMediaTrack.preRecorededStream.getAudioTracks()[0]);
					}
					if (RMCMediaTrack.preRecorededStream.getVideoTracks()[0]) {
						replaceTrack(RMCMediaTrack.preRecorededStream.getVideoTracks()[0]);
					}
				}, 2000);
			}

			//setTimeout(function () { 
			if (typeof(connection.attachStreams[0]) == "undefined") return;

			hark(connection.attachStreams[0]).stop(); //stop microphone level meter - initHark

			SpacebarToggleLocalMicrophone();
			//}, 500);

			preRecordedMediaClose.onclick = function() { //return webcam 
				preRecordedMedia.style.display = '';
				preRecordedMediaClose.style.display = 'none';

				statusHeaderHandler();

				if (RMCMediaTrack.cameraVideoTrack !== null) {
					selectRotateVideo.value = selectRotateVideo[0].value; //default
					selectRotateVideo.onchange();

					preRecorededStreamStatus = false;

					RMCMediaTrack.selfVideo.removeAttribute('loop', true);

					if (RMCMediaTrack.cameraVideoTrack) {
						RMCMediaTrack.cameraStream.getVideoTracks().forEach(function(track) {
							RMCMediaTrack.cameraStream.removeTrack(track);
						});
						RMCMediaTrack.cameraStream.addTrack(RMCMediaTrack.cameraVideoTrack);
						replaceTrack(RMCMediaTrack.cameraVideoTrack);
					}

					RMCMediaTrack.cameraStream.getAudioTracks().forEach(function(track) {
						RMCMediaTrack.cameraStream.removeTrack(track);
					});


					// share audio again
					if (RMCMediaTrack.audioHandler) { //share pitch-shifter stream
						RMCMediaTrack.cameraStream.addTrack(RMCMediaTrack.audioHandler);
						replaceAudioTrack(RMCMediaTrack.audioHandler);

					} else {
						RMCMediaTrack.cameraStream.addTrack(RMCMediaTrack.cameraAudioTrack);
						replaceAudioTrack(RMCMediaTrack.cameraAudioTrack);
					}

					connection.attachStreams = [RMCMediaTrack.cameraStream];

				} else {

					RMCMediaTrack.selfVideo.srcObject = RMCMediaTrack.cameraStream;

					// share audio again
					if (RMCMediaTrack.audioHandler) { //share pitch-shifter stream
						stopAudioHandling();
						setTimeout(function() {
							startAudioHandling();
							RMCMediaTrack.cameraStream.addTrack(RMCMediaTrack.audioHandler);
							replaceAudioTrack(RMCMediaTrack.audioHandler);
						}, 1000);

					} else {
						RMCMediaTrack.cameraStream.addTrack(RMCMediaTrack.cameraAudioTrack);
						replaceAudioTrack(RMCMediaTrack.cameraAudioTrack);
						connection.attachStreams = [RMCMediaTrack.cameraStream];
					}
				}


				setTimeout(function() {
					RMCMediaTrack.preRecorededStream.getTracks().forEach(track => track.stop());
					RMCMediaTrack.preRecorededStream = null;
					startHark(); // start hark
				}, 1000);


				window.URL.revokeObjectURL(file);

			}
		}, 2000);
	});
}

/* --/////-- */
 // Source: ui/dev/stream-canvas.js
const scriptCanvasDesignerWidget = document.createElement('script');
scriptCanvasDesignerWidget.src = '/dist/canvas-designer/canvas-designer-widget.js';
//'/node_modules/canvas-designer/canvas-designer-widget.js'; 
scriptCanvasDesignerWidget.defer = true;
document.body.appendChild(scriptCanvasDesignerWidget);

document.getElementById('draw').onclick = function() {
	if (connection.streamEvents.selectAll().length == 0) return;
	this.style.display = 'none';
	document.getElementById('stop-draw').style.display = '';
	startDraw();
}

document.getElementById('stop-draw').style.display = 'none';
document.getElementById('stop-draw').onclick = function() {
	this.style.display = 'none';
	document.getElementById('draw').style.display = '';
	stopDraw();
};


var drawContainer = document.getElementById('draw-container');

// here goes canvas designer
var designer, linkToImage;

function startDraw() {
	if (connection.streamEvents.selectAll().length == 0) return;
	if (isView || isAdmin) return;

	drawContainer.style.display = '';

	if (!designer) {

		linkToImage = document.createElement('a');
		linkToImage.id = 'link-to-download-draw-image';
		linkToImage.style = 'background-color:antiquewhite;';
		linkToImage.target = '_blank';
		linkToImage.download = 'image.png';
		linkToImage.innerHTML = 'Click to Download Image';
		drawContainer.appendChild(linkToImage);

		designer = new CanvasDesigner();

		designer.widgetHtmlURL = '/dist/canvas-designer/widget.html'; // widget.html will internally use widget.js
		designer.widgetJsURL = '/dist/canvas-designer/widget.js'; //'/dist/canvas-designer/widget.min.js';

		designer.setSelected('pencil');
		designer.setTools({
			pencil: true,
			colorsPicker: true,
			text: true,
			image: true,
			pdf: true,
			eraser: true,
			line: true,
			arrow: true,
			dragSingle: true,
			dragMultiple: true,
			arc: true,
			rectangle: true,
			quadratic: true,
			bezier: false,
			marker: true,
			zoom: false,
			lineWidth: true,
			extraOptions: false,
			code: false,
			undo: true
		});

		designer.appendTo(drawContainer);
	}

	drawContainer.style = 'border: 1px solid orange; margin: auto;';
	designer.iframe.style.width = drawContainer.style.width = Math.round(document.getElementById('videos-container').clientWidth) + 'px';
	designer.iframe.style.height = drawContainer.style.height = Math.round(document.getElementById('videos-container').clientHeight / 1.5 - linkToImage.clientHeight) + 'px';
	/*document.body.onresize = function(e) {
		drawContainer.style.width = document.getElementById('videos-container').clientWidth + 'px';
		drawContainer.style.height = document.getElementById('videos-container').clientHeight/3 + 'px';
		//DEBUG && console.log(drawContainer.style.width);
	}*/
	Resize();
	getDataURL();

	if (designer && designer.pointsLength <= 0) {
		// make sure that remote user gets all drawings synced.
		setTimeout(function() {
			connection.send('plz-sync-points');
		}, 1000);
	}

	designer.addSyncListener(function(data) {
		//DEBUG && console.log(data);
		connection.send({
			designerMessage: data
		});

		getDataURL();
	});


}

function getDataURL() {
	designer.toDataURL('image/png', function(dataURL) {
		linkToImage.href = dataURL;
	});
}

function stopDraw() {
	if (connection.streamEvents.selectAll().length == 0) return;
	if (!designer) return;
	DEBUG && console.log('stopDraw');
	//designer.clearCanvas();
	designer.destroy();
	designer = null;
	linkToImage.href = '';
	linkToImage.innerHTML = '';
	drawContainer.style.display = 'none';
	Resize();
}

/* --/////-- */
 // Source: ui/dev/record.js
const enableRecordVideo = (siteConfigEnableForViewersToRecordVideo === 'true') ? true : false;

if (isView === true && enableRecordVideo === true) {
	checkAdminEnableStatus();
}

function checkAdminEnableStatus() {
	if (enableAdmins == true && enableRecordVideo === true) {
		if (typeof RecordRTC == 'undefined') {
			addRecordScript(); // load scripts
			addRecordUI(); // add interface
		}
		if (!connection.recorder) {
			document.getElementById('record-off').style.display = '';
			document.getElementById('record-on').style.display = 'none';
		} else {
			document.getElementById('record-off').style.display = 'none';
			document.getElementById('record-on').style.display = '';
		}

	} else {
		if (typeof RecordRTC != 'undefined') {
			document.getElementById('record-off').style.display = 'none';
			document.getElementById('record-on').style.display = 'none';

			if (connection.recorder) document.getElementById('record-on').onclick();
		}
	}

	setTimeout(checkAdminEnableStatus, 2000);
}

function addRecordScript() {
	if (!isView && !enableRecordVideo) return;

	var scriptRecordRTC = document.createElement('script');
	scriptRecordRTC.src = '/dist/RecordRTC.min.js'; // '/node_modules/recordrtc/RecordRTC.min.js';
	scriptRecordRTC.defer = true;
	document.body.appendChild(scriptRecordRTC);

	var scriptSeekableWebM = document.createElement('script');
	scriptSeekableWebM.src = '/dist/EBML.min.js'; // EBML.js to fix video seeking issues 
	scriptSeekableWebM.defer = true;
	document.body.appendChild(scriptSeekableWebM);
}

function addRecordUI() {
	if (!isView && !enableRecordVideo) return;
	if (document.getElementById('record-off')) return;

	var recordIconOffUI = document.createElement('label');
	recordIconOffUI.innerHTML = '<label><img id="record-off" src="record-off.png" class="icon-menu" title="Start Record" />';
	var recordIconOnUI = document.createElement('label');
	recordIconOnUI.innerHTML = '<label><img id="record-on" src="record-on.png" class="icon-menu" style="display: none;" title="Stop Record" />'
	document.getElementById('menu').appendChild(recordIconOffUI);
	document.getElementById('menu').appendChild(recordIconOnUI);


	document.getElementById('record-off').onclick = function() {
		if (connection.streamEvents.selectAll().length == 0) return;
		if (!connection.extra.adminEnableStatus) return;
		startRecordHandler();
		Resize();
		document.getElementById('record-off').style.display = 'none';
		document.getElementById('record-on').style.display = '';
	}
	document.getElementById('record-on').onclick = function() {
		stopRecordHandler();
		document.getElementById('record-off').style.display = '';
		document.getElementById('record-on').style.display = 'none';
	}

	var isRecord = (params.record == 'true') ? true : false;
	if (isRecord === true) {
		setTimeout(function() {
			document.getElementById('record-off').onclick();
		}, 5000);
	}
}


var recordingDuration;
var recordUI;
var recordingStatus;
var btnStopRecording;
var timeoutRecordingStatusHandling;
var timeStartRecord, timeNowRecord, timeTotalRecord;

function startRecordHandler() {
	if (!isView && !enableRecordVideo) return;
	if (!enableAdmins) return;

	if (connection.streamEvents.selectAll().length == 0) return;


	recordUI = document.createElement('div');
	recordUI.setAttribute('id', 'record-container');
	recordUI.innerHTML = '<span id="recording-status" style="display: none;"></span><button id="btn-stop-recording" style="display: none;">Stop Recording</button><br /><br />';
	connection.filesContainer.appendChild(recordUI);

	recordingStatus = document.getElementById('recording-status');
	btnStopRecording = document.getElementById('btn-stop-recording');

	btnStopRecording.style.display = 'inline-block';
	recordingStatus.style.display = 'inline-block';

	timeStartRecord = +new Date();

	recordingStatusHandling();

	function recordingStatusHandling() {
		connection.streamEvents.selectAll({
			remote: true
		}).forEach(function(event) {
			if (!connection.recorder && !document.getElementById('record-preview')) {
				DEBUG && console.log('RecordRTC', event);
				connection.recorder = RecordRTC([event.stream], { // config https://github.com/muaz-khan/RecordRTC/
					//mimeType: 'video/webm',
					mimeType: 'video/webm;codecs=h264',
					fileExtension: 'mp4',
					type: 'video',
					// both for audio and video tracks
					//bitsPerSecond: 128000,
					//audioBitsPerSecond: 128000, //256 * 8 * 1024, // min: 100bps max: 6000bps
					//videoBitsPerSecond: 256 * 8 * 1024, // min: -5000bps max: 100000bps

					disableLogs: DEBUG, // disable logs
					timeSlice: 1000,

					onTimeStamp: function(timestamp) {
						timeNowRecord = timestamp;
					},

					video: {
						width: 640,
						height: 360 //if 16:4 set 480px
					},

					previewStream: function(stream) {
						if (document.getElementById('record-preview')) return;
						connection.filesContainer.setAttribute('style', 'font-size:0;background-color: rgb(255, 224, 178);padding: 3px;');
						var pUI = document.createElement('p');
						pUI.style = 'position: absolute; color: #FFF3E0; background-color: #424242; font-size: 1.5vw; padding: 0; margin: 0; text-align: center; border: 0; z-index: 1; word-wrap: break-word; white-space: pre-wrap;';
						pUI.innerHTML = 'Preview record video';
						var video = document.createElement('video');
						video.setAttribute('autoplay', true);
						video.setAttribute('playsinline', true);
						video.setAttribute('poster', true);
						video.setAttribute('controls', true);
						video.setAttribute('style', true);
						video.poster = 'preload.png';
						video.id = 'record-preview';
						video.muted = true;
						video.srcObject = stream;
						video.tabIndex = 0;
						video.focus();
						video.play();

						connection.filesContainer.appendChild(pUI);
						connection.filesContainer.appendChild(video);
					}
				});

				recordingDuration = 24 * 3.6e+6; //24 h (hour) * 1 hours = 3.6e+6 = 3.6 x 10^6 milliseconds 
				connection.recorder.setRecordingDuration(recordingDuration).onRecordingStopped(function() {
					document.getElementById('record-on').onclick();
				});

				connection.recorder.startRecording();

				if (!connection.recorder.streams) {
					connection.recorder.streams = [];
					connection.recorder.streams.push(event.stream);
				}
			} else {
				if (connection.recorder && connection.recorder.streams.some(function(e) {
						return e == event.stream;
					}) == false) {
					if (!event.mediaElement) return;

					connection.recorder.streams.push(event.stream);
					connection.recorder.getInternalRecorder().addStreams([event.stream]);
					DEBUG && console.log('add stream to record', event.stream);
				}
			}

		});

		var videoElement = connection.filesContainer.querySelectorAll('video')[0];
		videoElement.style.height = videoElement.style.maxHeight = '100px';
		setTimeout(Resize, 500);

		timeTotalRecord = Math.floor(-1 * (timeStartRecord - timeNowRecord) / 1000);

		recordingStatus.innerHTML = 'Status: ' + connection.recorder.state + ' ';
		btnStopRecording.innerHTML = timeFormat(timeTotalRecord) + ' || Stop Recording';

		timeoutRecordingStatusHandling = setTimeout(recordingStatusHandling, 1000);
	}

	btnStopRecording.onclick = function() {
		stopRecordHandler();
	};
}

function stopRecordHandler() {
	if (!isView) return;

	if (!connection.recorder) return alert('No recorder found.');

	connection.recorder.stopRecording(function(blobURL) {
		// to fix video seeking issues
		getSeekableBlob(connection.recorder.getBlob(), function(seekableBlob) {
			var fileName = 'DDTalk-video-' + connection.token() + ' Size ' + bytesToSize(seekableBlob.size).toString().replace('.', ',') + ' Time ' + timeFormat(timeTotalRecord).toString().replace(':', '-') + '.mp4';
			invokeSaveAsDialog(seekableBlob, fileName); //"bytesToSize" returns human-readable size (in MB or GB)
			DEBUG && console.log('file', fileName, ' is download. Play mp4 in VLC player');
		});

		if (timeoutRecordingStatusHandling) clearTimeout(timeoutRecordingStatusHandling);

		connection.recorder.clearRecordedData();
		window.URL.revokeObjectURL(blobURL);

		connection.recorder.streams = [];
		connection.recorder = null;

		btnStopRecording.style.display = 'none';
		recordingStatus.style.display = 'none';
		btnStopRecording.removeAttribute("onclick");
		recordUI.remove();

		connection.filesContainer.querySelectorAll('video')[0].srcObject = null;
		connection.filesContainer.querySelectorAll('video')[0].remove();
		connection.filesContainer.innerHTML = '';
		connection.filesContainer.style = '';

		document.getElementById('record-off').style.display = '';
		document.getElementById('record-on').style.display = 'none';
		setTimeout(Resize, 500);
	});
}

function resetVideoStreamsForRecorder(endedStream) {
	if (!isView) return;
	if (!connection.recorder) return;

	var i = 0;
	Object.values(connection.recorder.streams).forEach(function(e) {
		if (e.streamid == endedStream) {
			connection.recorder.streams.splice(i, 1); //remove stream
			DEBUG && console.log('remove connection.recorder.streams[', i, '] = ', e.streamid);
		}
		i++;
	})


	setTimeout(function() { //create new array of Media Streams
		var arrayOfMediaStreams = [];
		connection.streamEvents.selectAll({
			remote: true
		}).forEach(function(e) {
			if (e.streamid == endedStream) return;
			if (!e.mediaElement) return;

			arrayOfMediaStreams.push(e.stream);
		})


		DEBUG && console.log('***resetVideoStreams: new streams array for record \n', arrayOfMediaStreams);

		connection.recorder.getInternalRecorder().resetVideoStreams(arrayOfMediaStreams);

	}, 1000);
}


}());
