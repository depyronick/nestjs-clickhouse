import { DynamicModule, Module, ModuleMetadata, Provider, Type } from '@nestjs/common';

import {
  ClickHouseClient,
  ClickHouseClientOptions as ClickHouseNodeClientOptions
} from '@depyronick/clickhouse-client';

export const CLICKHOUSE_MODULE_OPTIONS = "CLICKHOUSE_MODULE_OPTIONS";

export class ClickHouseModuleOptions extends ClickHouseNodeClientOptions { }

export interface ClickHouseModuleOptionsFactory {
  createClickhouseOptions(): Promise<ClickHouseModuleOptions> | ClickHouseModuleOptions;
}

export interface ClickHouseModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
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
    return {
      module: ClickHouseModule,
      imports: options.imports,
      providers: [
        ...this.createAsyncProviders(options),
        ...(options.extraProviders || [])
      ]
    }
  }

  private static createAsyncProviders(options: ClickHouseModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass
      }
    ]
  }

  private static createAsyncOptionsProvider(options: ClickHouseModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: CLICKHOUSE_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || []
      }
    }
  }
}
