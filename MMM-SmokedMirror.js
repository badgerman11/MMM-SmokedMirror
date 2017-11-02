"use strict"

var pollutionTypeH = {
      PM10: 'PM10',
      'PM2.5': 'PM2.5',
      '03': 'O<sub>3</sub>',
      NO2: 'NO<sub>2</sub>',
      SO2: 'SO<sub>2</sub>',
      C6H6: 'C<sub>6</sub>H<sub>6</sub>',
      CO: 'CO'
    }
var pollutionNorm = {
  PM10: 50,
  'PM2.5': 25,
  '03': 120,
  NO2: 200,
  SO2: 125,
  C6H6: 5,
  CO: 10
}
var units = {
  PM10: 'µg/m³',
  'PM2.5': 'µg/m³',
  '03': 'µg/m³',
  NO2: 'µg/m³',
  SO2: 'µg/m³',
  C6H6: 'µg/m³',
  CO: 'mg/m³'
}

Module.register('MMM-SmokedMirror', {
  defaults: {
    showLocation: true,
    showValues: false,
    updateInterval: 30,
    animationSpeed: 1000,
    nowCast: false,
    showUnits: false,
    pollutionType: 'All'
  },
  start: function(){
    Log.info('Starting module: ' + this.name);

    this.config.pollutionTypeH = pollutionTypeH
    this.config.pollutionNorm = pollutionNorm
    this.config.units = units

    // load data
    this.load();

    // schedule refresh
    setInterval(
      this.load.bind(this),
      this.config.updateInterval * 60 * 1000);
  },
  load: function(){

    var self = this;

    if(!this.data.location && this.config.showLocation) {
      this.sendSocketNotification('GET_LOC', self.config.stationID)
    }

    this.sendSocketNotification('GET_DATA', { stationID: self.config.stationID, pollutionType: self.config.pollutionType.replace(',', '.'), nowCast: self.config.nowCast })
    
  },
  socketNotificationReceived: function (notification, payload) {
    var self = this;
    switch (notification) {
      case 'DATA':
        self.data.pollution = payload.sort(self.compare);
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
    quality: '<table><caption>{0}</caption><tbody>{1}</tbody></table>',
    qualityTr: '<tr><td>{0}</td><td>{1}</td><td>{2}</td><td>{3}</td></tr>'
  },
  getScripts: function() {
    return ['String.format.js'];
  },
  getStyles: function() {
    return [
      'https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css',
      'StyleSheet.css',
    ];
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
    else if(this.config.nowCast && this.config.pollutionType != 'All' && this.config.pollutionType != 'PM10' && this.config.pollutionType != 'PM2.5' && this.config.pollutionType != 'O3') {
      wrapper.innerHTML = this.translate('NowCastErr') + 'PM10; PM2.5; O3';
      wrapper.className = 'dimmed light small';
    }
    else if (!this.data.pollution) {
      wrapper.innerHTML = this.translate('NoData') + this.config.pollutionType;
      wrapper.className = 'dimmed light small';
    }
    else {
      var tbody = ''
      for (let item of this.data.pollution) {
        tbody += this.html.qualityTr.format(
          this.html.icon,
          this.config.pollutionTypeH[item.key],
          this.impact(item.value, item.key),
          (this.config.showValues ? this.html.values.format((Math.round(item.value * 10) / 10).toString().replace('.', ','), this.translate('Of'), this.config.pollutionNorm[item.key], this.config.units[item.key]) : '')
        )
      }
      wrapper.innerHTML = this.html.quality.format(
        (this.config.showLocation && this.data.location ? this.html.city.format(this.data.location) : ''),
        tbody
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
  impact: function(pollution, type) {
         if(pollution < this.config.pollutionNorm[type])     return this.translate('Good');
    else if(pollution < this.config.pollutionNorm[type] * 2) return this.translate('Moderate');
    else if(pollution < this.config.pollutionNorm[type] * 3) return this.translate('Low');
    else if(pollution < this.config.pollutionNorm[type] * 4) return this.translate('Unhealthy');
    else if(pollution < this.config.pollutionNorm[type] * 6) return this.translate('VeryUnhealthy');
    else                                                     return this.translate('Hazardous');
  },
  compare: function(a, b) {
    if (a.value * pollutionNorm[a.key] < b.value * pollutionNorm[b.key])
      return -1;
    else if (a.value * pollutionNorm[a.key] > b.value * pollutionNorm[b.key])
      return 1;
    else
      return 0;
  }
});
