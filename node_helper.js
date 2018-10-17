
const NodeHelper = require('node_helper');
const https = require('https');

module.exports = NodeHelper.create({
  socketNotificationReceived(notification, payload) {
    var that = this;
    
      switch (notification) {
        case 'GET_DATA':
          if (!payload.AirlyIndex) {
            return that.sendSocketNotification('ERR', { type: 'config error', msg: 'missingAirlyIndex' });
          }
          else if (!payload.lat || !payload.lng) {
            return that.sendSocketNotification('ERR', { type: 'config error', msg: 'missingCoords' });
          }
          else if (!payload.apiKey) {
            return that.sendSocketNotification('ERR', { type: 'config error', msg: 'missingapiKey' });
          }
          else {

            var options = {
              host: 'airapi.airly.eu',
              port: 443,
              path: 'https://airapi.airly.eu/v2/measurements/point?indexType=' + payload.AirlyIndex + '&lat=' + payload.lat + '&lng=' + payload.lng,
              headers: {
                apikey: payload.apiKey,
                'Accept-Language': payload.lang
              }
            };

            https.get(options, function (resource) {
              var data = '';
              resource.on('data', function (chunk) {
                data += chunk;
              });
              resource.on('end', function () {
                try {
                  data = JSON.parse(data).current.indexes[0];
                } catch (e) {
                  return that.sendSocketNotification('ERR', { type: 'json error', msg: e });
                }

                data.id = payload.id;

                return that.sendSocketNotification('DATA', data)

              });
            }).on('error', function (e) {
              return that.sendSocketNotification('ERR', { type: 'request error', msg: e.message });
            });
          }
          break;
      }
  }
});
