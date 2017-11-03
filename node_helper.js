
const request = require('request');
const NodeHelper = require('node_helper');

module.exports = NodeHelper.create({
  socketNotificationReceived(notification, payload) {
    var self = this;
    switch(notification) {
      case 'GET_DATA':
        request('http://powietrze.gios.gov.pl/pjp/current/get_data_chart?days=2&stationId=' + payload.stationID, function (error, response, body) {
          if (error) {
            self.sendSocketNotification('ERR', { type: 'request error', msg: error });
          }
          if (response.statusCode != 200) {
            self.sendSocketNotification('ERR', { type: 'request statusCode', msg: response && response.statusCode });
          }
          if (!error & response.statusCode == 200) {
            var res = JSON.parse(body)
            if (res.isError) {
              console.log('isError', res)
              //self.sendSocketNotification('ERR', { type: 'response error', res.errorMessage });
            }
            else {
              var pollutions = []
              for (let item of res.chartElements) {
                if ('All' == payload.pollutionType || item.key == payload.pollutionType) {
                  if (!item.values[0][1]) {
                    item.values.shift();
                  }
                  var date = new Date(item.values[0][0])
                  if (payload.nowCast && ('PM10' == item.key || 'PM2.5' == item.key || 'O3' == item.key)) {
                    pollutions.push({key: item.key, value: nowcast(item.values, item.key), time: date});
                  }
                  else if ('CO' == item.key) {
                    pollutions.push({key: item.key, value: item.values[0][1] / 1000, time: date});
                  }
                  else {
                    pollutions.push({key: item.key, value: item.values[0][1], time: date});
                  }
                }
              }
              self.sendSocketNotification('DATA', pollutions)
            }
          }
        });
        break;
      case 'GET_LOC':
        const jsdom = require("jsdom");
        const { JSDOM } = jsdom;
        JSDOM.fromURL('http://powietrze.gios.gov.pl/pjp/current/station_details/info/' + payload).then(dom => {
          for (let row of dom.window.document.querySelector('tbody').rows) {
            if (row.cells[0].textContent == 'Adres') {
              self.sendSocketNotification('LOC', row.cells[1].textContent);
            }
          }
        });
        break;
    }
  }
});

var nowcast = function(values, pollutionType) {
  var len = 'O3' == pollutionType ? 8 : 12
  var pollutions = []
  for (let pol of values) {
    if (pol[1]) {
      pollutions.push(pol[1])
      if (pollutions.length >= len) {
        break
      }
    }
  }

  // math from: https://en.wikipedia.org/wiki/NowCast_(air_quality_index)
  var w = Math.min(...pollutions) / Math.max(...pollutions)

  if (1 == w) {
    return pollutions[0]
  }

  if (pollutionType != 'O3') {
    w = w > .5 ? w : .5

    if (.5 == w) {
      var ncl = 0
      for (i = 0; i < pollutions.length; i++) {
        ncl += Math.pow(.5, i + 1) * pollutions[i];
      }
      return (ncl);
    }
  }
  var ncl = 0, ncm = 0
  for (i = 0; i < pollutions.length; i++) {
    ncl += Math.pow(w, i) * pollutions[i];
    ncm += Math.pow(w, i)
  }
  return (ncl / ncm);
}
