# Settling AI Requirements

## Core Features

- **City Building**:

  - Find best places to build a city by examining `TileCore.sweetSpotValue` (the higher the better)
  - Keep a list of at most 3 target locations
  - At each turn check if the targets are still valid. It can already be occupied by a city.
  - Make sure the target locations don't overlap each other. The cities should be at least 4 tiles apart
  - Build the first city immediately with the available settler. Don't look for best locations for the starting settler.
  - Proritize building cities in proximity to your existing cities - the further the target location is from your other cities, the lower score this target should get.

- **Settler Training**
  - If there are target locations for city placement, requests a settler production in production-ai.
  - Allocate each settler (also the one scheduled for production) to a target location.
  - The settler should go to the target location and found a city there
