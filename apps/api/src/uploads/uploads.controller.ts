import {
  BadRequestException,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Express } from 'express';
import { createId } from '../common/utils/create-id';
import type { UploadedArquivo } from './interfaces/uploaded-arquivo.interface';
import {
  UPLOAD_SUBPATHS,
  type UploadCategoria,
  UploadsService,
} from './uploads.service';

const MAX_FILES_PER_REQUEST = 20;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const createUploadInterceptorOptions = (categoria: UploadCategoria) => ({
  storage: diskStorage({
    destination: (_request, _file, callback) => {
      const destination = join(
        process.cwd(),
        'uploads',
        UPLOAD_SUBPATHS[categoria],
      );

      mkdirSync(destination, { recursive: true });
      callback(null, destination);
    },
    filename: (_request, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();

      callback(null, `${createId()}${extension}`);
    },
  }),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (
    _request: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (categoria === 'photos' && !file.mimetype.startsWith('image/')) {
      callback(
        new BadRequestException(
          'A rota /uploads/photos aceita apenas arquivos de imagem.',
        ),
        false,
      );
      return;
    }

    callback(null, true);
  },
});

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('photos')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Envia uma ou mais fotos' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['files'],
    },
  })
  @UseInterceptors(
    FilesInterceptor(
      'files',
      MAX_FILES_PER_REQUEST,
      createUploadInterceptorOptions('photos'),
    ),
  )
  enviarFotos(
    @UploadedFiles() files: Express.Multer.File[],
  ): UploadedArquivo[] {
    return this.uploadsService.registrarArquivos('photos', files);
  }

  @Post('documents')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Envia um ou mais documentos' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['files'],
    },
  })
  @UseInterceptors(
    FilesInterceptor(
      'files',
      MAX_FILES_PER_REQUEST,
      createUploadInterceptorOptions('documents'),
    ),
  )
  enviarDocumentos(
    @UploadedFiles() files: Express.Multer.File[],
  ): UploadedArquivo[] {
    return this.uploadsService.registrarArquivos('documents', files);
  }
}
