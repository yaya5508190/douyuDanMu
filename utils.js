exports.send = function(socket, payload)
{
	var data = new Buffer(4 + 4 + 4 + payload.length + 1)
	data.writeInt32LE(4 + 4 + payload.length + 1, 0); //length
	data.writeInt32LE(4 + 4 + payload.length + 1, 4); //code
	data.writeInt32LE(0x000002b1, 8); //magic
	data.write(payload, 12); //payload
	data.writeInt8(0, 4 + 4 + 4 + payload.length); //end of string
	socket.write(data)
}


exports.danmakuLogin = function(socket,roomId) {
    exports.send(socket,"type@=loginreq/username@=visitor34807350/password@=1234567890123456/roomid@="+roomId+"/");
}

exports.joinGroup = function(socket,rid,gid) {
    exports.send(socket,"type@=joingroup/rid@="+rid+"/gid@="+gid+"/");
}

exports.keeplive = function(socket,tick) {
  exports.send(socket,"type@=keeplive/tick@="+tick+"/");
}
