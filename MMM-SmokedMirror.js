"use strict"

var pollutionTypeH = {
    PM10: 'PM10',
    'PM2.5': 'PM2.5',
    O3: 'O<sub>3</sub>',
    NO2: 'NO<sub>2</sub>',
    SO2: 'SO<sub>2</sub>',
    C6H6: 'C<sub>6</sub>H<sub>6</sub>',
    CO: 'CO'
  }
var pollutionNorm = {
  PM10: 50,
  'PM2.5': 25,
  O3: 120,
  NO2: 200,
  SO2: 125,
  C6H6: 5,
  CO: 10
}
var units = {
  PM10: 'µg/m³',
  'PM2.5': 'µg/m³',
  O3: 'µg/m³',
  NO2: 'µg/m³',
  SO2: 'µg/m³',
  C6H6: 'µg/m³',
  CO: 'mg/m³'
}

Date.prototype.addHours = function (h) {
  this.setHours(this.getHours() + h);
  return this;
}

Module.register('MMM-SmokedMirror', {
  defaults: {
    showDates: false,
    showDescription: true,
    showLocation: true,
    showValues: false,
    updateInterval: 30,
    animationSpeed: 1000,
    nowCast: false,
    showUnits: false,
    pollutionType: 'All',
    colors: false,
    fontSize: 100,
  },
  start: function(){
    Log.info('Starting module: ' + this.name);

    this.config.pollutionTypeH = pollutionTypeH
    this.config.pollutionNorm = pollutionNorm
    this.config.units = units

    this.config.fontSize = parseInt(this.config.fontSize)

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
    values: '({0} {1} {2}{3})',
    quality: '<table><caption>{0}</caption><tbody style="font-size: {1}%">{2}</tbody></table>',
    qualityTr: '<tr{0}><td>{1}</td><td>{2}</td><td>{3}</td><td class="light">{4}</td><td class="light">{5}</td></tr>'
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
        var time = new Date(item.time), now = new Date();
        tbody += this.html.qualityTr.format(
          this.config.colors ? ' style="color:' + this.color(item.value / this.config.pollutionNorm[item.key]) + '"' : '',
          this.html.icon,
          this.config.pollutionTypeH[item.key],
          this.config.showDescription ? this.impact(item.value, item.key) : '',
          (this.config.showValues ? this.html.values.format((Math.round(item.value * 10) / 10).toString().replace('.', ','), this.translate('Of'), this.config.pollutionNorm[item.key], this.config.units[item.key]) : ''),
          this.config.showDates || time.addHours(2) < now ? '(' + item.time + ')' : ''
        )
      }
      wrapper.innerHTML = this.html.quality.format(
        (this.config.showLocation && this.data.location ? this.html.city.format(this.data.location) : ''),
        this.config.fontSize,
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
    if (a.value / pollutionNorm[a.key] < b.value / pollutionNorm[b.key])
      return 1;
    else if (a.value / pollutionNorm[a.key] > b.value / pollutionNorm[b.key])
      return -1;
    else
      return 0;
  },
  color: function (x) {
    //color palete from https://en.wikipedia.org/wiki/Air_quality_index#india
    return (
      '#' + [
        -13.3333 * Math.pow(x, 2) + 87.3143 * x + 120.162,                         //R https://www.wolframalpha.com/input/?i=quadratic+fit+%7B0,121%7D,%7B1,187%7D,%7B2,255%7D,%7B3,255%7D,%7B4,255%7D,%7B6,165%7D  
        7.15942 * Math.pow(x, 3) - 65.911 * Math.pow(x, 2) + 114.636 * x + 177.93, //G https://www.wolframalpha.com/input/?i=cubic+fit+%7B0,188%7D,%7B10,208%7D,%7B20,207%7D,%7B30,154%7D,%7B40,14%7D,%7B60,43%7D
        4.64286 * Math.pow(x, 2) - 38.7286 * x + 107.371                           //B https://www.wolframalpha.com/input/?i=quadratic+fit+%7B0,106%7D,%7B1,76%7D,%7B2,46%7D,%7B3,37%7D,%7B4,23%7D,%7B6,43%7D
      ]
      .map(Math.round)
      .map(c => {
          if (255 < c)
            c = 255
          else if (0 > c)
            c = 0

          var hex = c.toString(16);
          return hex.length == 1 ? "0" + hex : hex;
      })
      .join('')
    );
  },
});
