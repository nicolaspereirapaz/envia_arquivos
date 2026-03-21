import type { UploadCategoria } from '../uploads.service';

export interface UploadedArquivo {
  categoria: UploadCategoria;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}
