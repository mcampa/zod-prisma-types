import { it, expect, describe, afterEach, beforeEach, vi } from 'vitest';
import type DMMF from '@prisma/dmmf';
import type { CreateFileOptions } from '../../classes/fileWriter';
import { writeSingleFileImportStatements } from '../writeSingleFileImportStatements';
import { globalConfig } from '../../config';
import { DEFAULT_GENERATOR_CONFIG } from '../../__tests__/setup';
import { ExtendedDMMFSingleton } from '../../classes';

/////////////////////////////////////////////
// TEST HELPERS
/////////////////////////////////////////////

/**
 * Creates a minimal DMMF.Document structure for testing
 */
function createMockDMMF(options: {
  hasJsonTypes?: boolean;
  hasDecimalTypes?: boolean;
  customImports?: string[];
}): DMMF.Document {
  const {
    hasJsonTypes = false,
    hasDecimalTypes = false,
    customImports = [],
  } = options;

  const fields: DMMF.Field[] = [];
  const inputTypeFields: DMMF.SchemaArg[] = [];

  if (hasJsonTypes) {
    fields.push({
      kind: 'scalar',
      name: 'jsonField',
      isRequired: true,
      isList: false,
      isUnique: false,
      isId: false,
      isReadOnly: false,
      type: 'Json',
      isGenerated: false,
      isUpdatedAt: false,
      hasDefaultValue: false,
    });

    inputTypeFields.push({
      name: 'jsonField',
      isRequired: true,
      isNullable: false,
      inputTypes: [
        {
          type: 'Json',
          location: 'scalar',
          isList: false,
        },
      ],
    });
  }

  if (hasDecimalTypes) {
    fields.push({
      kind: 'scalar',
      name: 'decimalField',
      isRequired: true,
      isList: false,
      isUnique: false,
      isId: false,
      isReadOnly: false,
      type: 'Decimal',
      isGenerated: false,
      isUpdatedAt: false,
      hasDefaultValue: false,
    });

    inputTypeFields.push({
      name: 'decimalField',
      isRequired: true,
      isNullable: false,
      inputTypes: [
        {
          type: 'Decimal',
          location: 'scalar',
          isList: false,
        },
      ],
    });
  }

  // Add at least one field if none were added
  if (fields.length === 0) {
    fields.push({
      kind: 'scalar',
      name: 'id',
      isRequired: true,
      isList: false,
      isUnique: false,
      isId: true,
      isReadOnly: false,
      type: 'Int',
      isGenerated: false,
      isUpdatedAt: false,
      hasDefaultValue: true,
      default: {
        name: 'autoincrement',
        args: [],
      },
    });

    inputTypeFields.push({
      name: 'id',
      isRequired: true,
      isNullable: false,
      inputTypes: [
        {
          type: 'Int',
          location: 'scalar',
          isList: false,
        },
      ],
    });
  }

  const docLines: string[] = [];
  if (customImports.length > 0) {
    // Format: /// @zod.import(["import ...", "import ..."])
    const formattedImports = customImports
      .map((imp) => `"${imp.replace(/"/g, '\\"')}"`)
      .join(', ');
    docLines.push(`/// @zod.import([${formattedImports}])`);
  }
  const modelDocumentation =
    docLines.length > 0 ? docLines.join('\n') : undefined;

  return {
    datamodel: {
      enums: [],
      models: [
        {
          name: 'TestModel',
          dbName: null,
          schema: null,
          fields,
          primaryKey: null,
          uniqueFields: [],
          uniqueIndexes: [],
          isGenerated: false,
          documentation: modelDocumentation,
        },
      ],
      types: [],
      indexes: [],
    },
    schema: {
      rootQueryType: undefined,
      rootMutationType: undefined,
      inputObjectTypes: {
        prisma:
          inputTypeFields.length > 0
            ? [
                {
                  name: 'TestModelCreateInput',
                  constraints: {
                    maxNumFields: null,
                    minNumFields: null,
                  },
                  fields: inputTypeFields,
                },
              ]
            : [],
        model: [],
      },
      outputObjectTypes: {
        prisma: [],
        model: [],
      },
      enumTypes: {
        prisma: [],
        model: [],
      },
      fieldRefTypes: {
        prisma: [],
      },
    },
    mappings: {
      modelOperations: [],
      otherOperations: {
        read: [],
        write: [],
      },
    },
  };
}

