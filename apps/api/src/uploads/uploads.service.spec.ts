import { Test, TestingModule } from '@nestjs/testing';
import { FareFotoStoreService } from '../common/persistence/fare-foto-store.service';
import { UploadsService } from './uploads.service';

describe('UploadsService', () => {
  let service: UploadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadsService, FareFotoStoreService],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  it('should map uploaded photo metadata to response payload', () => {
    const files = [
      {
        originalname: 'familia.jpg',
        filename: 'foto-123.jpg',
        mimetype: 'image/jpeg',
        size: 2048,
      } as Express.Multer.File,
    ];

    expect(service.registrarArquivos('photos', files)).toEqual([
      {
        categoria: 'photos',
        originalName: 'familia.jpg',
        filename: 'foto-123.jpg',
        mimeType: 'image/jpeg',
        size: 2048,
        url: '/uploads/photos/foto-123.jpg',
      },
    ]);
  });

  it('should reject when request has no files', () => {
    expect(() => service.registrarArquivos('documents', [])).toThrow(
      'Envie ao menos um arquivo.',
    );
  });

  it('should derive file name from uploaded URL when creating item metadata', () => {
    service.registrarArquivos('photos', [
      {
        originalname: 'familia.jpg',
        filename: 'foto-123.jpg',
        mimetype: 'image/jpeg',
        size: 2048,
      } as Express.Multer.File,
    ]);

    expect(
      service.prepararArquivoParaCadastro(
        'photos',
        undefined,
        '/uploads/photos/foto-123.jpg',
      ),
    ).toEqual({
      arquivoNome: 'familia.jpg',
      arquivoUrl: '/uploads/photos/foto-123.jpg',
    });
  });

  it('should reject URL from another upload category', () => {
    expect(() =>
      service.prepararArquivoParaCadastro(
        'documents',
        undefined,
        '/uploads/photos/foto-123.jpg',
      ),
    ).toThrow('A URL informada nao pertence a rota /uploads/documents/.');
  });
});
