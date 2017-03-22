# build-outerspatial-mobile-v2-json

## Assumptions

- For now, we're going to assume an "all or nothing" with an organization's areas and communities. This means that if an organization is part of a community, we'll assume all of the organization's areas are also part of that community. This is not ideal for the long-term, but there's no getting around it right now with the way OuterSpatial's data is structured.

## Notes

### Communities

- Potentially use [these](https://mapzen.com/data/metro-extracts/) to create communities
- A community's "count" object should contain the following properties: "organizations", "points_of_interest", and "trips_and_trails"
- Communities are currently using rectangle extents. They should be switched to detailed polygons to prevent overlap and add precision before release.

### Areas

- 
