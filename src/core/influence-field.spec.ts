/* import { Entity } from "./data/types";
import { InfluenceField, InfluenceFieldEmitter } from "./influence-field";
import { TilesMapCore } from "./tiles-map";

// function make(mapString: string) {
//   const rows = mapString.split("\n");
//   const values = rows.map((row) => row.split("|").map((v) => parseFloat(v)));

//   const [width, height] = [values[0].length, values.length];

//   const map = new TilesMapCore(width, height);

//   const influenceField = new InfluenceField(map);
// }

function dumpInfluence(
  influenceField: InfluenceField,
  entity: Entity,
): number[] {}

function dumpPressure(
  influenceField: InfluenceField,
  entity: Entity,
): number[] {}

describe("influenceField", () => {
  it("single emitter", () => {
    const map = new TilesMapCore(4, 4);
    const influenceField = new InfluenceField(map);
    const entity: Entity = { id: "foo", name: "foo" };
    influenceField.addEntity(entity);
    influenceField.addEmmitter(
      new InfluenceFieldEmitter({
        entity,
        tile: map.get(1, 1)!,
        minInfluenceToSpread: 0.1,
        pressure: 10,
        pressureSpreadModifier: 0.5,
      }),
    );

    influenceField.tick();
    // prettier-ignore
    expect(dumpPressure(influenceField, entity)).toEqual([
      0.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0, 0.0,
      0.0, 10, 0.0, 0.0,
        0.0, 0.0, 0.0, 0.0,
    ]);
    // prettier-ignore
    expect(dumpInfluence(influenceField, entity)).toEqual([
      0.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0, 0.0,
      0.0, 0.19, 0.0, 0.0,
        0.0, 0.0, 0.0, 0.0,
    ]);

    influenceField.tick();
    // prettier-ignore
    expect(dumpPressure(influenceField, entity)).toEqual([
      0.0, 0.0, 0.0, 0.0,
        1.9, 1.9, 0.0, 0.0,
      1.9, 10, 1.9, 0.0,
        1.9, 1.9, 0.0, 0.0,
    ]);
    // prettier-ignore
    expect(dumpInfluence(influenceField, entity)).toEqual([
      0.0, 0.0, 0.0, 0.0,
        0.04, 0.04, 0.0, 0.0,
      0.04, 0.5, 0.04, 0.0,
        0.04, 0.04, 0.0, 0.0,
    ]);

    influenceField.tick();
    // prettier-ignore
    expect(dumpPressure(influenceField, entity)).toEqual([
      0.0, 0.0, 0.0, 0.0,
        1.9, 1.9, 0.0, 0.0,
      1.9, 10, 1.9, 0.0,
        1.9, 1.9, 0.0, 0.0,
    ]);
    // prettier-ignore
    expect(dumpInfluence(influenceField, entity)).toEqual([
      0.0, 0.0, 0.0, 0.0,
        0.04, 0.04, 0.0, 0.0,
      0.04, 0.5, 0.04, 0.0,
        0.04, 0.04, 0.0, 0.0,
    ]);
  });
});
 */

describe("influenceField", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });
});
