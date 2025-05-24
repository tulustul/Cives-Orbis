# Naval Transport AI Requirements

Manages naval transport. Other subsystem can request a transport of land units from point A to B.

- public methods:
  - requestTransport
    - takes from and to tile and required capacity
    - returns null if transport is not possible or a NavalTransportRequest instance
- NavalTransportRequest
  - status: 'gatheringFleet' | 'waitingEmbarkment' | 'sailingToTarget'
  - tranportUnits: UnitCore[]
  - unitsToTransport: UnitCore[]
  - targetTile: TileCore
  - add more fields if needed
- when a transport is required, the system looks for a transport naval units (capacity) that operate on that sea
- if there is no transport available on the sea, a production is requested in a city next to that sea
- unit operating on other seas are ignored
- if unable to find/produce a unit, the request is rejected
- once a transport is selected, find a gathering point for land and sea unit.
- once the unit is found, it goes to the gathering point (gatheringFleet)
- When all naval and land units are at the gathering point, embark the land units.
- The fleet then sails to the final destination (sailingToTarget)
- The land units disembark
- The NavalTransportRequest is removed and the naval units are released for other requests
