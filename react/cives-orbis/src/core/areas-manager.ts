import { AreaCore } from "./area";

export class AreasManager {
  areas: AreaCore[] = [];

  areasMap = new Map<number, AreaCore>();

  lastId = 0;

  make(color: number) {
    const area = new AreaCore(color);
    area.id = this.lastId++;
    this.areas.push(area);
    this.areasMap.set(area.id, area);
    return area;
  }

  destroy(area: AreaCore) {
    this.areasMap.delete(area.id);
    const index = this.areas.indexOf(area);
    if (index !== -1) {
      this.areas.splice(index, 1);
    }
  }
}
