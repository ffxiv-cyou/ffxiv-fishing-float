export class API {
  basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  public uploadFishingData(data: Uint8Array): Promise<Response> {
    const headers = this.generateHeader(data);
    return fetch(`${this.basePath}/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/cbor",
        ...headers,
      },
      body: data,
    });
  }

  generateHeader(data: Uint8Array): {[key: string]: string} {
    var now = Date.now();
    return {
      "X-Client-Timestamp": now.toString(),
    };
  }
}