/////////////////////////////////////////////
// TEST SETUP
/////////////////////////////////////////////

describe('writeSingleFileImportStatements', () => {
  let mockFileOptions: CreateFileOptions;
  let importCalls: { importName: string; importPath: string }[];
  let writeLineCalls: string[];

  beforeEach(() => {
    // Reset global state
    if (globalConfig.isInitialized()) {
      globalConfig.reset();
    }
    if (ExtendedDMMFSingleton.isInitialized()) {
      ExtendedDMMFSingleton.reset();
    }

    // Track calls
    importCalls = [];
    writeLineCalls = [];

    // Setup mock file options
    mockFileOptions = {
      writer: {
        writeLine: vi.fn((line: string) => {
          writeLineCalls.push(line);
        }),
      },
      writeImport: vi.fn((importName: string, importPath: string) => {
        importCalls.push({ importName, importPath });
      }),
      writeImportSet: vi.fn(),
      writeExport: vi.fn(),
      writeImports: vi.fn(),
      writeHeading: vi.fn(),
      writeJSDoc: vi.fn(),
    } as unknown as CreateFileOptions;
  });

  afterEach(() => {
    if (globalConfig.isInitialized()) {
      globalConfig.reset();
    }
    if (ExtendedDMMFSingleton.isInitialized()) {
      ExtendedDMMFSingleton.reset();
    }
  });

  /////////////////////////////////////////////
  // TESTS: isPrismaClientGenerator = false
  /////////////////////////////////////////////

  describe('when isPrismaClientGenerator is false', () => {
    it('should write zod import and Prisma import as type when no JSON or Decimal types', () => {
      // Setup config
      globalConfig.initializeWithConfig({
        ...DEFAULT_GENERATOR_CONFIG,
        isPrismaClientGenerator: false,
        prismaClientPath: '@prisma/client',
      });

      // Setup mock DMMF
      const mockDMMF = createMockDMMF({
        hasJsonTypes: false,
        hasDecimalTypes: false,
      });
      ExtendedDMMFSingleton.initialize(mockDMMF);

      // Execute
      writeSingleFileImportStatements(mockFileOptions);

      // Verify
      expect(importCalls).toHaveLength(2);
      expect(importCalls[0]).toEqual({
        importName: '{ z }',
        importPath: 'zod',
      });
      expect(importCalls[1]).toEqual({
        importName: 'type { Prisma }',
        importPath: '@prisma/client',
      });
    });

    it('should write Prisma import as value when JSON types are present', () => {
      // Setup config
      globalConfig.initializeWithConfig({
        ...DEFAULT_GENERATOR_CONFIG,
        isPrismaClientGenerator: false,
        prismaClientPath: '@prisma/client',
      });

      // Setup mock DMMF with JSON types
      const mockDMMF = createMockDMMF({
        hasJsonTypes: true,
        hasDecimalTypes: false,
      });
      ExtendedDMMFSingleton.initialize(mockDMMF);

      // Execute
      writeSingleFileImportStatements(mockFileOptions);

      // Verify
      expect(importCalls).toHaveLength(2);
      expect(importCalls[0]).toEqual({
        importName: '{ z }',
        importPath: 'zod',
      });
      expect(importCalls[1]).toEqual({
        importName: '{ Prisma }',
        importPath: '@prisma/client',
      });
    });

    it('should write Prisma import as value when Decimal types are present', () => {
      // Setup config
      globalConfig.initializeWithConfig({
        ...DEFAULT_GENERATOR_CONFIG,
        isPrismaClientGenerator: false,
        prismaClientPath: '@prisma/client',
      });

      // Setup mock DMMF with Decimal types
      const mockDMMF = createMockDMMF({
        hasJsonTypes: false,
        hasDecimalTypes: true,
      });
      ExtendedDMMFSingleton.initialize(mockDMMF);

      // Execute
      writeSingleFileImportStatements(mockFileOptions);

      // Verify
      expect(importCalls).toHaveLength(2);
      expect(importCalls[0]).toEqual({
        importName: '{ z }',
        importPath: 'zod',
      });
      expect(importCalls[1]).toEqual({
        importName: '{ Prisma }',
        importPath: '@prisma/client',
      });
    });

    it('should write Prisma import as value when both JSON and Decimal types are present', () => {
      // Setup config
      globalConfig.initializeWithConfig({
        ...DEFAULT_GENERATOR_CONFIG,
        isPrismaClientGenerator: false,
        prismaClientPath: '@prisma/client',
      });

      // Setup mock DMMF with both types
      const mockDMMF = createMockDMMF({
        hasJsonTypes: true,
        hasDecimalTypes: true,
      });
      ExtendedDMMFSingleton.initialize(mockDMMF);

      // Execute
      writeSingleFileImportStatements(mockFileOptions);

      // Verify
      expect(importCalls).toHaveLength(2);
      expect(importCalls[0]).toEqual({
        importName: '{ z }',
        importPath: 'zod',
      });
      expect(importCalls[1]).toEqual({
        importName: '{ Prisma }',
        importPath: '@prisma/client',
      });
    });

    it('should use custom prismaClientPath from config', () => {
      // Setup config with custom path
      globalConfig.initializeWithConfig({
        ...DEFAULT_GENERATOR_CONFIG,
        isPrismaClientGenerator: false,
        prismaClientPath: '../custom/prisma/client',
      });

      // Setup mock DMMF
      const mockDMMF = createMockDMMF({
        hasJsonTypes: false,
        hasDecimalTypes: false,
      });
      ExtendedDMMFSingleton.initialize(mockDMMF);

      // Execute
      writeSingleFileImportStatements(mockFileOptions);

      // Verify
      expect(importCalls[1]).toEqual({
        importName: 'type { Prisma }',
        importPath: '../custom/prisma/client',
      });
    });
  });

  /////////////////////////////////////////////
  // TESTS: isPrismaClientGenerator = true
  /////////////////////////////////////////////

  describe('when isPrismaClientGenerator is true', () => {
    it('should write zod import only when no JSON or Decimal types', () => {
      // Setup config
      globalConfig.initializeWithConfig({
        ...DEFAULT_GENERATOR_CONFIG,
        isPrismaClientGenerator: true,
        prismaLibraryPath: '@prisma/client/runtime/client',
      });

      // Setup mock DMMF
      const mockDMMF = createMockDMMF({
        hasJsonTypes: false,
        hasDecimalTypes: false,
      });
      ExtendedDMMFSingleton.initialize(mockDMMF);

      // Execute
      writeSingleFileImportStatements(mockFileOptions);

      // Verify - only zod import
      expect(importCalls).toHaveLength(1);
      expect(importCalls[0]).toEqual({
        importName: '{ z }',
        importPath: 'zod',
      });
    });

    it('should import JSON types when hasJsonTypes is true', () => {
      // Setup config
      globalConfig.initializeWithConfig({
        ...DEFAULT_GENERATOR_CONFIG,
        isPrismaClientGenerator: true,
        prismaLibraryPath: '@prisma/client/runtime/client',
      });

      // Setup mock DMMF with JSON types
      const mockDMMF = createMockDMMF({
        hasJsonTypes: true,
        hasDecimalTypes: false,
      });
      ExtendedDMMFSingleton.initialize(mockDMMF);

      // Execute
      writeSingleFileImportStatements(mockFileOptions);

      // Verify
      expect(importCalls).toHaveLength(3);
      expect(importCalls[0]).toEqual({
        importName: '{ z }',
        importPath: 'zod',
      });
      expect(importCalls[1]).toEqual({
        importName: '{ type JsonValue, type InputJsonValue }',
        importPath: '@prisma/client/runtime/client',
      });
      expect(importCalls[2]).toEqual({
        importName: '{ DbNull, JsonNull, AnyNull }',
        importPath: '@prisma/client/runtime/index-browser',
      });
    });

    it('should import Decimal when hasDecimalTypes is true', () => {
      // Setup config
      globalConfig.initializeWithConfig({
        ...DEFAULT_GENERATOR_CONFIG,
        isPrismaClientGenerator: true,
        prismaLibraryPath: '@prisma/client/runtime/client',
      });

      // Setup mock DMMF with Decimal types
      const mockDMMF = createMockDMMF({
        hasJsonTypes: false,
        hasDecimalTypes: true,
      });
      ExtendedDMMFSingleton.initialize(mockDMMF);

      // Execute
      writeSingleFileImportStatements(mockFileOptions);

      // Verify
      expect(importCalls).toHaveLength(3);
      expect(importCalls[0]).toEqual({
        importName: '{ z }',
        importPath: 'zod',
      });
      expect(importCalls[1]).toEqual({
        importName: '{ Decimal }',
        importPath: 'decimal.js',
      });
      expect(importCalls[2]).toEqual({
        importName: '{ type DecimalJsLike }',
        importPath: '@prisma/client/runtime/client',
      });
    });

    it('should import both JSON and Decimal types when both are present', () => {
      // Setup config
      globalConfig.initializeWithConfig({
        ...DEFAULT_GENERATOR_CONFIG,
        isPrismaClientGenerator: true,
        prismaLibraryPath: '@prisma/client/runtime/client',
      });

      // Setup mock DMMF with both types
      const mockDMMF = createMockDMMF({
        hasJsonTypes: true,
        hasDecimalTypes: true,
      });
      ExtendedDMMFSingleton.initialize(mockDMMF);

      // Execute
      writeSingleFileImportStatements(mockFileOptions);

      // Verify
      expect(importCalls).toHaveLength(4);
      expect(importCalls[0]).toEqual({
        importName: '{ z }',
        importPath: 'zod',
      });
      expect(importCalls[1]).toEqual({
        importName: '{ Decimal }',
        importPath: 'decimal.js',
      });
      expect(importCalls[2]).toEqual({
        importName:
          '{ type JsonValue, type InputJsonValue, type DecimalJsLike }',
        importPath: '@prisma/client/runtime/client',
      });
      expect(importCalls[3]).toEqual({
        importName: '{ DbNull, JsonNull, AnyNull }',
        importPath: '@prisma/client/runtime/index-browser',
      });
    });

    it('should use custom prismaLibraryPath from config', () => {
      // Setup config with custom path
      globalConfig.initializeWithConfig({
        ...DEFAULT_GENERATOR_CONFIG,
        isPrismaClientGenerator: true,
        prismaLibraryPath: '../custom/runtime/library',
      });

      // Setup mock DMMF with JSON types
      const mockDMMF = createMockDMMF({
        hasJsonTypes: true,
        hasDecimalTypes: false,
      });
      ExtendedDMMFSingleton.initialize(mockDMMF);

      // Execute
      writeSingleFileImportStatements(mockFileOptions);

      // Verify
      expect(importCalls[1]).toEqual({
        importName: '{ type JsonValue, type InputJsonValue }',
        importPath: '../custom/runtime/library',
      });
    });
  });

  /////////////////////////////////////////////
  // TESTS: Custom imports
  /////////////////////////////////////////////

  describe('when custom imports are present', () => {
    it('should write custom imports using writer.writeLine', () => {
      // Setup config
      globalConfig.initializeWithConfig({
        ...DEFAULT_GENERATOR_CONFIG,
        isPrismaClientGenerator: false,
      });

      // Setup mock DMMF with custom imports
      const mockDMMF = createMockDMMF({
        hasJsonTypes: false,
        hasDecimalTypes: false,
        customImports: [
          "import { myFunction } from '../../../../utils/myFunction';",
          "import { anotherFunction } from '../helpers';",
        ],
      });
      ExtendedDMMFSingleton.initialize(mockDMMF);

      // Execute
      writeSingleFileImportStatements(mockFileOptions);

      // Verify
      expect(mockFileOptions.writer.writeLine).toHaveBeenCalledTimes(2);
      expect(mockFileOptions.writer.writeLine).toHaveBeenCalledWith(
        "import { myFunction } from '../../../../utils/myFunction';",
      );
      expect(mockFileOptions.writer.writeLine).toHaveBeenCalledWith(
        "import { anotherFunction } from '../helpers';",
      );
    });

    it('should write custom imports with JSON types', () => {
      // Setup config
      globalConfig.initializeWithConfig({
        ...DEFAULT_GENERATOR_CONFIG,
        isPrismaClientGenerator: false,
      });

      // Setup mock DMMF with custom imports and JSON types
      const mockDMMF = createMockDMMF({
        hasJsonTypes: true,
        hasDecimalTypes: false,
        customImports: ["import { validator } from './validators';"],
      });
      ExtendedDMMFSingleton.initialize(mockDMMF);

      // Execute
      writeSingleFileImportStatements(mockFileOptions);

      // Verify
      expect(importCalls).toHaveLength(2); // zod + Prisma
      expect(mockFileOptions.writer.writeLine).toHaveBeenCalledTimes(1);
      expect(mockFileOptions.writer.writeLine).toHaveBeenCalledWith(
        "import { validator } from './validators';",
      );
    });

    it('should handle empty custom imports set', () => {
      // Setup config
      globalConfig.initializeWithConfig({
        ...DEFAULT_GENERATOR_CONFIG,
        isPrismaClientGenerator: false,
      });

      // Setup mock DMMF with empty custom imports
      const mockDMMF = createMockDMMF({
        hasJsonTypes: false,
        hasDecimalTypes: false,
        customImports: [],
      });
      ExtendedDMMFSingleton.initialize(mockDMMF);

      // Execute
      writeSingleFileImportStatements(mockFileOptions);

      // Verify - custom imports not written
      expect(mockFileOptions.writer.writeLine).not.toHaveBeenCalled();
    });

    it('should handle null custom imports', () => {
      // Setup config
      globalConfig.initializeWithConfig({
        ...DEFAULT_GENERATOR_CONFIG,
        isPrismaClientGenerator: false,
      });

      // Setup mock DMMF with null custom imports
      const mockDMMF = createMockDMMF({
        hasJsonTypes: false,
        hasDecimalTypes: false,
      });
      ExtendedDMMFSingleton.initialize(mockDMMF);

      // Execute
      writeSingleFileImportStatements(mockFileOptions);

      // Verify - custom imports not written
      expect(mockFileOptions.writer.writeLine).not.toHaveBeenCalled();
    });
  });

  /////////////////////////////////////////////
  // TESTS: Integration scenarios
  /////////////////////////////////////////////

  describe('integration scenarios', () => {
    it('should handle isPrismaClientGenerator with custom imports', () => {
      // Setup config
      globalConfig.initializeWithConfig({
        ...DEFAULT_GENERATOR_CONFIG,
        isPrismaClientGenerator: true,
        prismaLibraryPath: '@prisma/client/runtime/client',
      });

      // Setup mock DMMF
      const mockDMMF = createMockDMMF({
        hasJsonTypes: true,
        hasDecimalTypes: true,
        customImports: ["import { helper } from './helper';"],
      });
      ExtendedDMMFSingleton.initialize(mockDMMF);

      // Execute
      writeSingleFileImportStatements(mockFileOptions);

      // Verify all imports
      expect(importCalls).toHaveLength(4);
      expect(importCalls[0].importPath).toBe('zod');
      expect(importCalls[1].importPath).toBe('decimal.js');
      expect(importCalls[2].importPath).toBe('@prisma/client/runtime/client');
      expect(importCalls[3].importPath).toBe(
        '@prisma/client/runtime/index-browser',
      );
      expect(mockFileOptions.writer.writeLine).toHaveBeenCalledWith(
        "import { helper } from './helper';",
      );
    });

    it('should handle all features together in non-generator mode', () => {
      // Setup config
      globalConfig.initializeWithConfig({
        ...DEFAULT_GENERATOR_CONFIG,
        isPrismaClientGenerator: false,
        prismaClientPath: '../prisma/client',
      });

      // Setup mock DMMF
      const mockDMMF = createMockDMMF({
        hasJsonTypes: true,
        hasDecimalTypes: true,
        customImports: [
          "import { typeA } from './typeA';",
          "import { typeB } from './typeB';",
        ],
      });
      ExtendedDMMFSingleton.initialize(mockDMMF);

      // Execute
      writeSingleFileImportStatements(mockFileOptions);

      // Verify
      expect(importCalls).toHaveLength(2);
      expect(importCalls[0]).toEqual({
        importName: '{ z }',
        importPath: 'zod',
      });
      expect(importCalls[1]).toEqual({
        importName: '{ Prisma }',
        importPath: '../prisma/client',
      });
      expect(mockFileOptions.writer.writeLine).toHaveBeenCalledTimes(2);
    });
  });
});
