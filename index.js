const mqtt = require('mqtt')
const program = require('commander');
const http_request = require('request');

program
  .version('1.0.0')
  .option('-h, --host <host>', 'MQTT Server URL (defaults to mqtt://localhost)')
  .option('-p, --plz <plz>', 'Zipcode in Germany (Postleitzahl) (defaults to 69256')
  .option('-d, --daemonize', 'Daemonize process and publish new value every hour')
  .option('-q, --quite', 'No console output')
  .parse(process.argv);


if(!program.host) program.host = 'mqtt://localhost';
if(!program.plz) program.plz = '69256';
if(!program.daemonize) program.daemonize=false;

const client  = mqtt.connect(program.host);
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
        client.publish('gsi_json_'+program.plz, JSON.stringify(selected));
        client.publish('gsi_'+program.plz, ""+selected.eevalue);
        client.publish('gsi', ""+selected.eevalue);
        client.publish('gsi_all', JSON.stringify({location:b.location,values:b.hitory}));
      }
    })
}

client.on('connect', function () {
  client.subscribe('gsi', function (err) {
    client.subscribe('gsi_json_'+program.plz, function (err) {
      client.subscribe('gsi_'+program.plz, function (err) {
        client.subscribe('gsi_all', function (err) {
          if (!err) {
            publishGSI();
            if(program.daemonize) {
              setInterval(function() {
                publishGSI();
              },3600000);
            }
          }
        });
      });
    });
  })
})

client.on('message', function (topic, message) {
  // message is Buffer
  //console.log(topic,message.toString())
  client.end()
})
