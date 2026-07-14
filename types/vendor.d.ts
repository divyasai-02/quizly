declare module "pdf-parse" {
  function pdfParse(dataBuffer: Buffer): Promise<{ text: string; numpages?: number }>;
  export = pdfParse;
}

declare module "pdf-parse/lib/pdf-parse.js" {
  export default function pdfParse(dataBuffer: Buffer): Promise<{ text: string; numpages?: number }>;
}
