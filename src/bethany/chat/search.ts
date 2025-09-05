export interface SearchResponse {
  candidates: Candidate[];
}

export interface Candidate {
  content: Content;
  groundingMetadata: GroundingMetadata;
}

export interface Content {
  parts: Part[];
  role: string;
}

export interface Part {
  text: string;
}

export interface GroundingMetadata {
  webSearchQueries: string[];
  searchEntryPoint: SearchEntryPoint;
  groundingChunks: GroundingChunk[];
  groundingSupports: GroundingSupport[];
}

export interface SearchEntryPoint {
  renderedContent: string;
}

export interface GroundingChunk {
  web: WebChunk;
}

export interface WebChunk {
  uri: string;
  title: string;
}

export interface GroundingSupport {
  segment: Segment;
  groundingChunkIndices: number[];
}

export interface Segment {
  startIndex: number;
  endIndex: number;
  text: string;
}
