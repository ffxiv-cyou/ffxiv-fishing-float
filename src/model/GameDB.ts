export class GameDatabase {
  placeNames: { [key: number]: string } = {};
  itemNames: { [key: number]: string } = {};
  opcodes: { [key: string]: number } = {};
  
  constructor() {}

  async load(version: string): Promise<void> {
    let placnames = await fetch(`/data/${version}/placename.json`);
    this.placeNames = await placnames.json();

    let items = await fetch(`/data/${version}/item.json`);
    this.itemNames = await items.json();

    let opcodes = await fetch(`/data/${version}/opcode.json`);
    this.opcodes = await opcodes.json();
  }

  getZoneName(zoneId: number): string {
    return this.placeNames[zoneId] || "未知区域(" + zoneId + ")";
  }

  getItemName(itemId: number): string {
    return this.itemNames[itemId] || "未知物品(" + itemId + ")";
  }

  getOpcodes(): { [key: string]: number } {
    return this.opcodes;
  }
}