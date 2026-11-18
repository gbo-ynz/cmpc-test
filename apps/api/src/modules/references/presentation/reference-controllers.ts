import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReferenceController } from './reference.controller';

@ApiTags('authors')
@ApiBearerAuth()
@Controller('authors')
export class AuthorsController extends ReferenceController {
  protected readonly kind = 'authors' as const;
}

@ApiTags('publishers')
@ApiBearerAuth()
@Controller('publishers')
export class PublishersController extends ReferenceController {
  protected readonly kind = 'publishers' as const;
}

@ApiTags('genres')
@ApiBearerAuth()
@Controller('genres')
export class GenresController extends ReferenceController {
  protected readonly kind = 'genres' as const;
}
