var count = 0;
var fs = require('fs');
var request = require('request');

// Update these for your own query
var numberOfRecords = 20;
var tripId = 26;

function finish () {
  console.log('Finished!');
}
function getPage (pageNumber) {
  var url = 'http://api.outerspatial.com/v0/applications/' + tripId + '/trips?expand=true&page=' + pageNumber + '&per_page=' + numberOfRecords;

  request('http://api.outerspatial.com/v0/applications/' + tripId + '/trips?expand=true&page=' + pageNumber + '&per_page=' + numberOfRecords, function (error, response, body) {
    if (error || response.statusCode !== 200) {
      console.log('Error loading from OuterSpatial: ' + url);
      console.log('Canceling!');
    } else {
      var json = JSON.parse(body);

      if (pageNumber === 1) {
        count = json.paging.total_pages;
      }

      fs.writeFile('./_data/' + tripId + '_' + pageNumber + '.json', body, function (error) {
        if (error) {
          console.log('Error loading page ' + pageNumber + ' of ' + count);
        } else {
          console.log('Successfully created JSON for page ' + pageNumber + ' of ' + count);
        }

        if (pageNumber === count) {
          finish();
        } else {
          getPage(pageNumber + 1);
        }
      });
    }
  });
}

getPage(1);
