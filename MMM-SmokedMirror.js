Module.register("MMM-SmokedMirror",{
    defaults: {
		lang: 'pl',
		showLocation: true,
		showValues: true,
		updateInterval: 30,
		animationSpeed: 1000
    },
	start: function(){
		Log.info('Starting module: ' + this.name);
		
		// uri to gather data
		this.config.url = 'http://powietrze.gios.gov.pl/pjp/current/station_details/table/' + this.config.stationID + '/1/0'
		this.config.ygl = 'http://query.yahooapis.com/v1/public/yql?q=SELECT * FROM html WHERE url=\'' + this.config.url + '\' AND xpath=\'//div[@class="container"]//div[@class="row"]//div[@class="table-responsive"]//table\'&format=json&callback=?'
		
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
		// load data
		this.load();
		// schedule refresh
		setInterval(
			this.load.bind(this),
			this.config.updateInterval * 60 * 1000);
	},
	load: function(){
		var self = this;
		$.getJSON( this.config.ygl, function(data){
			self.data.city = data.query.results.table.caption.replace(/Dane pomiarowe tabele |\t+|\(.+/gmi, '')
			var pollution
			data.query.results.table.tbody.tr.forEach(function(item, index){
				if(index < data.query.results.table.tbody.tr.length - 3) {
					pollution = parseFloat(item.td[self.config.pollutionColumn].replace(',', '.'))
					if(pollution) {
						self.data.pollution = pollution
					}
				}
			})
			self.loaded = true;
			self.updateDom(self.animationSpeed);
		})
	},
	html: {
		icon: '<i class="fa fa-leaf"></i>',
		city: '<div class="xsmall">{0}</div>',
		values: '<span class="small light">{0}</span>',
		quality: '<div>{0} {1}{2}{3}</div>'
	},
	getScripts: function() {
		return [
			'//code.jquery.com/jquery-3.2.0.min.js',
			'String.format.js'
		];
	},
	getStyles: function() {
		return ['https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css'];
	},
	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");
		if (!this.config.stationID) {
			wrapper.innerHTML = "Please set the <i>stationID</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
		}
		else if (!this.loaded) {
			wrapper.innerHTML = "Loading air quality index ...";
			wrapper.className = "dimmed light small";
		}
		else if (!this.data.pollution) {
			wrapper.innerHTML = "No data for " + this.config.pollutionType;
			wrapper.className = "dimmed light small";
		}
		else {
			wrapper.innerHTML = 
				this.html.quality.format(
					this.html.icon,
					this.config.showValues ? this.config.pollutionType + ' ' : '',
					this.impact(this.data.pollution),
					(this.config.showValues ? this.html.values.format(' (' + this.data.pollution.toString().replace('.', ',') + ' z ' + this.config.pollutionNorm + this.config.units + ')') : '')) + (this.config.showLocation ? this.html.city.format(this.data.city) : '');
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
	}
});