# Task-Based Military AI System

## Overview

The military AI system is redesigned as a task-based architecture with a single strategic layer (`ai-military.ts`) that creates and manages military tasks. This replaces the previous three-layer system (strategy, operational, tactical).

## Architecture

### Main System: `ai-military.ts`
**Responsibilities:**
- Strategic decision-making layer
- Threat assessment and opportunity identification
- Task creation and prioritization
- Resource allocation (units) between tasks
- Overall military situation monitoring
- Communication with ProductionAI for unit requests

### Task Hierarchy

```
Military AI System (Strategy Layer)
│
├── Defense Branch
│   │
│   ├── DefendCityTask
│   │   ├── AssessThreats
│   │   ├── PositionGarrisonTask (MoveUnitTask)
│   │   └── ReinforcementTask
│   │       ├── SelectReinforcements
│   │       ├── MoveUnitTask (for each reinforcement)
│   │       └── HandoffToDefense
│   │
│   └── InterceptTask (defensive interception)
│       ├── TrackEnemyUnit
│       ├── PredictPath
│       └── MoveUnitTask (intercept path)
│
└── Offense Branch
    │
    ├── FormArmyTask
    │   ├── SelectUnits (based on target requirements)
    │   ├── DefineGatheringPoint
    │   ├── MoveUnitTask (for each unit to gathering)
    │   └── TransitionToAttack (when ready)
    │
    └── AttackCityTask
        ├── AssessTarget
        ├── DetermineApproach
        │   ├── LandApproach
        │   │   └── MoveUnitTask (for each unit)
        │   ├── NavalApproach
        │   │   └── NavalTransportTask
        │   │       ├── MoveUnitTask (to embark)
        │   │       ├── MoveUnitTask (transport sailing)
        │   │       └── MoveUnitTask (to target after disembark)
        │   └── CombinedApproach
        │       ├── NavalTransportTask (for transported units)
        │       └── MoveUnitTask (for naval escorts)
        │
        ├── ExecuteSiege
        │   ├── PositionUnitsTask
        │   │   └── MoveUnitTask (tactical positioning)
        │   ├── AttackTask
        │   │   └── MoveUnitTask (attack moves)
        │   └── MaintainPressureTask
        │
        └── RetreatTask (if overwhelmed)
            └── MoveUnitTask (to safety)
```

## Task Descriptions

### DefendCityTask
**Purpose**: Protect cities from enemy threats

**State Machine**:
- `assessing` - Evaluating threat level and current defenses
- `positioning` - Moving garrison units to optimal positions
- `reinforcing` - Spawning ReinforcementTask if undermanned
- `defending` - Active defense, monitoring and responding to threats
- `completed` - Threat eliminated or city lost

**Key Methods**:
- `assessThreatLevel()` - Calculate threat based on nearby enemy forces
- `calculateRequiredDefense()` - Determine how many units needed
- `positionGarrison()` - Place units on defensive terrain/choke points
- `requestReinforcements()` - Spawn ReinforcementTask with priority

### ReinforcementTask
**Purpose**: Move units to support threatened locations

**State Machine**:
- `selecting` - Finding available units to send
- `moving` - Units traveling to destination
- `arriving` - Handing off units to parent task
- `completed` - All units arrived or task cancelled

**Key Methods**:
- `selectReinforcements()` - Pick units based on distance and strength
- `calculatePriority()` - Higher for immediate threats
- `handoffUnits()` - Transfer control to DefendCityTask

### InterceptTask
**Purpose**: Hunt and destroy specific enemy units

**State Machine**:
- `tracking` - Following enemy unit movement
- `predicting` - Calculating intercept path
- `intercepting` - Moving to cut off enemy
- `engaging` - In combat
- `completed` - Enemy destroyed or escaped

**Key Methods**:
- `predictEnemyPath()` - Estimate where enemy is going
- `calculateInterceptPoint()` - Find optimal intercept location
- `coordinateUnits()` - Multiple units encircle target

### FormArmyTask
**Purpose**: Assemble military forces for operations

**State Machine**:
- `planning` - Calculating force requirements
- `gathering` - Units moving to assembly point
- `forming` - Waiting for minimum force
- `ready` - Transitioning to combat task
- `completed` - Army formed or cancelled

**Key Properties**:
- `requiredStrength` - Minimum combined unit strength
- `gatheringPoint` - Where units assemble
- `targetTask` - What the army will do (usually AttackCityTask)

**Key Methods**:
- `selectUnits()` - Choose units based on proximity and role
- `assignRoles()` - Designate frontline, ranged, support units
- `checkReadiness()` - Verify minimum force assembled

### AttackCityTask
**Purpose**: Coordinate siege and capture of enemy cities

**State Machine**:
- `planning` - Assessing target and approach
- `approaching` - Moving army to target
- `positioning` - Tactical deployment around city
- `sieging` - Active attack phase
- `maintaining` - Keeping pressure between attacks
- `capturing` - Final assault
- `retreating` - Withdrawal if overwhelmed
- `completed` - City captured or task failed

**Key Properties**:
- `targetCity` - Enemy city to attack
- `requiredForce` - Calculated based on defenses
- `approach` - Land, naval, or combined
- `siegeUnits` - Units assigned to attack

**Key Methods**:
- `assessDefenses()` - Evaluate city strength and defenders
- `planApproach()` - Determine if naval transport needed
- `executeSiege()` - Coordinate unit attacks
- `maintainPressure()` - Keep city surrounded
- `evaluateRetreat()` - Check if should withdraw

### MaintainPressureTask (Sub-task of AttackCityTask)
**Purpose**: Keep enemy city under siege between attacks

**Responsibilities**:
- Keep units positioned to block reinforcements/supplies
- Prevent city from healing between attacks
- Block enemy units from escaping
- Rotate damaged units while maintaining encirclement
- Launch opportunistic attacks if enemy weakens
- Ensure units don't wander off during siege

## Integration with Existing Systems

### Unit Production
- Military AI **requests** units from ProductionAI, doesn't produce directly
- Priority levels:
  - **High**: Cities under immediate threat
  - **Medium**: Planned invasions
  - **Low**: General military buildup

### Unit Management
- Uses `ai.units` registry to track assignments
- Prevents double-assignment of units
- Releases units when tasks complete/fail

## Implementation Notes

### Task State Persistence
Each task must implement:
```typescript
serialize(): TaskSerialized {
  return {
    state: this.state,
    targetId: this.target?.id,
    assignedUnits: this.units.map(u => u.id),
    // ... other persistent data
  };
}
```

### Failure Handling
Tasks should fail gracefully:
- Release assigned units
- Report failure reason
- Allow parent task to adapt

### Priority System
Tasks compete for units based on:
1. Strategic importance (city defense > raids)
2. Urgency (immediate threat > future plans)
3. Distance (closer units preferred)

## Benefits Over Previous System

1. **Modularity**: Each task is self-contained
2. **Testability**: Tasks can be unit tested individually
3. **Debuggability**: Clear state machines and transitions
4. **Maintainability**: Easy to add new task types
5. **Performance**: Only active tasks consume CPU
6. **Reusability**: Tasks compose into complex behaviors

## Future Enhancements

- **ScoutEnemyTask**: Intelligence gathering
- **RaidTask**: Economic harassment
- **PatrolTask**: Border security
- **NavalBlockadeTask**: Cut off coastal cities
- **AmphibiousAssaultTask**: Specialized coastal attacks