var count = 0;
var done = 0;
var fs = require('fs');
var csv = 'cartodb_id,unit_code,name,alt_text\n';
var errors = 'cartodb_id,unit_code,status_code,file_name\n';
var request = require('request');
var unitCodes = [
  'gate',
  'masi',
  'stli'
];
var interval;

function downloadImage (cartodbId, fileName, unitCode, callback) {
  var uri = 'https://www.nps.gov/npmap/projects/places-mobile/' + unitCode + '/media/' + fileName;

  request.head(uri, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      request(uri).pipe(fs.createWriteStream('./_photos/' + unitCode + '/' + cartodbId + '.' + fileName.split('.')[1])).on('close', function () {
        callback(true);
      });
    } else if (response) {
      callback(false, response.statusCode);
    } else {
      callback(false, null);
    }
  });
}

unitCodes.forEach(function (unitCode) {
  if (!fs.existsSync('./_photos/' + unitCode)) {
    fs.mkdirSync('./_photos/' + unitCode);
  }

  request('https://nps.carto.com/api/v2/sql?q=SELECT * FROM places_mobile_sites WHERE media IS NOT NULL and unit_code=\'' + unitCode + '\'', function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var query = 'SELECT * FROM places_mobile_media WHERE ';
      var rows = JSON.parse(body).rows;
      var sites = {};

      rows.forEach(function (row) {
        var id = row.media.split(',')[0];

        query += 'cartodb_id=' + id + ' OR ';
        sites[id] = row;
      });

      query = query.slice(0, query.length - 4);

      request.post('https://nps.carto.com/api/v2/sql?q=' + query, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          var rows = JSON.parse(body).rows;

          count = count + rows.length;

          rows.forEach(function (row, i) {
            var cartodbId = row.cartodb_id;
            var file = row.relative_url;
            var unitCode = row.unit_code;

            downloadImage(cartodbId, row.image_350, unitCode, function (success, statusCode) {
              if (success) {
                var site = sites[row.cartodb_id];

                csv += cartodbId + ',' + unitCode + ',"' + site.name.replace(/'"'/g, '""') + '",\n';
              } else {
                errors += row.cartodb_id + ',' + unitCode + ',' + statusCode + ',' + file + '\n';
              }

              done++;
              console.log((success ? 'Success!' : 'Error!') + ' ' + done + ' of ' + count);
            });
          });
        }
      });
    }
  });
});

// Not pretty, but it works.
setTimeout(function () {
  interval = setInterval(function () {
    if (count === done) {
      clearInterval(interval);
      fs.writeFile('./_photos/photos.csv', csv, function (error) {
        if (!error) {
          fs.writeFile('./_photos/errors.csv', errors, function (error) {
            if (!error) {
              console.log('Done!');
            }
          });
        }
      });
    }
  }, 1000);
}, 3000);
