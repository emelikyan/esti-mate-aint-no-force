import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export async function parseDocument(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  switch (mimeType) {
    case "application/pdf": {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      await parser.destroy();
      return result.text;
    }
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case "text/plain": {
      return buffer.toString("utf-8");
    }
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}
