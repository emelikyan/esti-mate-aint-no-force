import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

export async function parseDocument(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  switch (mimeType) {
    case "application/pdf": {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      return text ?? "";
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
