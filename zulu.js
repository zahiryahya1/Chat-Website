var init = require('./init');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var router = express.Router();

var uuid = require('node-uuid');
app.use(express.static('public'));

var clients = [];


io.sockets.on('connect', function(client) {
    /* create a pair object so that each client is associated with
       a specific catagory, and chat room. 
    */
    var obj = {
        user: client,
        catagory: null,
        room: null
    };

    clients.push(obj);

    /* need to update all catagories when a new user is added */
    client.on('catagory', function(cat) {
        // search for the catagory index
        for (var i = 0; i < clients.length; i++) {
            // update the catagory atribute in the clients array for user
            if (clients[i].user === client) {
                clients[i].catagory = cat;
                break;
            }
        }

        /* update the catagoy count */
        var i = 0;
        for (i = 0; i < init.catagoryCount.length; i++){

            if ( init.catagoryCount[i].catagory === cat ) {
                init.catagoryCount[i].count++;
                console.log(cat + " count ++");
                break;

            }
        }

        /* update num of users online for all users */
        for (var j = 0; j < clients.length; j++) {

            for (var ind = 0; ind < init.catagoryCount.length; ind++) {
                if (init.catagoryCount[ind].catagory === clients[j].catagory) {
                    clients[j].user.emit('users-online', init.catagoryCount[ind].count);
                }
            }
        }
    });

    /* Gets User ready for chat */
    client.on('user-ready', function() {
        var pos = clients.map(function(e) { return e.user; }).indexOf(client);

        clients[pos].user.client.ready = true;
        clients[pos].user.client.hasPair = false;
    });

    /* User not ready if in a chat */
    client.on('not-ready', function() {
        var pos = clients.map(function(e) { return e.user; }).indexOf(client);

        clients[pos].user.client.ready = false;
        clients[pos].user.client.hasPair = true;
    });

    /* User closes tab */
    client.on('disconnect', function() {
        var pos = clients.map(function(e) { return e.user; }).indexOf(client);
        var currUser = clients[pos];

        // if user hasnt selected a catagory, we dont need to update anything
        if (currUser.catagory === null) {
            return;
        }

        clients.splice(pos, 1); // removes user from array

        /* dec catagory count */
        var catInd = 0;
        for (catInd = 0; catInd < init.catagoryCount.length; catInd++){

            if ( init.catagoryCount[catInd].catagory === currUser.catagory ) {
                init.catagoryCount[catInd].count--;
                console.log(currUser.catagory + " count --");
                break;
            }
        }

        // for each client, update the user count in the catagory
        // and list out the remaining clients
        console.log("---- Remaining clients ----\n");
        for (var i = clients.length - 1; i >= 0; i--) {

            if (typeof clients[i] !== "undefined") {
                
                for (var ind = 0; ind < init.catagoryCount.length; ind++) {
                    if (init.catagoryCount[ind].catagory === clients[i].catagory) {
                        clients[i].user.emit('users-online', init.catagoryCount[ind].count);
                    }
                }
                // list the clients that remain online
                console.log('Client ' + i + ': ' + clients[i].user.client.id);
            } else {
                console.log('Undef');
            }
        }
        console.log('\n---- End --- \n');
    });

    /* dec the catagory count and update clients catagories */
    client.on('back', function() {

        /* dec catagory count */
        var pos = clients.map(function(e) { return e.user; }).indexOf(client);
        var currUser = clients[pos];

        var catInd = 0;
        for (catInd = 0; catInd < init.catagoryCount.length; catInd++){

            if ( init.catagoryCount[catInd].catagory === currUser.catagory ) {
                init.catagoryCount[catInd].count--;
                console.log(currUser.catagory + " count --");
                clients[pos].catagory = null;
                break;
            }
        }

        // for each client, update the user count in the catagory
        for (var i = clients.length - 1; i >= 0; i--) {

            if (typeof clients[i] !== "undefined") {
                
                for (var ind = 0; ind < init.catagoryCount.length; ind++) {
                    if (init.catagoryCount[ind].catagory === clients[i].catagory) {
                        clients[i].user.emit('users-online', init.catagoryCount[ind].count);
                    }
                }
            }
        }
    });

    /* emit message to everyone in chat room, including user. */
    client.on('chat', function(msg, room, id) {
        io.to(room).emit('chat', msg, id);
    });

    /* Join chat room */
    client.on('join-room', function(room) {
        client.join(room);
    });

    /* Leave chat room */
    client.on('leave-room', function(room) {
        client.leave(room);
    });
});

//poll to match users
function pollFunc(fn, interval) {
    interval = interval || 1000;
    (function p() {
        fn();
        setTimeout(p, interval);

    })();
}

/* Searches for users to match */
pollFunc(function() {

    var pairs = [];
    // for all clients, find 2 users that are ready and not in a chat and pair them
    for (var i = clients.length - 1; i >= 0; i--) {

        var currUser;
        if (clients[i].user.client.ready && !clients[i].user.client.hasPair) {
            currUser = clients[i];

            for (var c = clients.length - 1; c >= 0; c--) {
                if (clients[c].user.client.ready && !clients[c].user.client.hasPair && 
                    currUser.user !== clients[c].user && currUser.catagory === clients[c].catagory) {
                    pairs.push({
                        a: currUser.user,
                        b: clients[c].user
                    });
                    currUser.hasPair = true;
                    clients[c].user.client.hasPair = true;
                }
            }
        }
    }
    // create room for video 
    for (var b = pairs.length - 1; b >= 0; b--) {
        var id = uuid.v4();
        console.log('Pair Made Between: "' + pairs[b].a.id + '"" and "' + pairs[b].b.id + '"" to join room ' + id);

        pairs[b].a.emit('id', id);
        pairs[b].b.emit('id', id);
    }

}, 1000);


router.get('/', function(req, res) {
    res.sendfile(__dirname + '/views/home.html');

});

router.get('/home', function(req, res) {
    res.sendfile(__dirname + '/views/home.html');

});


app.set('port', process.env.PORT || 1337);
console.log('listening on 1337')
app.use('/', router);
server.listen(app.get('port'));