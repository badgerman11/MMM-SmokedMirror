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
      case 'CO':
        this.config.units = 'mg/m³'
        break;
      default:
        this.config.units = 'µg/m³'
        break;
    }

    // load data
    this.load();

    // schedule refresh
    setInterval(
      this.load.bind(this),
      this.config.updateInterval * 60 * 1000);
  },
  load: function(){

    var self = this;

    if(!this.data.location) {
      this.sendSocketNotification('GET_LOC', self.config.stationID)
    }

    this.sendSocketNotification('GET_DATA', { stationID: self.config.stationID, pollutionType: self.config.pollutionType.replace(',', '.'), nowCast: self.config.nowCast })
    
  },
  socketNotificationReceived: function (notification, payload) {
    var self = this;
    switch (notification) {
      case 'DATA':
        self.data.pollution = payload
        self.loaded = true;
        self.updateDom(self.animationSpeed);
        break;
      case 'LOC':
        self.data.location = payload
        self.updateDom(self.animationSpeed);
        break;
      case 'ERR':
        console.log('error :(', payload)
        break;
      default:
        console.log ('wrong socketNotification', notification, payload)
        break;
    }
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
          (this.config.showValues ? this.html.values.format((Math.round(this.data.pollution * 10) / 10).toString().replace('.', ','), this.translate('Of'), this.config.pollutionNorm, this.config.nowCast ? '' : this.config.units) : ''),
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
});
