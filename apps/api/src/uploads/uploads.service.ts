import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import type { Express } from 'express';
import { join } from 'path';
import { FareFotoStoreService } from '../common/persistence/fare-foto-store.service';
import type { UploadedArquivo } from './interfaces/uploaded-arquivo.interface';

export const UPLOAD_SUBPATHS = {
  photos: 'photos',
  documents: 'documents',
} as const;

export type UploadCategoria = keyof typeof UPLOAD_SUBPATHS;

@Injectable()
export class UploadsService {
  constructor(private readonly store: FareFotoStoreService) {}

  registrarArquivos(
    categoria: UploadCategoria,
    files: Express.Multer.File[],
  ): UploadedArquivo[] {
    if (!Array.isArray(files) || files.length === 0) {
      throw new BadRequestException('Envie ao menos um arquivo.');
    }

    const uploadedFiles = files.map((file) => ({
      categoria,
      originalName: file.originalname,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${UPLOAD_SUBPATHS[categoria]}/${file.filename}`,
    }));

    const uploads = this.store.read('uploads');
    const uploadsByUrl = new Map(uploads.map((file) => [file.url, file]));

    uploadedFiles.forEach((file) => {
      uploadsByUrl.set(file.url, file);
    });

    this.store.write('uploads', Array.from(uploadsByUrl.values()));

    return uploadedFiles;
  }

  prepararArquivoParaCadastro(
    categoria: UploadCategoria,
    arquivoNome?: string,
    arquivoUrl?: string,
  ): { arquivoNome: string; arquivoUrl?: string } {
    const normalizedNome = this.normalizarTextoOpcional(arquivoNome);
    const normalizedUrl = this.normalizarTextoOpcional(arquivoUrl);

    if (!normalizedUrl) {
      if (!normalizedNome) {
        throw new BadRequestException('Informe arquivoNome ou arquivoUrl.');
      }

      return {
        arquivoNome: normalizedNome,
      };
    }

    const upload = this.buscarArquivoEnviado(categoria, normalizedUrl);

    return {
      arquivoNome: normalizedNome ?? upload.originalName,
      arquivoUrl: upload.url,
    };
  }

  private buscarArquivoEnviado(
    categoria: UploadCategoria,
    arquivoUrl: string,
  ): UploadedArquivo {
    const normalizedUrl = this.validarUrlDaCategoria(categoria, arquivoUrl);
    const arquivoRegistrado = this.store
      .read('uploads')
      .find((item) => item.url === normalizedUrl);

    if (arquivoRegistrado) {
      return arquivoRegistrado;
    }

    const filename = this.extrairNomeArquivo(categoria, normalizedUrl);
    const absolutePath = join(
      process.cwd(),
      'uploads',
      UPLOAD_SUBPATHS[categoria],
      filename,
    );

    if (!existsSync(absolutePath)) {
      throw new BadRequestException('Arquivo de upload nao encontrado.');
    }

    return {
      categoria,
      originalName: filename,
      filename,
      mimeType: 'application/octet-stream',
      size: 0,
      url: normalizedUrl,
    };
  }

  private validarUrlDaCategoria(
    categoria: UploadCategoria,
    arquivoUrl: string,
  ): string {
    const prefix = this.criarPrefixoDaCategoria(categoria);

    if (!arquivoUrl.startsWith(prefix)) {
      throw new BadRequestException(
        `A URL informada nao pertence a rota ${prefix}.`,
      );
    }

    this.extrairNomeArquivo(categoria, arquivoUrl);

    return arquivoUrl;
  }

  private extrairNomeArquivo(
    categoria: UploadCategoria,
    arquivoUrl: string,
  ): string {
    const prefix = this.criarPrefixoDaCategoria(categoria);
    const filename = arquivoUrl
      .slice(prefix.length)
      .split('?')[0]
      .split('#')[0];

    if (
      filename.length === 0 ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      throw new BadRequestException('A URL do arquivo enviado e invalida.');
    }

    return filename;
  }

  private criarPrefixoDaCategoria(categoria: UploadCategoria): string {
    return `/uploads/${UPLOAD_SUBPATHS[categoria]}/`;
  }

  private normalizarTextoOpcional(valor?: string): string | undefined {
    if (valor === undefined) {
      return undefined;
    }

    const normalized = valor.trim();

    return normalized.length > 0 ? normalized : undefined;
  }
}
