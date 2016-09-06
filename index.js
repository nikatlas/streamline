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
			socket.on("close",function(){
				console.log("client DROP");
			  	var index = sockets.indexOf(socket);
			  	if (index > -1) {
				    sockets.splice(index, 1);
				}
			});
			socket.on("error",function(){
				console.log("err");	 	
			});
			sockets.push(socket);
			streamodio.start();
		});
		server._server.on('clientError', function(err, socket){
		  	socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
		});

            console.log(streamodio.engine.getOptions());
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
	streamodio.init(0,1);
	sm.createClient("StreamIn", port, ip)
	.then(function (client) {
		client._socket.setEncoding('utf8');
		client._socket.on("connection",function(){
			console.log("connection");
		});

		client._socket.on("data",function(buffer){
			try{		
				var out = JSON.parse(buffer);
			}
			catch(e){
				//console.log("E");
			}
		});
		client._socket.on("end", function(){	
			console.log("BlockReady");
			// transmit audio via streaming the blocks
			
		});
	});
	// connect to server
	// read & write to speakers output buffers...
}
