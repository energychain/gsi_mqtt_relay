#!/usr/bin/env node
'use strict';

const mqtt = require('mqtt');
const program = require('commander');
const http_request = require('request');

program
  .version('1.0.11')
  .option('-h, --host <host>', 'MQTT Server URL (defaults to mqtt://localhost)')
  .option('-p, --plz <plz>', 'Zipcode in Germany (Postleitzahl) (defaults to 69256')
  .option('-d, --daemonize', 'Daemonize process and publish new value every hour')
  .option('-u, --username <username>', 'Username for MQTT Server/Broker')
  .option('-P, --password <password>', 'Password for MQTT Server/Broker')
  .option('-q, --quite', 'No console output')
  .parse(process.argv);


if(!program.host) program.host = 'mqtt://localhost';
if(!program.plz) program.plz = '69256';
if(!program.daemonize) program.daemonize=false;
let options={};
if(program.username) options.username=program.username;
if(program.password) options.password=program.password;

const client  = mqtt.connect(program.host,options);
if(!program.quite) {
  console.log("Host",program.host);
  console.log("ZIP",program.plz);
  console.log("Daemon",program.daemonize);
}
const publishGSI = function() {
    http_request("https://api.corrently.io/gsi/gsi?zip="+program.plz,function(e,r,b) {
      b = JSON.parse(b);
      let now = new Date().getTime()/1000;
      let selected = null;
      for(var i = 0; i < b.history.length; i++ ) {
        if(b.history[i].epochtime < now) selected = b.history[i];
      }
      if(selected != null) {
        client.publish('gsi/json/'+program.plz, JSON.stringify(selected),{retain:true});
        client.publish('gsi/values/'+program.plz, JSON.stringify(selected),{retain:true});
        client.publish('gsi/'+program.plz, ""+selected.eevalue,{retain:true});
        client.publish('gsi/last/value', ""+selected.eevalue,{retain:true});
        client.publish('gsi/last/city', ""+b.location.city,{retain:true});
        client.publish('gsi/all', JSON.stringify({location:b.location,values:b.hitory}),{retain:true});
      }
    })
}

client.on('connect', function () {
  client.subscribe('gsi', function (err) {
    if(err) console.log(err);
    client.subscribe('gsi_json_'+program.plz, function (err) {
      if(err) console.log(err);
      client.subscribe('gsi_'+program.plz, function (err) {
       if(err) console.log(err);
        client.subscribe('gsi_all', function (err) {
          if (!err) {
            publishGSI();
          } else {
            console.log(err);
          }
        });
      });
    });
  })
})

client.on('message', function (topic, message) {
  // message is Buffer
  //console.log(topic,message.toString())
  if(topic == 'gsi_'+program.plz) {
    console.log(message.toString());
  }
  //client.end()
});

if(program.daemonize) {
  setInterval(function() {
    publishGSI();
  },900000);
}
