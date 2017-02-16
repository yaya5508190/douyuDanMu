var request = require('request');
var deferred = require('deferred');
var net = require('net');
var md5 = require('md5');
var uuid = require('node-uuid');
var utils = require('./utils');

var REGEX_ROOM_ID = new RegExp("\"room_id\":(\\d*),");
var REGEX_ROOM_STATUS = new RegExp("\"show_status\":(\\d*),");
var REGEX_SERVER = new RegExp("%7B%22ip%22%3A%22(.*?)%22%2C%22port%22%3A%22(.*?)%22%7D%2C",'g');
var REGEX_GROUP_ID = new RegExp("type@=setmsggroup.*/rid@=(\\d*?)/gid@=(\\d*?)/");
var REGEX_DANMAKU_SERVER = new RegExp("ip@AA=(.*?)@ASport@AA=(\\d*)",'g');
var REGEX_CHAT_DANMAKU = new RegExp("type@=chatmsg/.*rid@=(\\d*?)/.*uid@=(\\d*).*nn@=(.*?)/txt@=(.*?)/(.*)/");

var responseParser = function(config){
  var _body = "";
  var _roomid = "";
  var _status = "";
  var _gid = "";
  var _servers = [];
  var _danmuServers = [];
  return {
    getRoomid : function(){
      return _roomid;
    },
    getStatus : function(){
      return _status;
    },
    getServers : function(){
      return _servers;
    },
    getDanmuServers : function(){
      return _danmuServers;
    },
    getGid : function(){
      return _gid;
    },
    getHtml: function() {
      var def = deferred();
      console.log('开始获取页面');
      request({
          uri: config.host
      }, function(err, resp, body) {
           console.log('获取页面成功');
           _body = body;
           def.resolve(_body);
      });
      return def.promise;
    },
    parseRoomStatus:function() {//获取房间状态
      console.log('开始获取获取房间直播状态');
      _status = _body.match(REGEX_ROOM_STATUS)[1];
      console.log('获取获取房间直播状态成功');
      return this;
    },
    parseRoomID:function() {//获取房间号
      console.log('开始获取获取房间号');
      _roomid = _body.match(REGEX_ROOM_ID)[1]
      console.log('获取获取房间成功');
      return this;
    },
    parseServers:function(){//获取页面服务器列表
      console.log('开始获取获取页面服务器');
      var server = "";
      while ((server = REGEX_SERVER.exec(_body)) !== null) {
        _servers.push({
          ip : server[1],
          port : server[2]
        })
      }
      console.log('获取页面服务器成功');
      return this;
    },
    getGidAndServer : function(){
      this.parseServers();
      this.parseRoomID();
      var def = deferred();
      var rt = Date.parse(new Date())/1000;
      var devid = uuid.v4().replace(/-/g, '');
      var vk = md5(rt + '7oE9nPEG9xXV69phU31FYCLUagKeYtsF' + devid);
      var req = 'type@=loginreq/username@=/password@=/roomid@=' +
        _roomid + '/ct@=0/vk@=' + vk + '/devid@=' +
        devid + '/rt@=' + rt + '/ver=@20150929/';
      var server = _servers[0];

      console.log('开始获取获取分组以及弹幕服务器地址: ' + server.ip + ':' + server.port);
      var socket = net.connect(server.port, server.ip, function() {
        utils.send(socket, req);
      });
      socket.on('data', function(data) {
        if (data.indexOf('type@=setmsggroup') >= 0) {
          var gid = data.toString().match(REGEX_GROUP_ID);
          _gid = gid[2];
          console.log('获取分组ID成功');
          var server = "";
          while ((server = REGEX_DANMAKU_SERVER.exec(data.toString())) !== null) {
            _danmuServers.push({
              ip : server[1],
              port : server[2]
            })
          }
          console.log('获取弹幕服务器地址成功');
          def.resolve();
          socket.destroy();
        }
      });
      return def.promise;
    },
    parseMassage : function(data){
      var msg = data.toString().match(REGEX_CHAT_DANMAKU);
      return msg
    }
  }
}
module.exports = responseParser;
