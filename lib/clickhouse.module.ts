import { DynamicModule, Module, ModuleMetadata, Provider, Type } from '@nestjs/common';

import {
  ClickHouseClient,
  ClickHouseClientOptions
} from '@depyronick/clickhouse-client';

export class ClickHouseModuleOptions extends ClickHouseClientOptions { }

export const CLICKHOUSE_ASYNC_INSTANCE_TOKEN = 'CLICKHOUSE_INSTANCE_TOKEN';
export const CLICKHOUSE_ASYNC_MODULE_OPTIONS = 'CLICKHOUSE_MODULE_OPTIONS';

export interface ClickHouseModuleOptionsFactory {
  createClickHouseOptions(): Promise<ClickHouseModuleOptions> | ClickHouseModuleOptions;
}

export interface ClickHouseModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<ClickHouseModuleOptionsFactory>;
  useClass?: Type<ClickHouseModuleOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<ClickHouseModuleOptions> | ClickHouseModuleOptions;
  inject?: any[];
  extraProviders?: Provider[];
}

@Module({})
export class ClickHouseModule {
  static register(options: ClickHouseModuleOptions[]): DynamicModule {
    const clients = (options || []).map(item => {
      if (!item) {
        item = new ClickHouseModuleOptions();
      } else {
        item = Object.assign(new ClickHouseModuleOptions(), item);
      }

      return {
        provide: item.name,
        useValue: new ClickHouseClient(item)
      }
    });

    return {
      module: ClickHouseModule,
      providers: clients,
      exports: clients,
    };
  }

  static registerAsync(options: ClickHouseModuleAsyncOptions): DynamicModule {
    const providers = [
      ...this.createAsyncProviders(options),
      {
        provide: CLICKHOUSE_ASYNC_INSTANCE_TOKEN,
        useFactory: (options: ClickHouseModuleOptions) => {
          if (!options) {
            options = new ClickHouseModuleOptions();
          } else {
            options = Object.assign(new ClickHouseModuleOptions(), options);
          }

          return new ClickHouseClient(options);
        },
        inject: [CLICKHOUSE_ASYNC_MODULE_OPTIONS],
      },
      ...(options.extraProviders || []),
    ];

    return {
      module: ClickHouseModule,
      imports: options.imports,
      providers: providers,
      exports: providers
    };
  }

  private static createAsyncProviders(
    options: ClickHouseModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: ClickHouseModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: CLICKHOUSE_ASYNC_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    return {
      provide: CLICKHOUSE_ASYNC_MODULE_OPTIONS,
      useFactory: async (optionsFactory: ClickHouseModuleOptionsFactory) =>
        optionsFactory.createClickHouseOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }
}