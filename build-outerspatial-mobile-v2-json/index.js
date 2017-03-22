var fs = require('fs');
var msgpack = require('msgpack-lite');
var request = require('request');
var rimraf = require('rimraf');

// Prepare file system
function a () {
  rimraf('./_output', function () {
    fs.mkdirSync('./_output');
    fs.mkdirSync('./_output/areas');
    fs.mkdirSync('./_output/communities');
    b();
  });
}
// Write communities index
function b () {
  var communities = require('./api/communities.json');
  var encodeStream = msgpack.createEncodeStream();

  communities.forEach(function (community) {
    community.counts = {};
  });
  fs.writeFile('./_output/communities/index.json', JSON.stringify(communities), function (error) {
    if (error) {
      console.log('There was an error saving communities/index.json');
    } else {
      console.log('Successfully created communities/index.json');
      encodeStream.pipe(fs.createWriteStream('./_output/communities/index.msp'));
      encodeStream.write(communities);
      encodeStream.end();
      console.log('Successfully created communities/index.msp');
      c();
    }
  });
}
// <> Start building individual community objects
// Load organizations into community objects
// Load areas into community objects and store area id references in individual community.organization objects
function c () {
  var keepOrganization = [
    'address',
    'id',
    'logo',
    'name',
    'phone',
    'updated_at',
    'website'
  ];
  var url = 'https://api.outerspatial.com/v0/applications/26/organizations';

  // TODO: Need to make sure we're pulling in all organizations if the number returned exceeds 200
  request(url, function (error, response, body) {
    if (error || response.statusCode !== 200) {
      console.log('Error loading from ' + url + '\nCancelling!');
    } else {
      var json = JSON.parse(body);

      if (typeof json.data === 'object') {
        var areas = [];
        var completed = 0;
        var communities = require('./api/communities.json');
        var errorMessage = null;
        var interval;

        json.data.forEach(function (organization) {
          var community = communities.filter(function (obj) {
            return obj.name === organization.state;
          });
          var objOrganization = {
            area_ids: []
          };
          var url2 = 'https://api.outerspatial.com/v0/organizations/' + organization.id + '/parks';

          if (community.length) {
            community = community[0];
          } else {
            // San Francisco Bay
            community = communities[0];
          }

          if (!community.areas) {
            community.areas = [];
          }

          if (!community.organizations) {
            community.organizations = [];
          }

          // Clean up organization
          for (var key in organization) {
            if (keepOrganization.indexOf(key) > -1) {
              objOrganization[key] = organization[key];
            }
          }

          // Now load areas
          request(url2, function (error2, response2, body2) {
            if (error2 || response2.statusCode !== 200) {
              errorMessage = 'Error loading from ' + url2 + '\nCancelling!';
            } else {
              var json2 = JSON.parse(body2);

              if (typeof json2.data === 'object') {
                var keepArea = [
                  'id',
                  'name',
                  'text_description',
                  'updated_at',
                  'website'
                ];

                json2.data.forEach(function (area) {
                  var check = community.areas.filter(function (obj) {
                    return obj.id === area.id;
                  });
                  var objArea = {};

                  // Clean up area
                  for (var key in area) {
                    if (keepArea.indexOf(key) > -1) {
                      objArea[key] = area[key];
                    }
                  }

                  if (!check.length) {
                    community.areas.push(objArea);
                  }

                  if (objOrganization.area_ids.indexOf(area.id) === -1) {
                    objOrganization.area_ids.push(area.id);
                  }

                  check = areas.filter(function (obj) {
                    return obj.id === area.id;
                  });

                  if (!check.length) {
                    areas.push(objArea);
                  }
                });
              }

              community.organizations.push(objOrganization);
              completed++;
            }
          });
        });
        interval = setInterval(function () {
          if (errorMessage) {
            clearInterval(interval);
            console.log(errorMessage);
          } else if (json.data.length === completed) {
            var encodeStream = msgpack.createEncodeStream();

            clearInterval(interval);
            fs.writeFile('./_output/areas/index.json', JSON.stringify(areas), function (error) {
              if (error) {
                console.log('There was an error saving areas/index.json');
              } else {
                console.log('Successfully created areas/index.json');
                encodeStream.pipe(fs.createWriteStream('./_output/areas/index.msp'));
                encodeStream.write(areas);
                encodeStream.end();
                console.log('Successfully created areas/index.msp');
                d(communities);
              }
            });
          }
        }, 500);
      } else {
        console.log('Error loading from ' + url + '\nCancelling!');
      }
    }
  });
}
// ???
function d (dataCommunities) {
  e(dataCommunities);
}
// Write individual community files
function e (dataCommunities) {
  // TODO: Currently the community information is duplicated. Do we really need it in two places?
  dataCommunities.forEach(function (community) {
    var baseUrl = './_output/communities/' + community.id;
    var encodeStream = msgpack.createEncodeStream();

    fs.writeFile(baseUrl + '.json', JSON.stringify(community), function (error) {
      if (error) {
        console.log('There was an error saving the JSON for community: ' + community.id);
      } else {
        console.log('Successfully created the JSON for community: ' + community.id);
      }
    });
    encodeStream.pipe(fs.createWriteStream(baseUrl + '.msp'));
    encodeStream.write(community);
    encodeStream.end();
    console.log('Successfully created the MSP for community: ' + community.id);
  });
}
// </> End building individual community objects

a();
