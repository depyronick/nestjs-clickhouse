import { DynamicModule, Module } from '@nestjs/common';

import { ClickHouseClient } from './client/ClickHouseClient';
import { ClickHouseModuleOptions } from './interfaces/ClickHouseModuleOptions';

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
