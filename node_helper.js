
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
              self.sendSocketNotification('ERR', { type: 'response error', res.errorMessage });
            }
            else {
              var pollutionFound = false;
              for (let item of res.chartElements) {
                if (item.key == payload.pollutionType) {
                  pollutionFound = true;
                  if (payload.nowCast) {
                    var i = 1
                    var pollutions = [null]
                    for (let pol of item.values) {
                      if (pol[1]) {
                        pollutions[i++] = pol[1]
                        if (i >= 12) {
                          break
                        }
                      }
                    }
                    // math from: https://en.wikipedia.org/wiki/NowCast_(air_quality_index)
                    var w = Math.min(pollutions) / Math.max(pollutions)
                    if (payload.pollutionType != 'O3') {
                      w = w > .5 ? w : .5
                    }
                    var ncl = 0, ncm = 0
                    for (i = 1; i < pollutions.length; i++) {
                      ncl += Math.pow(w, i - 1) * pollutions[i];
                      ncm += Math.pow(w, i - 1)
                    }
                    self.sendSocketNotification('DATA', ncl / ncm);
                  }
                  else {
                    self.sendSocketNotification('DATA', payload.pollutionType == 'CO' ? item.values[0][1] / 1000 : item.values[0][1]);
                  }
                }
              }
              if (!pollutionFound) {
                self.sendSocketNotification('DATA', null);
              }
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