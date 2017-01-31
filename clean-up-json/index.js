// TODO: Do a spatial join with subareas GeoJSON file to populate subarea_id

var clean = [];
var fs = require('fs');
var geojson = JSON.parse(fs.readFileSync('./data.geojson', 'utf8'));
var keep = {
  'CAMPGROUND': 'Campground',
  'HORSE CAMP': 'Horse Camp',
  'PICNIC SITE': 'Picnic Area',
  'SNOWPARK': 'Snowpark',
  'TRAILHEAD': 'Trailhead'
};

function toTitleCase (str) {
  var uppercase = '';
  var split = str.split(' ');

  for (var j = 0; j < split.length; j++) {
    var s = split[j];

    uppercase += s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

    if (j < split.length - 1) {
      uppercase += ' ';
    }
  }

  return uppercase;
}

for (var i = 0; i < geojson.features.length; i++) {
  var feature = geojson.features[i];
  var properties = feature.properties;
  var name = properties.NAME;
  var type = properties.LU_SUBTYPE;

  if (name && type) {
    var keepType = keep[type];

    if (keepType) {
      clean.push({
        content: (function () {
          if (name.toLowerCase() === '10 mile snow park') {
            return [{
              html: '<p>This sno-park offers access to both motorized and non-motorized winter recreation activities in and around Newberry Caldera. The lot generallly fills up on weekends during the winter. It can also be used as a base for summer hiking/biking ventures.</p>',
              type: 'lead'
            }, {
              alt_text: null,
              title: null,
              type: 'png',
              url: null
            }, {
              html: '<h2>At a Glance</h2><p><ul><li>Permit Info: Sno-Park Permit required November 1 - April 30</li><li>Open Season: December - April</li><li>Restrictions: ATV\'s are prohibited in Newberry National Volcanic Monument.</li><li>Water: No</li><li>Restroom: Vault Toilet</li></ul></p><h2>Directions</h2><p>From Bend, travel south on Hwy 97 approx. 24 miles, then 10 miles east on County Road 21.</p>',
              type: 'body'
            }];
          } else {
            return null;
          }
        })(),
        events: [],
        geometry: feature.geometry,
        id: i++,
        live: [],
        media: [],
        name: toTitleCase(name),
        news_and_alerts: [],
        official_maps: [],
        outerspatial_url: null,
        related_features: [],
        related_urls: [],
        short_name: null,
        steward_url: null,
        subarea_id: null,
        tags: [],
        type: keepType
      });
    }
  }
}

fs.writeFile('clean.json', JSON.stringify(clean), function (err) {
  if (err) {
    return console.log(err);
  }
});
