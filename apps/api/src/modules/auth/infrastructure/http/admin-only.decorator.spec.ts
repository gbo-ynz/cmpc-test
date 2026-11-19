import { Controller, Get } from '@nestjs/common';
import { AdminOnly } from './admin-only.decorator';
import { ROLES_KEY } from './roles.decorator';

const SWAGGER_RESPONSES_KEY = 'swagger/apiResponse';

@AdminOnly()
@Controller('whole-class')
class WholeClassController {
  @Get()
  list() {
    return [];
  }
}

@Controller('one-method')
class OneMethodController {
  @Get()
  open() {
    return [];
  }

  @Get('export')
  @AdminOnly()
  export() {
    return [];
  }
}

describe('AdminOnly', () => {
  it('restricts a whole controller to administrators', () => {
    expect(Reflect.getMetadata(ROLES_KEY, WholeClassController)).toEqual(['ADMIN']);
  });

  it('restricts a single route and leaves its siblings open', () => {
    const { prototype } = OneMethodController;

    expect(Reflect.getMetadata(ROLES_KEY, prototype.export)).toEqual(['ADMIN']);
    expect(Reflect.getMetadata(ROLES_KEY, prototype.open)).toBeUndefined();
  });

  it('documents the 403 answer in Swagger', () => {
    const responses = Reflect.getMetadata(
      SWAGGER_RESPONSES_KEY,
      OneMethodController.prototype.export,
    );

    expect(responses).toHaveProperty('403');
  });
});
