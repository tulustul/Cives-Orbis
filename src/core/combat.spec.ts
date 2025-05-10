import { LandForm, TileDirection } from "@/shared";
import { attack, getDamage, simulateCombat } from "./combat";
import {
  alterGame,
  GameFactoryOptions,
  makeGame,
  SymbolCallbacks,
} from "./tests/game-factory";
import { putRiver } from "./tests/map-utils";

const symbolCallbacks: SymbolCallbacks = {
  "0": (game, tile) =>
    game.unitsManager.spawn("unit_warrior", tile, game.players[0]),
  "1": (game, tile) =>
    game.unitsManager.spawn("unit_warrior", tile, game.players[1]),
  "2": (game, tile) =>
    game.unitsManager.spawn("unit_spearman", tile, game.players[0]),
  "3": (game, tile) =>
    game.unitsManager.spawn("unit_spearman", tile, game.players[1]),
  s: (game, tile) =>
    game.unitsManager.spawn("unit_settler", tile, game.players[1]),
  H: (_, tile) => (tile.landForm = LandForm.hills),
  F: (_, tile) => (tile.forest = true),
  M: (_, tile) => (tile.landForm = LandForm.mountains),
  C: (game, tile) => game.citiesManager.spawn(tile, game.players[0], true),
};

const gameOptions: Partial<GameFactoryOptions> = {
  playersCount: 2,
  symbolCallbacks,
};

