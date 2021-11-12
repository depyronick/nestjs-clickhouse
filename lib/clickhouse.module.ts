import { DynamicModule, Module } from '@nestjs/common';

import { ClickHouseClient } from './client/ClickHouseClient';
import { ClickHouseModuleOptions } from './interfaces/ClickHouseModuleOptions';

@Module({})
export class ClickhouseModule {
  static register(options: ClickHouseModuleOptions[]): DynamicModule {
    const clients = (options || []).map(item => {
      if (!item) {
        item = new ClickHouseModuleOptions();
      } else {
        item = Object.assign(new ClickHouseModuleOptions(), item);
      }

      return {
        provide: item.serverName,
        useValue: new ClickHouseClient(item)
      }
    });

    return {
      module: ClickhouseModule,
      providers: clients,
      exports: clients,
    };
  }
}
