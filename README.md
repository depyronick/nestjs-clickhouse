## Description

[ClickHouse®](https://clickhouse.com/) is an open-source, high performance columnar OLAP database management system for real-time analytics using SQL. ClickHouse combined with [TypeScript](https://www.typescriptlang.org/) helps you develop better type safety with your ClickHouse queries, giving you end-to-end typing.

## Installation

Install the following package:

```bash
$ npm i --save @depyronick/nestjs-clickhouse
```

## Quick Start

> This NestJS module is a wrapper for **[@depyronick/clickhouse-client](https://github.com/depyronick/clickhouse-client '@depyronick/clickhouse-client')**. You can find latest documentation for methods there.

### Importing the module

Once the installation process is complete, we can import the `ClickHouseModule` into the root `AppModule`.

```typescript
import { Module } from '@nestjs/common';
import { ClickHouseModule } from '@depyronick/nestjs-clickhouse';

@Module({
  imports: [
    ClickHouseModule.register([
      {
        name: 'ANALYTICS_SERVER',
        host: '127.0.0.1',
        password: '7h3ul71m473p4555w0rd',
      },
    ]),
  ],
})
export class AppModule {}
```

The `register()` method will register a ClickHouse client with the specified connection options.

See **[ClickHouseOptions](https://github.com/depyronick/clickhouse-client/blob/main/src/client/interfaces/ClickHouseClientOptions.ts 'ClickHouseOptions')** object for more information.

Each registered client should have an unique `name` definition. The default value for `name` property is `CLICKHOUSE_DEFAULT`. This property will be used as an injection token.

### Interacting with ClickHouse Client

To interact with the ClickHouse server that you have just registered, inject it to your class using the injection token.

```typescript
constructor(
	@Inject('ANALYTICS_SERVER')
	private analyticsServer: ClickHouseClient
) {}
```

> The `ClickHouseClient` class is imported from the `@depyronick/nestjs-clickhouse`.

## Examples

These are only a few examples, please see [@depyronick/clickhouse-client](https://github.com/depyronick/clickhouse-client) for up to date methods.

#### `ClickHouseClient.query<T>(query: string): Observable<T>`

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { ClickHouseClient } from '@depyronick/nestjs-clickhouse';

interface VisitsTable {
  timestamp: number;
  ip: string;
  userAgent: string;
  os: string;
  version: string;
  // ...
}

@Injectable()
export class AppService {
  constructor(
    @Inject('ANALYTICS_SERVER')
    private readonly analyticsServer: ClickHouseClient,
  ) {
    this.analyticsServer
      .query<VisitsTable>('SELECT * FROM visits LIMIT 10')
      .subscribe({
        error: (err: any): void => {
          // called when an error occurred during query
        },
        next: (row): void => {
          // called for each row
          // the type of row property here is VisitsTable
        },
        complete: (): void => {
          // called when stream is completed
        },
      });
  }
}
```

#### `ClickHouseClient.queryPromise<T>(query: string): Promise<T[]>`

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { ClickHouseClient } from '@depyronick/nestjs-clickhouse';

interface VisitsTable {
  timestamp: number;
  ip: string;
  userAgent: string;
  os: string;
  version: string;
  // ...
}

@Injectable()
export class AppService {
  constructor(
    @Inject('ANALYTICS_SERVER')
    private readonly analyticsServer: ClickHouseClient,
  ) {
    this.analyticsServer
      .queryPromise<VisitsTable>('SELECT * FROM visits LIMIT 10')
      .then((rows: VisitsTable[]) => {
        // all retrieved rows
      })
      .catch((err) => {
        // called when an error occurred during query
      });

    // or

    const rows = await this.analyticsServer.queryPromise(
      'SELECT * FROM visits LIMIT 10',
    );
  }
}
```

#### `ClickHouseClient.insert<T>(table: string, data: T[]): Observable<any>`

The `insert` method accepts two inputs.

- `table` is the name of the table that you'll be inserting data to.
  - Table value could be prefixed with database like `analytics_db.visits`.
- `data: T[]` array of JSON objects to insert.

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { ClickHouseClient } from '@depyronick/nestjs-clickhouse';

interface VisitsTable {
  timestamp: number;
  ip: string;
  userAgent: string;
  os: string;
  version: string;
  // ...
}

@Injectable()
export class AppService {
  constructor(
    @Inject('ANALYTICS_SERVER')
    private readonly analyticsServer: ClickHouseClient,
  ) {
    this.analyticsServer
      .insert<VisitsTable>('visits', [
        {
          timestamp: new Date().getTime(),
          ip: '127.0.0.1',
          os: 'OSX',
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/95.0.4638.69 Safari/537.36',
          version: '1.0.0',
        },
      ])
      .subscribe({
        error: (err: any): void => {
          // called when an error occurred during insert
        },
        next: (): void => {
          // currently next does not emits anything for inserts
        },
        complete: (): void => {
          // called when insert is completed
        },
      });
  }
}
```

## Multiple Clients

You can register multiple clients in the same application as follows:

```typescript
@Module({
  imports: [
    ClickHouseModule.register([
      {
        name: 'ANALYTICS_SERVER',
        host: '127.0.0.1',
        password: '7h3ul71m473p4555w0rd',
      },
      {
        name: 'CHAT_SERVER',
        host: '192.168.1.110',
        password: 'ch5ts3rv3Rp455w0rd',
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Then you can interact with these servers using their assigned injection tokens.

```typescript
constructor(
    @Inject('ANALYTICS_SERVER')
    private analyticsServer: ClickHouseClient,

    @Inject('CHAT_SERVER')
    private chatServer: ClickHouseClient
) { }
```

## Async Registration & Async Providers

For example, if you want to wait for the application to accept new connections until the necessary configuration settings for clickhouse are received from an asynchronous target, you can use the `registerAsync` method.

```typescript
import { Inject, Module } from '@nestjs/common';
import { ClickHouseModule } from '@depyronick/nestjs-clickhouse';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.development.env'],
      isGlobal: true,
    }),
    ClickHouseModule.registerAsync({
      useFactory: (config: ConfigService) => {
        return {
          host: config.get('CH_HOST'),
          database: config.get('CH_DB'),
          password: config.get('CH_PWD'),
          username: config.get('CH_USERNAME'),
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

Then you can use the `CLICKHOUSE_ASYNC_INSTANCE_TOKEN` to inject the `ClickHouseClient` with the asynchronous configuration that you just provided.

```typescript
import {
  ClickHouseClient,
  CLICKHOUSE_ASYNC_INSTANCE_TOKEN,
} from '@depyronick/nestjs-clickhouse';

export class AppModule {
  constructor(
    @Inject(CLICKHOUSE_ASYNC_INSTANCE_TOKEN)
    private readonly chWithAsyncConfig: ClickHouseClient,
  ) {
    this.chWithAsyncConfig
      .query('SELECT * FROM [TABLE] LIMIT 1')
      .subscribe((row) => console.log('row', row));
  }
}
```

If you want to define more than one `ClickHouseClient` using `registerAsync` method, you will need to create different modules, and inject `CLICKHOUSE_ASYNC_INSTANCE_TOKEN` into feature modules.

But you don't have to use `registerAsync` method to create asynchronous `ClickHouseClient` instances. You can also use custom providers:

```typescript
import { Inject, Module } from '@nestjs/common';
import { ClickHouseClient } from '@depyronick/nestjs-clickhouse';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.development.env'],
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: 'CH2',
      useFactory: (config: ConfigService) => {
        return new ClickHouseClient({
          host: config.get('CH2_HOST'),
          database: config.get('CH2_DB'),
          password: config.get('CH2_PWD'),
          username: config.get('CH2_USERNAME'),
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class AppModule {
  constructor(
    @Inject('CH2')
    private readonly clickhouse: ClickHouseClient,
  ) {
    this.clickhouse
      .query('SELECT * FROM [TABLE] LIMIT 1')
      .subscribe((row) => console.log('row', row));
  }
}
```

With custom providers, you can create as many as asynchronously loaded clients with the name you `provide`d.

## Notes

- This repository will be actively maintained and improved.
- Currently only supports JSON format.
  - Planning to support all applicable formats listed [here](https://clickhouse.com/docs/en/interfaces/formats/ 'here').
- Planning to implement TCP protocol, if ClickHouse decides to [documentate](https://clickhouse.com/docs/en/interfaces/tcp/ 'documentate') it.
- Planning to implement inserts with streams.
- This library supports http response compressions such as brotli, gzip and deflate.

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Ali Demirci](https://github.com/depyronick)

## License

[MIT licensed](LICENSE).
