import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

interface ItemCount {
  item: number;
  count: number;
}

interface FishIntuitionInfo {
  fish_id: number;
  spot_id: number;
  fishes: ItemCount[];
}

const configPath = process.argv[2] || "scripts/convert_intuition.config.json";
const config = JSON.parse(readFileSync(resolve(configPath), "utf-8"));

const csvPath = resolve(config.csv);
const itemPath = resolve(config.itemJson);
const placenamePath = resolve(config.placenameJson);
const outputPath = resolve(config.output);

const itemData: Record<string, string> = JSON.parse(readFileSync(itemPath, "utf-8"));
const placenameData: Record<string, string> = JSON.parse(readFileSync(placenamePath, "utf-8"));

const itemNameToIds: Record<string, number[]> = {};
for (const [id, name] of Object.entries(itemData)) {
  if (!name) continue;
  if (!itemNameToIds[name]) itemNameToIds[name] = [];
  itemNameToIds[name].push(Number(id));
}

const placenameToIds: Record<string, number[]> = {};
for (const [id, name] of Object.entries(placenameData)) {
  if (!name) continue;
  if (!placenameToIds[name]) placenameToIds[name] = [];
  placenameToIds[name].push(Number(id));
}

function lookupItem(name: string, context: string): number | null {
  const ids = itemNameToIds[name];
  if (!ids) {
    console.warn(`[WARN] Item not found: "${name}" (in ${context})`);
    return null;
  }
  if (ids.length > 1) {
    console.warn(`[WARN] Item has multiple IDs: "${name}" -> [${ids.join(", ")}] (in ${context})`);
  }
  return ids[0];
}

function lookupPlacename(name: string, context: string): number | null {
  const ids = placenameToIds[name];
  if (!ids) {
    console.warn(`[WARN] Placename not found: "${name}" (in ${context})`);
    return null;
  }
  if (ids.length > 1) {
    console.warn(`[WARN] Placename has multiple IDs: "${name}" -> [${ids.join(", ")}] (in ${context})`);
  }
  return ids[0];
}

const csv = readFileSync(csvPath, "utf-8").trim();
const lines = csv.split("\n");
const result: FishIntuitionInfo[] = [];

for (const line of lines) {
  const match = line.match(/^(.+?),(.+?),(\d+s),(.+)$/);
  if (!match) {
    console.warn(`[WARN] Cannot parse line: "${line}"`);
    continue;
  }

  const fishName = match[1].trim();
  const spotName = match[2].trim();
  const fishesStr = match[4].trim();

  const fishId = lookupItem(fishName, `fish: ${fishName}`);
  const spotId = lookupPlacename(spotName, `fish: ${fishName}, spot: ${spotName}`);

  if (fishId === null || spotId === null) continue;

  const fishes: ItemCount[] = [];
  for (const part of fishesStr.split("|")) {
    const colonIdx = part.lastIndexOf(":");
    const name = part.substring(0, colonIdx).trim();
    const countStr = part.substring(colonIdx + 1).trim();
    const commaIdx = countStr.search(/[，,]/);
    const count = Number(commaIdx >= 0 ? countStr.substring(0, commaIdx) : countStr);
    if (isNaN(count)) {
      console.warn(`[WARN] Invalid count "${countStr}" for bait "${name}" in fish: ${fishName}`);
      continue;
    }
    const id = lookupItem(name, `fish: ${fishName}, bait: ${name}`);
    if (id !== null) {
      fishes.push({ item: id, count });
    }
  }

  result.push({ fish_id: fishId, spot_id: spotId, fishes });
}

writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n");
console.log(`Written ${result.length} entries to ${outputPath}`);
