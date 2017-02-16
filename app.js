var utils = require('./utils');
var config = require('./config');
var responseParser = require('./responseParser');
var deferred = require('deferred');
var net = require('net');

function main(){
  var rp = responseParser({host : config.hosts});
  rp.getHtml()(function(){
    return rp.getGidAndServer();
  })(function(){
    console.log(rp.parseRoomStatus().getStatus());
    var socket = net.connect(rp.getDanmuServers()[0].port, rp.getDanmuServers()[0].ip, function() {
      console.log("开始登录");
      utils.danmakuLogin(socket, rp.getRoomid());
      console.log("开始加入分组" + rp.getGid());
      utils.joinGroup(socket, rp.getRoomid(),rp.getGid());
      setInterval(function(){utils.keeplive(socket,Date.parse(new Date())/1000)},10000);
    });
    socket.on('data', function(data) {
      if (data.indexOf('type@=chatmsg') >= 0) {
        //console.log(data.toString());
        var msg = rp.parseMassage(data);
        try {
          console.log("[弹幕] " + msg[3] + ":" + msg[4]);
        }catch(error){
          console.log(msg);
        }
      }
    });
  }).done();
}

main();
