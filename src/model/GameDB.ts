import placename from "../lib/placename.json";
import items from "../lib/item.json";

const placeNameLib: { [key: number]: string } = placename;
const itemLib: { [key: number]: string } = items;

export function GetZoneName(zoneId: number): string {
  return placeNameLib[zoneId];
}

export function GetItemName(itemId: number): string {
  return itemLib[itemId];
}
