# MagicMirrorModule-SmokedMirror

[MagicMirror Project on Github](https://github.com/MichMich/MagicMirror) | [MAIN INSPECTORATE FOR ENVIRONMENTAL PROTECTION](http://powietrze.gios.gov.pl)

<img src="https://raw.githubusercontent.com/Santanachia/MMM-SmokedMirror/master/screen.png" />

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
Use the part behind /station_details/info/ for your station.
For example http://powietrze.gios.gov.pl/pjp/current/station_details/info/544 would be:
```
  stationID: 544
```

You may want to set the following options in the config section as well:

| Option |  Description | 
|---|---|
| `animationSpeed` | Speed of the update animation. (Milliseconds)<br><br>**Possible values:** `0` to `5000`<br>**Default value:** `1000` (1 second) | 
| `lang` | Change the language<br><br>**Possible values:** `en` or `pl` | 
| `nowCast` | Show [NowCast](https://en.wikipedia.org/wiki/NowCast_(air_quality_index)) instead of hourly data<br><br>* works only with one of polutionType: `PM10` or `PM2,5` or `O3`<br>**Possible values:** `true` or `false`.<br>**Default value:** `false` | 
| `pollutionType` | Type of pollution to show<br><br>This is **REQUIRED**.<br>**Possible values:** `PM10`, `PM2,5`, `O3`, `NO2`, `SO2`, `C6H6`, `CO` | 
| `showLocation` | Toggle location printing<br><br>**Possible values:** `true` or `false`<br>**Default value:** `true` |
| `showUnits` | Toggle units printing<br><br>* works only with showValues: `true`<br>**Possible values:** `true` or `false`<br>**Default value:** `false` | 
| `showValues` | Toggle values printing<br><br>**Possible values:** `true` or `false`<br>**Default value:** `false` | 
| `stationID` | The ID for station you want to show the air quality.<br><br>This is **REQUIRED**. | 
| `updateInterval` | How often does the content needs to be fetched? (Minutes)<br><br>**Possible values:** `1` to `144`<br>**Default value:** `30` (30 minutes) | 

### Known Issues

Due to the [YQL](https://developer.yahoo.com/yql/) restrictions it is not possible to have fresh data each time.
