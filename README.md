# MagicMirrorModule-SmokedMirror

[MagicMirror Project on Github](https://github.com/MichMich/MagicMirror) | [MAIN INSPECTORATE FOR ENVIRONMENTAL PROTECTION](http://powietrze.gios.gov.pl)

## Usage 

To use this module, go to the *modules* subfolder of your mirror and clone this repository. 

### Configuration

To run the module, you need to add the following data to your config.js file.

```
{
	module: 'MMM-SmokedMirror',
	position: 'top_center', // you may choose any location
	config: {
		stationID: 488, // the station ID to check the pollution for
		pollutionType: 'PM2,5' // tupe of the pollution to show
	}
}
```
### StationID
Go to your station at [GIOŚ](http://powietrze.gios.gov.pl/pjp/station/search)
Use the part behind current/station_details/info/ for your station.
For example http://powietrze.gios.gov.pl/pjp/current/station_details/info/544 would be:
```
	location: 544
```

You may want to set the following options in the config section as well:

| Option |  Description | 
|---|---|
| `lang` | change the language<br><br>This is **OPTIONAL**.<br>**Default (and only one for now) value:** `pl` | 
| `showLocation` | toggle location printing<br><br>This is **OPTIONAL**.<br>**Default value:**`true` |
| `showValues` | toggle values printing<br><br>This is **OPTIONAL**.<br>**Default value:**`true` | 
| `stationID` | The ID for station you want to show the air quality.<br><br>This is **REQUIRED**.| 
| `updateInterval` |  change the update period in minutes<br><br>This is **OPTIONAL**.<br>**Default value:** `30` (minutes) | 

### Known Issues

Due to the [YQL](https://developer.yahoo.com/yql/) restrictions it is not possible to have fresh data aech time.
