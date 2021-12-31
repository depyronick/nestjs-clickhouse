import { DynamicModule, Module } from '@nestjs/common';

import {
  ClickHouseClient,
  ClickHouseClientOptions as ClickHouseNodeClientOptions
} from '@depyronick/clickhouse-client';

export class ClickHouseModuleOptions extends ClickHouseNodeClientOptions { }

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
}
