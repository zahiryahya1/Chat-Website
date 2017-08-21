/* Global Variables */
var socket = io();
var catagory;
var room;
var rtc, web, mic;

DetectRTC.load(function() {
    web = DetectRTC.hasWebcam
    mic = DetectRTC.hasMicrophone
    rtc = DetectRTC.isWebRTCSupported
    console.log("WebRtc: " + rtc + " Mic: " + mic + " Webcam: " + web);
});

var webrtc = new SimpleWebRTC({
    // the id/element dom element that will hold "our" video
    localVideoEl: 'localVideo',
    // the id/element dom element that will hold remote videos
    remoteVideosEl: 'remoteVideos',
    // immediately ask for camera access
    autoRequestMedia: true
});

function checkReady() {

    if (web && mic && rtc) {
        return true;
    } else {
        console.log("WebRtc: " + rtc + " Mic: " + mic + " Webcam: " + web);
        if (!rtc) {
            alert('This site uses a cutting edge technology called WebRTC that is only available in Chrome, Firefox and Opera.');
        } else {
            alert('You need to have a microphone and webcam');
        }
        return false;
    }
}

$('#basketball').click(function() {
    catagory = "basketball";
    $('#catagory').toggle(); 
    $('#landing').toggle();

    socket.emit('catagory', 'basketball');
});

$('#news').click(function() {
    catagory = "news";
    $('#catagory').toggle(); 
    $('#landing').toggle();

    socket.emit('catagory', 'news');

});

$('#anything').click(function() {
    catagory = "anything";
    $('#catagory').toggle();
    $('#landing').toggle();

    socket.emit('catagory', 'anything');

});

$('#join').click(function() {
    if (checkReady()) {
        socket.emit('user-ready');
    }
    $('#landing').toggle();
    $('#tray').toggle();
    $('#localVideo').toggle(); 
    $('#msgs').text('Finding Users ... ');
});

$('#back').click(function() {
    $('#catagory').toggle(); 
    $('#landing').toggle();

    socket.emit('back');
});

$('#leave').click(function() {
    socket.emit('leave-room', webrtc.roomName);
    webrtc.leaveRoom();
    room = null;

    $('#msgs').text(' ');
    $('#landing').toggle();
    $('#tray').toggle();
    $('#convo').hide();
    $('ul').empty();


    $('#localVideo').toggle();

    socket.emit('not-ready');
});

$('#next').click(function() {
    socket.emit('user-ready');
    socket.emit('leave-room', webrtc.roomName);
    webrtc.leaveRoom();
    room = null;

    $('#msgs').text('Finding Users ... ');
    $('#convo').hide();
    $('ul').empty();


});

/* Sends message */
$('form').submit(function(){
    // if no text or only spaces, do nothing
    if ( $('#m').val() === '' || jQuery.trim( $('#m').val() ).length == 0 ) 
        return false;

    socket.emit('chat', $('#m').val(), room, socket.id);
    $('#m').val('');

    return false;
});

socket.on('chat', function(msg, id){
    if (socket.id === id)
        $('#messages').append($('<li>').text( "Me: " + msg));
    else
        $('#messages').append($('<li>').text( "Them: " + msg));

    /* automatically scroll to bottom of convo */
    var objDiv = document.getElementById("messages");
    objDiv.scrollTop = objDiv.scrollHeight;
});

/* Found Match */
socket.on('id', function(msg){
    socket.emit('not-ready');
    $('#msgs').text('Talk about ' + catagory +'!');
    $('#convo').toggle();

    webrtc.joinRoom(msg);
    room = webrtc.roomName;
    socket.emit('join-room', room);
});


webrtc.on('videoRemoved', function(peer) {
    $('#msgs').text('User Left! Click "Next" to find a new match.');
    $('ul').empty();
    $('#convo').hide();


});

socket.on('users-online', function(msg) {
    $("#count").text('Current Users in ' + catagory + ': ' + msg);
});
