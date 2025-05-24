# Military Operational AI Requirements

Responsible for producing, deploying and managing military groups of units. Takes orders from ai-military-strategy. Once the group is ready is hands over the control of the group to ai-military tactical.

## MilitaryGroup

- An abstraction for a group of military units
- Fields:
  - status: requested | forming | marching | deployed | retreating
  - type: garrison | defend | harass | takeCity
  - target strength: number
  - units: UnitCore[]
  - gathering tile: TileCore
  - target tile: TileCore

## Military Operational AI

- public methods:
  - requestMilitaryGroup
  - disbandMilitaryGroup
- the group starts in a 'requested' state
  - find potential non-assigned unit and assign them to the group
  - total strength of units must meet target strength
  - if there's not enough units, request unit production
- once the group is formed, change status to 'forming'
  - units move to the gathering tile
  - monitor unit arrival; when all units are present, change status to 'marching'
- in 'marching' state, units move toward the target tile
  - if intercepted or threatened, may switch to 'retreating'
- upon arrival at the target tile, change status to 'deployed'
  - hand over control to ai-military-tactical
- monitor group strength when deploy and send reinforcements when needed
