import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  Type,
  BadRequestException,
} from '@nestjs/common';
import { validate, type ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * Équivalent pratique de `ValidationPipe` (whitelist + forbidNonWhitelisted + transform)
 * sans passer par le `PackageLoader` de Nest (qui échoue parfois à résoudre `class-validator`).
 */
@Injectable()
export class AppValidationPipe implements PipeTransform<unknown, unknown> {
  async transform(value: unknown, { metatype }: ArgumentMetadata): Promise<unknown> {
    if (!metatype || !this.shouldValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value as Record<string, unknown>, {
      enableImplicitConversion: true,
      exposeDefaultValues: true,
    });

    const errors = await validate(object as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: this.flattenErrors(errors),
      });
    }

    return object;
  }

  private shouldValidate(metatype: Type<unknown>): boolean {
    const primitives: Array<Type<unknown>> = [String, Boolean, Number, Array, Object, Date];
    return !primitives.includes(metatype);
  }

  private flattenErrors(errors: ValidationError[]): unknown[] {
    return errors.map((e) => ({
      property: e.property,
      constraints: e.constraints,
      children: e.children?.length ? this.flattenErrors(e.children) : undefined,
    }));
  }
}
