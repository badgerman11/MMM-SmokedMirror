Module.register('MMM-SmokedMirror', {
    defaults: {
		showLocation: true,
		showValues: true,
		updateInterval: 30,
		animationSpeed: 1000
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
		this.config.url = 'http://powietrze.gios.gov.pl/pjp/current/station_details/table/' + this.config.stationID + '/1/0'
		this.config.yql = 'SELECT * FROM html WHERE url="' + this.config.url + '" AND xpath=\'//div[@class="container"]//div[@class="row"]//div[@class="table-responsive"]//table//tbody//tr//td[' + (1 + this.config.pollutionColumn) + ']\'|truncate(count=24)'
		
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
					response.query.results.td.forEach(function(item){
						pollution = parseFloat(item.replace(',', '.'))
						if(pollution) {
							self.data.pollution = pollution
						}
					})
					self.loaded = true;
					self.updateDom(self.animationSpeed);
				}
			});
		});
	},
	html: {
		icon: '<i class="fa fa-leaf"></i>',
		city: '<div class="xsmall">{0}</div>',
		values: '<span class="small light">{0}</span>',
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
	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement('div');
		if (!this.config.stationID) {
			wrapper.innerHTML = 'Please set the <i>stationID</i> in the config for module: ' + this.name + '.';
			wrapper.className = 'dimmed light small';
		}
		else if (!this.loaded || !this.data.location) {
			wrapper.innerHTML = 'Loading air quality ...';
			wrapper.className = 'dimmed light small';
		}
		else if (!this.data.pollution) {
			wrapper.innerHTML = 'No data for ' + this.config.pollutionType;
			wrapper.className = 'dimmed light small';
		}
		else {
			wrapper.innerHTML = 
				this.html.quality.format(
					this.html.icon,
					this.config.showValues ? this.config.pollutionType + ' ' : '',
					this.impact(this.data.pollution),
					(this.config.showValues ? this.html.values.format(' (' + this.data.pollution.toString().replace('.', ',') + ' z ' + this.config.pollutionNorm + this.config.units + ')') : ''),
					(this.config.showLocation ? this.html.city.format(this.data.location) : '')
				)
		}
		return wrapper;
	},
	impact: function(pollution) {
		if(pollution < this.config.pollutionNorm) return 'Dobra';
		else if(pollution < this.config.pollutionNorm * 2) return 'Średnia';
		else if(pollution < this.config.pollutionNorm * 3) return 'Niska';
		else if(pollution < this.config.pollutionNorm * 4) return 'Zła';
		else if(pollution < this.config.pollutionNorm * 6) return 'Bardzo zła';
		else return 'Toksyczna';
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
					self.data.location = response.query.results.caption.replace(/Dane pomiarowe tabele +|\t+|\(.+|\n +/gmi, '')
					self.updateDom(self.animationSpeed);
				}
			});
		});
	},
});