var streamodio 	   = require('streamodio');
var sm = require('server-manager');

console.log(process.argv);
var mode = process.argv[2];

if(mode == 'server'){
	var port = process.argv[3];
	var ip 	 = process.argv[4] || '0.0.0.0';
	
	var sockets = [];
	
	// create server on port 
	sm.create("StreamLine",port, ip)
	.then(function (server) {
		// w8 for connections 
		server._server.on('connection', function(socket){
			socket.setEncoding('utf8');
			sockets.push(socket);
			streamodio.start();
		});
		server._server.on('clientError', function(err, socket){
		  	socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
		  	var index = sockets.indexOf(socket);
		  	if (index > -1) {
			    sockets.splice(index, 1);
			}
		});

	});
	
	// read audio from stereo mix
	streamodio.init();
	// transmit audio via streaming the blocks
	streamodio.setOnRead(function(data){
		var out = {
			data : data
		}
		for(var i = 0 ; i < sockets.length; i++){
			sockets[i].write(JSON.stringify(out));
		}
	});

}
else if(mode == 'client'){
	// create client on port , ip 
	var buffblock = "";
	var port = process.argv[3];
	var ip 	 = process.argv[4] || '0.0.0.0';
	// read audio from stereo mix
	streamodio.init();
	sm.createClient("StreamIn", port, ip)
	.then(function (client) {
		client._socket.setEncoding('utf8');
		client._socket.on("data",function(buffer){
			var out = JSON.parse(buffer);
			streamodio.engine.write(out.data);
		});
		client._socket.on("end", function(){	
			console.log("BlockReady");
			// transmit audio via streaming the blocks
			
		});
	});
	// connect to server
	// read & write to speakers output buffers...
}
