'use strict';

var express = require('express');
var app = express();

function getTodaysDate() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();
  
  if(dd<10){
    dd='0'+dd;
  } 
  if(mm<10){
    mm='0'+mm;
  } 
  return dd+'/'+mm+'/'+yyyy;
}

app.get('/', function (req, res) {

  
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ "version": "v1", "date": getTodaysDate(), "message": "Welcome to Container Orchestration with k8s! We are on version v1" }, null, 3));
});

var server = app.listen(3001, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
