import { TileRoad } from "./tile-improvements";
import { CitiesNetworks } from "./cities-network";
import {
  GameFactoryOptions,
  makeGame,
  SymbolCallbacks,
} from "./tests/game-factory";

const symbolCallbacks: SymbolCallbacks = {
  C: (game, tile) => {
    game.citiesManager.spawn(tile, game.players[0], true)!;
  },
  r: (_, tile) => {
    tile.road = TileRoad.road;
  },
};

const gameOptions: Partial<GameFactoryOptions> = {
  playersCount: 2,
  symbolCallbacks,
};

function dumpNetworks(networks: CitiesNetworks) {
  return networks.networks.map((network) => {
    return {
      nodes: network.nodes.map((node) => {
        const connections = node.connections.map((connection) => {
          return {
            city: connection.city.id,
            tiles: connection.tiles.length,
          };
        });
        return {
          city: node.city.id,
          connections,
        };
      }),
    };
  });
}

type DumpedNetworks = ReturnType<typeof dumpNetworks>;

describe("cities networks", () => {
  it("should create empty networks initially", () => {
    const mapData = [
      ". . . . .",
      " . . . . .",
      ". . . . .",
      " . . . . .",
      ". . . . .",
    ];

    const game = makeGame(mapData, gameOptions);
    game.citiesNetworks.update();

    expect(dumpNetworks(game.citiesNetworks)).toEqual([]);
  });

  it("should identify isolated cities", () => {
    const mapData = [
      ". . C . .",
      " . . . . .",
      ". . . . .",
      " . . . . .",
      ". . C . .",
    ];

    const game = makeGame(mapData, gameOptions);
    game.citiesNetworks.update();

    expect(dumpNetworks(game.citiesNetworks)).toEqual([
      { nodes: [{ city: 0, connections: [] }] },
      { nodes: [{ city: 1, connections: [] }] },
    ] as DumpedNetworks);
  });

  it("should connect cities with direct road connections", () => {
    const mapData = [
      ". . C r C .",
      " . . . . . .",
      " . . . . . .",
      ". . . . . .",
    ];

    const game = makeGame(mapData, gameOptions);
    game.citiesNetworks.update();

    expect(dumpNetworks(game.citiesNetworks)).toEqual([
      {
        nodes: [
          { city: 0, connections: [{ city: 1, tiles: 3 }] },
          { city: 1, connections: [{ city: 0, tiles: 3 }] },
        ],
      },
    ] as DumpedNetworks);
  });

  it("should connect cities with indirect road connections", () => {
    // Two cities connected by an indirect road path
    const mapData = [
      ". . C r . .",
      " . . . r . .",
      ". . . r C .",
      ". . . . . .",
    ];

    const game = makeGame(mapData, gameOptions);
    game.citiesNetworks.update();

    expect(dumpNetworks(game.citiesNetworks)).toEqual([
      {
        nodes: [
          { city: 0, connections: [{ city: 1, tiles: 4 }] },
          { city: 1, connections: [{ city: 0, tiles: 4 }] },
        ],
      },
    ] as DumpedNetworks);
  });

  it("should handle multiple separate networks", () => {
    const mapData = [
      "C r C . . .",
      " . . . . . .",
      ". . . C r C",
      ". . . . . .",
    ];

    const game = makeGame(mapData, gameOptions);
    game.citiesNetworks.update();

    expect(dumpNetworks(game.citiesNetworks)).toEqual([
      {
        nodes: [
          { city: 0, connections: [{ city: 1, tiles: 3 }] },
          { city: 1, connections: [{ city: 0, tiles: 3 }] },
        ],
      },
      {
        nodes: [
          { city: 2, connections: [{ city: 3, tiles: 3 }] },
          { city: 3, connections: [{ city: 2, tiles: 3 }] },
        ],
      },
    ] as DumpedNetworks);
  });

  it("should handle loops in a network", () => {
    const mapData = [
      ". . C r C .",
      " . r . . r .",
      ". . C r r .",
      ". . . . . .",
    ];

    const game = makeGame(mapData, gameOptions);
    game.citiesNetworks.update();

    expect(dumpNetworks(game.citiesNetworks)).toEqual([
      {
        nodes: [
          {
            city: 0,
            connections: [
              { city: 1, tiles: 3 },
              { city: 2, tiles: 3 },
            ],
          },
          {
            city: 1,
            connections: [
              { city: 0, tiles: 3 },
              { city: 2, tiles: 5 },
            ],
          },
          {
            city: 2,
            connections: [
              { city: 0, tiles: 3 },
              { city: 1, tiles: 5 },
            ],
          },
        ],
      },
    ] as DumpedNetworks);
  });

  it("triangle cities, no loop", () => {
    const mapData = [
      ". . . . .",
      " . . C . .",
      ". . r r .",
      " . r . r .",
      ". C . . C",
    ];

    const game = makeGame(mapData, gameOptions);
    game.citiesNetworks.update();

    expect(dumpNetworks(game.citiesNetworks)).toEqual([
      {
        nodes: [
          {
            city: 0,
            connections: [
              { city: 2, tiles: 4 },
              { city: 1, tiles: 4 },
            ],
          },
          {
            city: 1,
            connections: [
              { city: 0, tiles: 4 },
              { city: 2, tiles: 6 },
            ],
          },
          {
            city: 2,
            connections: [
              { city: 0, tiles: 4 },
              { city: 1, tiles: 6 },
            ],
          },
        ],
      },
    ] as DumpedNetworks);
  });

  it("all tiles are roads", () => {
    const mapData = [
      "r r r r C",
      " r r C r r",
      "r r r r r",
      " r r r r r",
      "r C r r C",
    ];

    const game = makeGame(mapData, gameOptions);
    game.citiesNetworks.update();

    expect(dumpNetworks(game.citiesNetworks)).toEqual([
      {
        nodes: [
          {
            city: 0,
            connections: [
              { city: 1, tiles: 3 },
              { city: 3, tiles: 5 },
              { city: 2, tiles: 6 },
            ],
          },
          {
            city: 1,
            connections: [
              { city: 0, tiles: 3 },
              { city: 3, tiles: 4 },
              { city: 2, tiles: 4 },
            ],
          },
          {
            city: 2,
            connections: [
              { city: 1, tiles: 4 },
              { city: 3, tiles: 4 },
              { city: 0, tiles: 6 },
            ],
          },
          {
            city: 3,
            connections: [
              { city: 1, tiles: 4 },
              { city: 2, tiles: 4 },
              { city: 0, tiles: 5 },
            ],
          },
        ],
      },
    ] as DumpedNetworks);
  });

  it("single complex network", () => {
    const mapData = [
      "C r . . .",
      " . r C . .",
      ". . . r .",
      ". . . r C",
      "C r r r .",
    ];

    const game = makeGame(mapData, gameOptions);
    game.citiesNetworks.update();

    expect(dumpNetworks(game.citiesNetworks)).toEqual([
      {
        nodes: [
          {
            city: 0,
            connections: [{ city: 1, tiles: 4 }],
          },
          {
            city: 1,
            connections: [
              { city: 2, tiles: 4 },
              { city: 0, tiles: 4 },
              { city: 3, tiles: 7 },
            ],
          },
          {
            city: 2,
            connections: [
              { city: 1, tiles: 4 },
              { city: 3, tiles: 6 },
            ],
          },
          {
            city: 3,
            connections: [
              { city: 2, tiles: 6 },
              { city: 1, tiles: 7 },
            ],
          },
        ],
      },
    ] as DumpedNetworks);
  });

  it("2 paths - should take a shorter path", () => {
    const mapData = [
      ". C r r .",
      " r . . r .",
      "r . . r .",
      " r . . r .",
      ". r C r .",
    ];

    const game = makeGame(mapData, gameOptions);
    game.citiesNetworks.update();

    expect(dumpNetworks(game.citiesNetworks)).toEqual([
      {
        nodes: [
          { city: 0, connections: [{ city: 1, tiles: 6 }] },
          { city: 1, connections: [{ city: 0, tiles: 6 }] },
        ],
      },
    ] as DumpedNetworks);
  });
});
