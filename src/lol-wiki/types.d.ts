export interface ChampionQuote {
  name: string;
  quotes: Quote[];
}

export interface Quote {
  quote: string;
  url: string;
}
export interface ChampionRawQuote {
  name: string;
  quotes: UnfilteredQuote[];
  files: QuoteFile[];
}

export interface UnfilteredQuote {
  quote: string;
  wikiURL: string;
  s3URL: string;
}

export interface QuoteFile {
  key: string;
  url: string;
}

export interface XRayObject {
  quotes: XRayQuote[];
}

export interface XRayQuote {
  quote: string | undefined;
  firstQuoteChamp: string | undefined;
  innerQuoteChamp: string | undefined;
  innerQuote: string | undefined;
  url: string | undefined;
  url2: string | undefined;
  aatroxUrl: string | undefined;
}
