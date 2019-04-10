
const request = require('request');
const NodeHelper = require('node_helper');

module.exports = NodeHelper.create({
  socketNotificationReceived(notification, payload) {
    var self = this;
    switch(notification) {
      case 'GET_DATA':
        request('http://powietrze.gios.gov.pl/pjp/current/station_details/table/' + payload.stationID + '/2/0', function (error, response, body) {
          if (error) {
            self.sendSocketNotification('ERR', { type: 'request error', msg: error });
          }
          if (response.statusCode != 200) {
            self.sendSocketNotification('ERR', { type: 'request statusCode', msg: response && response.statusCode });
          }
          if (!error & response.statusCode == 200) {
            const jsdom = require('jsdom');
            const { JSDOM } = jsdom;

            var dom = new JSDOM(body), head = dom.window.document.querySelector('thead').children[0].children, body = dom.window.document.querySelector('tbody').children
            var res = { chartElements: [] };

            for (i = 1; i < head.length; i++) {
              var item = {key: '', values: []}
              item.key = head[i].textContent.replace(/[ \n\t]/gi, '').replace(',', '.')
              for (j = 0; j < body.length - 3; j++) {
                var val = body[j].children[i].textContent.replace(/[^\d\,]/gi, '')
                if ('' == val) {
                  continue;
                }
                item.values.unshift([body[j].children[0].textContent.replace(/(\d+)\.(\d+)\.(\d+), ([\d\:]+)/gi, '$3-$2-$1 $4'), parseFloat(val.replace(',', '.'))])
              }
              if (item.values.length > 0) {
                res.chartElements.push(item)
              }
            }

              var pollutions = []
              for (let item of res.chartElements) {
                if ('All' == payload.pollutionType || item.key == payload.pollutionType) {
                  if (payload.nowCast && ('PM10' == item.key || 'PM2.5' == item.key || 'O3' == item.key)) {
                    pollutions.push({ key: item.key, value: nowcast(item.values, item.key), time: item.values[0][0]});
                  }
                  else {
                    pollutions.push({ key: item.key, value: item.values[0][1], time: item.values[0][0]});
                  }
                }
              }
              self.sendSocketNotification('DATA', pollutions)
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