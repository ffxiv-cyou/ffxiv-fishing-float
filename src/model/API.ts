export class API {
  basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  public async uploadFishingData(data: Uint8Array): Promise<Response> {
    const headers = this.generateHeader(data);
    const bodyStream = this.toReadableStream(data);
    const resp = await fetch(`${this.basePath}/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/cbor",
        ...headers,
      },
      body: bodyStream,
    });
    this.handleResponseHeader(resp.headers);
    return resp;
  }

  generateHeader(data: Uint8Array): { [key: string]: string } {
    var now = Date.now();
    return {
      "X-Client-Timestamp": now.toString(),
    };
  }

  handleResponseHeader(headers: Headers): void {
    const serverTimestamp = headers.get("X-Server-Timestamp");
    if (serverTimestamp) {
      const serverTime = parseInt(serverTimestamp, 10);
      const localTime = Date.now();
      const timeDiff = serverTime - localTime;
      // todo: timestamp calibration
      console.log(`Time difference between server and client: ${timeDiff} ms`);
    }
  }

  private toReadableStream(data: Uint8Array): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      },
    });
  }
}
