import type { Packet, PacketFilter } from "overlay-toolkit-lib";
import { importPcapFile } from "./pcap";

class Subscriber {
  name: string;
  filters: PacketFilter[]
  handler: (packet: Packet) => void;

  constructor(name: string, filters: PacketFilter[], handler: (packet: Packet) => void) {
    this.name = name;
    this.filters = filters;
    this.handler = handler;
  }

  public matches(packet: Packet): boolean {
    for (const filter of this.filters) {
      let match = true;
      if (filter.opcode !== undefined && filter.opcode !== packet.opcode) {
        match = false;
      }
      if (filter.direction !== undefined && filter.direction !== packet.dir) {
        match = false;
      }
      if (filter.length !== undefined && filter.length !== packet.length) {
        match = false;
      }
      if (match)
        return true;
    }
    return this.filters.length === 0;
  }
}

const replayIntervalMs = 50;

export class PcapReplay {

  packets: Packet[] = [];

  subscribers: Subscriber[] = [];

  SubscribePacket(name: string, filters: PacketFilter[], handler: (packet: Packet) => void): Promise<string> {
    return new Promise((resolve) => {
      this.subscribers.push(new Subscriber(name, filters, handler));
      resolve(name);
    });
  }

  public loadPcapPackets(pcap: ArrayBuffer): void {
    if (this.timerID !== null) {
      this.stop();
    }

    this.packets = importPcapFile(pcap).map(p => {
      return {
        ...p, 
        type: "otk::packet", 
        name: "PcapReplay",
        conn: "pcap-replay",
        length: p.data.length
      };
    });
    this.beginEpoch = this.packets.length > 0 ? this.packets[0].epoch : 0;
  }

  timerID: number | null = null;
  public play(): void {
    if (this.timerID !== null) {
      return;
    }
    this.timerID = setInterval(() => this.worker(), replayIntervalMs);
  }

  public stop(): void {
    if (this.timerID !== null) {
      clearInterval(this.timerID);
      this.timerID = null;
    }
    this.cursor = 0;
  }

  public pause(): void {
    if (this.timerID !== null) {
      clearInterval(this.timerID);
      this.timerID = null;
    }
  }

  cursor: number = 0;
  beginEpoch: number = 0;
  beginTime: number = 0;

  get currentPacket(): Packet | null {
    if (this.cursor < this.packets.length) {
      return this.packets[this.cursor];
    }
    return null;
  }

  worker(): void {
    if (this.cursor === 0 && this.currentPacket) {
      this.beginTime = new Date().getTime();
    }
    const now = new Date().getTime();
    const elapsed = now - this.beginTime;

    while (this.currentPacket && this.currentPacket.epoch - this.beginEpoch <= elapsed) {
      const packet = this.currentPacket;
      for (const sub of this.subscribers) {
        if (sub.matches(packet)) {
          sub.handler(packet);
        }
      }
      this.cursor++;
    }

    if (this.cursor >= this.packets.length) {
      this.stop();
    }
  }
}