"use strict"

Module.register('MMM-SmokedMirror', {
    defaults: {
    showLocation: true,
    showValues: false,
    updateInterval: 30,
    animationSpeed: 1000,
    nowCast: false,
    showUnits: false,
  },
  start: function(){
    Log.info('Starting module: ' + this.name);

    //type of pollution
    switch(this.config.pollutionType) {
      case 'PM10':
        this.config.pollutionColumn = 0;
        this.config.pollutionNorm = 50;
        break;
      case 'PM2,5':
        this.config.pollutionColumn = 1;
        this.config.pollutionNorm = 25;
        break;
      case 'O3':
        this.config.pollutionColumn = 2;
        this.config.pollutionNorm = 120;
        break;
      case 'NO2':
        this.config.pollutionColumn = 3;
        this.config.pollutionNorm = 200;
        break;
      case 'SO2':
        this.config.pollutionColumn = 4;
        this.config.pollutionNorm = 125;
        break;
      case 'C6H6':
        this.config.pollutionColumn = 5;
        this.config.pollutionNorm = 5;
        break;
      case 'CO':
        this.config.pollutionColumn = 6;
        this.config.pollutionNorm = 10;
        break;
    }
    switch(this.config.pollutionType) {
      case 'PM10':
      case 'PM2,5':
      case 'O3':
      case 'NO2':
      case 'SO2':
      case 'C6H6':
        this.config.units = 'µg/m³'
        break;
      case 'CO':
        this.config.units = 'mg/m³'
        break;
    }

    // uri to gather data
    this.config.url = 'http://powietrze.gios.gov.pl/pjp/current/station_details/table/' + this.config.stationID + '/' + (this.config.nowCast ? 2 : 1) + '/0'
    this.config.yql = 'env \'store://datatables.org/alltableswithkeys\'; SELECT * FROM htmlstring WHERE url="' + this.config.url + '" AND xpath=\'//div[@class="container"]//div[@class="row"]//div[@class="table-responsive"]//table//tbody//tr' + (this.config.nowCast ? '\'|sort(field="th", descending="true")' : '//td[' + (1 + this.config.pollutionColumn) + ']\'|truncate(count=24)')

    // load data
    this.load();

    // schedule refresh
    setInterval(
      this.load.bind(this),
      this.config.updateInterval * 60 * 1000);
  },
  load: function(){

    if(!this.data.location) {
      this.loadLocation();
    }

    var self = this;

    YUI().use('node', 'event', 'yql', function(Y) {
      Y.YQL(self.config.yql, function(response) {
        if(response.error) {
          Log.error(response.error.description)
        }
        else {
          var pollution
          
          if(self.config.nowCast) {
            var i=1
            var pollutions = [null]
            for (let item of response.query.results.result.split(/tr>[\r\n]<tr+/)) {
              pollution = item.match(/\d+,\d+/gmi)
              if (pollution) {
                pollution = parseFloat(pollution[self.config.pollutionColumn].replace(',', '.'))
                if (pollution) {
                  pollutions[i++] = pollution
                  if (i > 12) {
                    break
                  }
                }
              }
              else {
                break
              }
            }
            // math from: https://en.wikipedia.org/wiki/NowCast_(air_quality_index)
            var w = Math.min(pollutions) / Math.max(pollutions)
            if(self.config.pollutionType != 'O3') {
              w = w > .5 ? w : .5
            }
            var ncl = 0, ncm = 0
            for (i = 1; i <= 12; i++) {
              ncl += Math.pow(w, i - 1) * pollutions[i];
              ncm += Math.pow(w, i - 1)
            }
            self.data.pollution = Math.round(100*ncl/ncm)/100
          }
          else {
            for (let item of response.query.results.result.split(/>[\r\n]<+/)) {
              pollution = item.match(/\d+,\d+/gmi)
              if (pollution) {
                pollution = parseFloat(pollution[0].replace(',', '.'))
                if (pollution) {
                  self.data.pollution = pollution
                }
                else {
                  break
                }
              }
              else {
                break
              }
            }
          }

          self.loaded = true;
          self.updateDom(self.animationSpeed);
        }
      });
    });
  },
  html: {
    icon: '<i class="fa fa-leaf"></i>',
    city: '<div class="xsmall">{0}</div>',
    values: '<span class="small light"> ({0} {1} {2}{3})</span>',
    quality: '<div>{0} {1}{2}{3}{4}</div>'
  },
  getScripts: function() {
    return [
      '//yui-s.yahooapis.com/3.8.0/build/yui/yui-min.js',
      'String.format.js'
    ];
  },
  getStyles: function() {
    return ['https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css'];
  },
  getDom: function() {
    var wrapper = document.createElement('div');
    if (!this.config.stationID) {
      wrapper.innerHTML = this.translate('NoStationID') + this.name + '.';
      wrapper.className = 'dimmed light small';
    }
    else if (!this.loaded) {
      wrapper.innerHTML = this.translate('Loading');
      wrapper.className = 'dimmed light small';
    }
    else if(this.config.nowCast && this.config.pollutionType != 'PM10' && this.config.pollutionType != 'PM2,5' && this.config.pollutionType != 'O3') {
      wrapper.innerHTML = this.translate('NowCastErr') + 'PM10; PM2,5; O3';
      wrapper.className = 'dimmed light small';
    }
    else if (!this.data.pollution) {
      wrapper.innerHTML = this.translate('NoData') + this.config.pollutionType;
      wrapper.className = 'dimmed light small';
    }
    else {
      wrapper.innerHTML = 
        this.html.quality.format(
          this.html.icon,
          this.config.showValues ? this.config.pollutionType + ' ' : '',
          this.impact(this.data.pollution),
          (this.config.showValues ? this.html.values.format(this.data.pollution.toString().replace('.', ','), this.translate('Of'), this.config.pollutionNorm, this.config.nowCast ? '' : this.config.units) : ''),
          (this.config.showLocation && this.data.location ? this.html.city.format(this.data.location) : '')
        )
    }
    return wrapper;
  },
  getTranslations: function() {
    return {
      en: 'translations/en.json',
      pl: 'translations/pl.json'
    }
  },
  impact: function(pollution) {
         if(pollution < this.config.pollutionNorm)     return this.translate('Good');
    else if(pollution < this.config.pollutionNorm * 2) return this.translate('Moderate');
    else if(pollution < this.config.pollutionNorm * 3) return this.translate('Low');
    else if(pollution < this.config.pollutionNorm * 4) return this.translate('Unhealthy');
    else if(pollution < this.config.pollutionNorm * 6) return this.translate('VeryUnhealthy');
    else                                               return this.translate('Hazardous');
  },
  loadLocation: function() {
    var yql = 'SELECT * FROM html WHERE url=\'' + this.config.url + '\' AND xpath=\'//div[@class="container"]//div[@class="row"]//div[@class="table-responsive"]//table//caption\''
    var self = this
    YUI().use('node', 'event', 'yql', function(Y) {
      Y.YQL(yql, function(response) {
        if(response.error) {
          Log.error(response.error.description)
        }
        else {
          //self.data.location = response.query.results.caption.replace(/Dane pomiarowe tabele +|\t+|\(.+|\n +/gmi, '')
          self.updateDom(self.animationSpeed);
        }
      });
    });
  },
});
