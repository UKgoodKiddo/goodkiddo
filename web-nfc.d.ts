interface NDEFRecord {
  readonly recordType: string;
  readonly mediaType?: string;
  readonly id?: string;
  readonly encoding?: string;
  readonly lang?: string;
  readonly data?: DataView | null;
}

interface NDEFMessage {
  readonly records: NDEFRecord[];
}

interface NDEFReadingEvent extends Event {
  readonly message: NDEFMessage;
  readonly serialNumber: string;
}

declare class NDEFReader extends EventTarget {
  onreading: ((event: NDEFReadingEvent) => void) | null;
  onreadingerror: ((event: Event) => void) | null;
  scan(options?: { signal?: AbortSignal }): Promise<void>;
}
