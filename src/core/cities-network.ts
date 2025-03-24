import { CityCore } from "./city";
import { Game } from "./game";
import { TileCore } from "./tile";

export class CitiesNetworks {
  networks: CitiesNetwork[] = [];

  constructor(private game: Game) {}

  update() {
    this.networks = [];
    const networksByCity = new Map<CityCore, CitiesNetwork>();

    for (const city of this.game.citiesManager.cities) {
      let network: CitiesNetwork;
      if (!networksByCity.has(city)) {
        network = new CitiesNetwork();
        city.network = network;
        this.networks.push(network);
        networksByCity.set(city, network);
      } else {
        network = networksByCity.get(city)!;
      }

      const node = network.addNode(city);

      const visitedTiles = new Set<TileCore>();
      const queue: TileCore[][] = [[city.tile]];
      while (queue.length > 0) {
        const tiles = queue.shift()!;
        const tile = tiles[tiles.length - 1];

        if (tile.city && tile.city !== city) {
          networksByCity.set(tile.city, network);
          tile.city.network = network;
          network.connect(node, tile.city, tiles);
          continue;
        }

        for (const neighbor of tile.neighbours) {
          if (
            (!neighbor.city && neighbor.road === null) ||
            visitedTiles.has(neighbor)
          ) {
            continue;
          }
          visitedTiles.add(neighbor);
          queue.push([...tiles, neighbor]);
        }
      }
    }
  }
}

export class CitiesNetwork {
  nodes: CitiesNetworkNode[] = [];
  nodesByCity = new Map<CityCore, CitiesNetworkNode>();

  addNode(city: CityCore) {
    const node: CitiesNetworkNode = {
      city: city,
      connections: [],
      connectedCities: new Set(),
    };
    this.nodes.push(node);
    this.nodesByCity.set(city, node);
    return node;
  }

  connect(node: CitiesNetworkNode, city: CityCore, tiles: TileCore[]) {
    node.connections.push({ city, tiles });
    node.connectedCities.add(city);
  }
}

export type CityConnection = {
  city: CityCore;
  tiles: TileCore[];
};

export type CitiesNetworkNode = {
  city: CityCore;
  connections: CityConnection[];
  connectedCities: Set<CityCore>;
};
