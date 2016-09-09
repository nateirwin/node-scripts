var configs = require('./configs.json');
var directory = './_backups';
var done = 0;
var fs = require('fs');
var log = '';
var queries = [];
var request = require('request');
var timestamp = new Date().getTime();
var count = 0;
var interval;

if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory);
}

for (var userName in configs) {
  var config = configs[userName];
  var apiKey = config.api_key;

  if (!fs.existsSync(directory + '/' + userName)) {
    fs.mkdirSync(directory + '/' + userName);
  }

  fs.mkdirSync(directory + '/' + userName + '/' + timestamp);

  config.tables.forEach(function (table) {
    queries.push({
      apiKey: apiKey,
      table: table,
      userName: userName
    });
  });
}

count = queries.length * 2;

queries.forEach(function (query) {
  request('https://' + query.userName + '.carto.com/api/v2/sql?api_key=' + query.apiKey + '&format=csv&q=SELECT * FROM ' + query.table, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      fs.writeFile(directory + '/' + query.userName + '/' + timestamp + '/' + query.table + '.csv', body, function (error) {
        done++;

        if (error) {
          console.log('Error writing (CSV): ' + query.userName + '/' + query.table);
          log += 'Error writing (CSV): ' + query.userName + '/' + query.table + '\n';
        } else {
          console.log('Success: ' + done + ' of ' + count);
          log += 'Success: ' + done + ' of ' + count + '\n';
        }
      });
    } else {
      done++;
      console.log('Error ' + response.statusCode + ' downloading: https://' + query.userName + '.carto.com/api/v2/sql?api_key=' + query.apiKey + '&format=csv&q=SELECT * FROM ' + query.table);
      log += 'Error ' + response.statusCode + ' downloading: https://' + query.userName + '.carto.com/api/v2/sql?api_key=' + query.apiKey + '&format=csv&q=SELECT * FROM ' + query.table + '\n';
    }
  });
  request('https://' + query.userName + '.carto.com/api/v2/sql?api_key=' + query.apiKey + '&format=geojson&q=SELECT * FROM ' + query.table, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      fs.writeFile(directory + '/' + query.userName + '/' + timestamp + '/' + query.table + '.geojson', body, function (error) {
        done++;

        if (error) {
          console.log('Error writing (GeoJSON): ' + query.userName + '/' + query.table);
          log += 'Error writing (GeoJSON): ' + query.userName + '/' + query.table + '\n';
        } else {
          console.log('Success: ' + done + ' of ' + count);
          log += 'Success: ' + done + ' of ' + count + '\n';
        }
      });
    } else {
      done++;
      console.log('Error ' + response.statusCode + ' downloading (GeoJSON): https://' + query.userName + '.carto.com/api/v2/sql?api_key=' + query.apiKey + '&format=geojson&q=SELECT * FROM ' + query.table);
      log += 'Error ' + response.statusCode + ' downloading (GeoJSON): https://' + query.userName + '.carto.com/api/v2/sql?api_key=' + query.apiKey + '&format=geojson&q=SELECT * FROM ' + query.table + '\n';
    }
  });
});

interval = setInterval(function () {
  if (count === done) {
    clearInterval(interval);
    fs.writeFile(directory + '/log_' + timestamp + '.txt', log);
    console.log('Done!');
  }
}, 500);
