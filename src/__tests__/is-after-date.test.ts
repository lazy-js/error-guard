import 'reflect-metadata';

import { ClassValidator, ClassTransformer, IsAfterDate } from '../index';

const { IsDate, IsString, validateSync } = ClassValidator;
const { plainToInstance, Type } = ClassTransformer;

import { expect, it, describe } from 'vitest';

export function flatErrors(errors: any[]): string[] {
    let result: string[] = [];

    for (const err of errors) {
        if (err.constraints && typeof err.constraints === 'object') {
            result.push(...(Object.values(err.constraints) as string[]));
        }

        if (err.children && err.children.length > 0) {
            result.push(...flatErrors(err.children));
        }
    }

    return result;
}
const isAfterDateErrorMessage = 'to should be bigger than from';
// @ts-nocheck
class EducationalInstitutionDto {
    // @ts-ignore
    @IsString()
    name!: string;

    // @ts-ignore
    @IsString({ message: 'a' })
    fieldOfStudy!: string;

    // @ts-ignore
    @Type(() => Date)
    // @ts-ignore
    @IsDate({})
    from!: Date;

    // @ts-ignore
    @Type(() => Date)
    // @ts-ignore
    @IsDate({ message: 'SHOULD_BE_VALID_DATE' })
    // @ts-ignore
    @IsAfterDate('from', { message: isAfterDateErrorMessage })
    to!: Date;
}

describe('Test the vitest', () => {
    it('should run without errors', () => {
        expect(1 + 1).toBe(2);
    });

    it('should return error if "from" date is bigger than "to" date', () => {
        const testPlain = {
            name: 'Name',
            fieldOfStudy: 'any',
            to: new Date().toISOString(),
            from: new Date(Date.now() + 20).toISOString(),
        };

        const testInstance = plainToInstance(EducationalInstitutionDto, testPlain);
        const errors = validateSync(testInstance);
        expect(flatErrors(errors)).includes(isAfterDateErrorMessage);
    });

    it('should success if "to" date is bigger than "from" date', () => {
        const testPlain = {
            name: 'Name',
            fieldOfStudy: 'any',
            from: new Date().toISOString(),
            to: new Date(Date.now() + 20).toISOString(),
        };

        const testInstance = plainToInstance(EducationalInstitutionDto, testPlain);

        const errors = validateSync(testInstance);
        expect(flatErrors(errors).includes(isAfterDateErrorMessage)).toBeFalsy();
    });
});