describe("combat system", () => {
  it("basic combat between equal units", () => {
    const mapData = [
      ". . . . .",
      " . . . . .",
      ". . 0 1 .",
      " . . . . .",
      ". . . . .",
    ];

    const game = makeGame(mapData, gameOptions);

    const attacker = game.players[0].units[0];
    const defender = game.players[1].units[0];

    // Check initial health
    expect(attacker.health).toBe(100);
    expect(defender.health).toBe(100);

    // Simulate combat first to check the expected outcome
    const simulation = simulateCombat(attacker, defender);

    // Combat should deal damage to both units
    expect(simulation.attacker.damage).toBeGreaterThan(0);
    expect(simulation.defender.damage).toBeGreaterThan(0);

    // With equal units, damage should be roughly equal
    expect(
      Math.abs(simulation.attacker.damage - simulation.defender.damage),
    ).toBeLessThan(5);

    // Now perform the actual attack
    const result = attack(attacker, defender.tile);

    // Both units should be damaged but still alive (undecided result)
    expect(attacker.health).toBeLessThan(100);
    expect(defender.health).toBeLessThan(100);
    expect(result).toBe(false); // Attack was not successful (can't move there)

    // Battle should have consumed action points
    expect(attacker.actionPointsLeft).toBeLessThan(
      attacker.definition.actionPoints,
    );
  });

  it("defender on hills gets defense bonus", () => {
    const mapData = [
      ". . . . .",
      " . . . . .",
      ". . 0 . .",
      " . . . . .",
      ". . . . .",
    ];

    const game = makeGame(mapData, gameOptions);

    // Add another unit and place on hills
    const hillsMapData = [
      ". . . . .",
      " . . . . .",
      ". . . H .",
      " . . . . .",
      ". . . . .",
    ];
    alterGame(game, hillsMapData, gameOptions);

    const defenderMapData = [
      ". . . . .",
      " . . . . .",
      ". . . 1 .",
      " . . . . .",
      ". . . . .",
    ];
    alterGame(game, defenderMapData, gameOptions);

    const attacker = game.players[0].units[0];
    const defender = game.players[1].units[0];

    // Verify defender is on hills
    expect(defender.tile.landForm).toBe(LandForm.hills);

    // Simulate combat
    const simulation = simulateCombat(attacker, defender);

    // Defender on hills should have higher strength due to bonus
    expect(simulation.defender.strength).toBeGreaterThan(
      simulation.attacker.strength,
    );

    // Verify that hills modifier is present
    expect(simulation.defender.modifiers.some((mod) => mod.type === 0)).toBe(
      true,
    );

    // Perform actual combat
    attack(attacker, defender.tile);

    // Attacker should take more damage than defender
    expect(attacker.health).toBeLessThan(defender.health);
  });

  it("defender in forest gets defense bonus", () => {
    const mapData = [
      ". . . . .",
      " . . . . .",
      ". . 0 . .",
      " . . . . .",
      ". . . . .",
    ];

    const game = makeGame(mapData, gameOptions);

    // Add forest and defender
    const forestMapData = [
      ". . . . .",
      " . . . . .",
      ". . . F .",
      " . . . . .",
      ". . . . .",
    ];
    alterGame(game, forestMapData, gameOptions);

    const defenderMapData = [
      ". . . . .",
      " . . . . .",
      ". . . 1 .",
      " . . . . .",
      ". . . . .",
    ];
    alterGame(game, defenderMapData, gameOptions);

    const attacker = game.players[0].units[0];
    const defender = game.players[1].units[0];

    // Verify defender is in forest
    expect(defender.tile.forest).toBe(true);

    // Simulate combat
    const simulation = simulateCombat(attacker, defender);

    // Defender in forest should have higher strength due to bonus
    expect(simulation.defender.strength).toBeGreaterThan(
      simulation.attacker.strength,
    );

    // Verify that forest modifier is present
    expect(simulation.defender.modifiers.some((mod) => mod.type === 1)).toBe(
      true,
    );

    // Perform actual combat
    attack(attacker, defender.tile);

    // Attacker should be more damaged than defender
    expect(attacker.health).toBeLessThan(defender.health);
  });

  it("defender behind river gets defense bonus", () => {
    const mapData = [
      ". . . . .",
      " . . . . .",
      ". . 0 1 .",
      " . . . . .",
      ". . . . .",
    ];

    const game = makeGame(mapData, gameOptions);

    const attacker = game.players[0].units[0];
    const defender = game.players[1].units[0];

    // Add river between units
    const attackerTile = attacker.tile;
    putRiver(attackerTile, TileDirection.E);

    // Verify river is present
    expect(attackerTile.riverParts.includes(TileDirection.E)).toBe(true);

    // Simulate combat
    const simulation = simulateCombat(attacker, defender);

    // Defender behind river should have higher strength due to bonus
    expect(simulation.defender.strength).toBeGreaterThan(
      simulation.attacker.strength,
    );

    // Verify that river modifier is present
    expect(simulation.defender.modifiers.some((mod) => mod.type === 2)).toBe(
      true,
    );

    // Perform actual combat
    attack(attacker, defender.tile);

    // Attacker should be more damaged than defender
    expect(attacker.health).toBeLessThan(defender.health);
  });

  it("low health reduces combat strength", () => {
    const mapData = [
      ". . . . .",
      " . . . . .",
      ". . 0 1 .",
      " . . . . .",
      ". . . . .",
    ];

    const game = makeGame(mapData, gameOptions);

    const attacker = game.players[0].units[0];
    const defender = game.players[1].units[0];

    // Damage attacker to 50% health
    attacker.health = 50;

    // Simulate combat
    const simulation = simulateCombat(attacker, defender);

    // Attacker should have lower strength due to health penalty
    expect(simulation.attacker.strength).toBeLessThan(
      simulation.defender.strength,
    );

    // Verify that health modifier is present
    expect(simulation.attacker.modifiers.some((mod) => mod.type === 3)).toBe(
      true,
    );

    // Perform actual combat
    attack(attacker, defender.tile);

    // Attacker should take more damage due to health disadvantage
    expect(attacker.health).toBeLessThan(25);
  });

  it("flanking provides attack bonus", () => {
    const mapData = [
      ". . . . .",
      " . . 0 . .",
      ". . . 1 .",
      " . . 0 . .",
      ". . . . .",
    ];

    const game = makeGame(mapData, gameOptions);

    // Units 0 and 2 are flanking the defender
    const attacker = game.players[0].units[0];
    const flanker = game.players[0].units[1];
    const defender = game.players[1].units[0];

    // Verify flanking setup - flanker is near defender
    expect(
      flanker.tile.getDirectionTo(defender.tile) !== TileDirection.NONE,
    ).toBe(true);

    // Simulate combat
    const simulation = simulateCombat(attacker, defender);

    // Verify that flanking modifier is present
    expect(simulation.attacker.modifiers.some((mod) => mod.type === 4)).toBe(
      true,
    );

    // Attacker with flanking should have higher strength
    expect(simulation.attacker.strength).toBeGreaterThan(
      simulation.defender.strength,
    );

    // Perform actual combat
    attack(attacker, defender.tile);

    // Defender should take more damage due to flanking
    expect(defender.health).toBeLessThan(attacker.health);
  });

  it("capturing a city", () => {
    const mapData = [
      ". . . . .",
      " . . . . .",
      ". . 0 . .",
      " . . . . .",
      ". . . . .",
    ];

    const game = makeGame(mapData, gameOptions);

    // Create enemy city
    const cityMapData = [
      ". . . . .",
      " . . . . .",
      ". . . C .",
      " . . . . .",
      ". . . . .",
    ];
    alterGame(game, cityMapData, gameOptions);

    // Change city owner to player 1
    const city = game.citiesManager.cities[0];
    city.changeOwner(game.players[1]);

    const attacker = game.players[0].units[0];

    // Verify city belongs to enemy before attack
    expect(city.player.id).toBe(1);

    // Perform attack
    const result = attack(attacker, city.tile);

    // Attack should succeed
    expect(result).toBe(true);

    // City should be captured
    expect(city.player.id).toBe(0);

    // Attacker should move to the city tile
    // TODO this actually requires a move action
    // expect(attacker.tile.x).toBe(city.tile.x);
    // expect(attacker.tile.y).toBe(city.tile.y);
  });

  it("getDamage", () => {
    expect(getDamage(0, 1)).toBe(0);
    expect(getDamage(1, 0)).toBe(100);

    expect(getDamage(1, 2)).toBe(13);
    expect(getDamage(2, 1)).toBe(69);

    expect(getDamage(1, 3)).toBe(8);
    expect(getDamage(3, 1)).toBe(100);

    expect(getDamage(1, 1)).toBe(30);
    expect(getDamage(2, 2)).toBe(30);

    expect(getDamage(3, 2)).toBe(49);
    expect(getDamage(2, 3)).toBe(18);

    expect(getDamage(1, 10)).toBe(2);
    expect(getDamage(10, 1)).toBe(100);

    expect(getDamage(5, 7.5)).toBe(18);
    expect(getDamage(7.5, 5)).toBe(49);
  });
});
