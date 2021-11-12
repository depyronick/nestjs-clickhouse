<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

  <p align="center">A progressive <a href="http://nodejs.org" target="blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore"><img src="https://img.shields.io/npm/dm/@nestjs/core.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#5" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec"><img src="https://img.shields.io/badge/Donate-PayPal-dc3d53.svg"/></a>
  <a href="https://twitter.com/nestframework"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[ClickHouse®](https://graphql.org/) is an open-source, high performance columnar OLAP database management system for real-time analytics using SQL. ClickHouse combined with [TypeScript](https://www.typescriptlang.org/) helps you develop better type safety with your ClickHouse queries, giving you end-to-end typing.

## Installation

Install the following package:

```bash
$ npm i --save @depyronick/nestjs-clickhouse
```

## Quick Start

### Importing the module
Once the installation process is complete, we can import the `ClickHouseModule` into the root `AppModule`.

```typescript
import { Module } from '@nestjs/common';
import { ClickHouseModule } from '@depyronick/nestjs-clickhouse';

@Module({
  imports: [
    ClickHouseModule.register([{
      name: 'ANALYTICS_SERVER',
      host: '127.0.0.1',
      password: '7h3ul71m473p4555w0rd'
    }])
  ],
})
export class AppModule {}
```
The `register()` method will register a ClickHouse client with the specified connection options. See **[ClickHouseOptions](https://github.com/depyronick/nestjs-clickhouse/blob/main/lib/interfaces/ClickHouseModuleOptions.ts "ClickHouseOptions")** object for more information. Each registered client should have an unique `name` definition. The default value for `name` property is `CLICKHOUSE_DEFAULT`. This property will be used as an injection token.

### Interacting with ClickHouse Client

To interact with the ClickHouse server that you have just registered, inject it to your class using the injection token.

```typescript
constructor(
	@Inject('ANALYTICS_SERVER') 
	private analyticsServer: ClickHouseClient
) {}
```
> The `ClickHouseClient` class is imported from the `@depyronick/nestjs-clickhouse`.

There are two methods to interact with the server:

### `ClickHouseClient.query<T>(query: string): Observable<T>`

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
    private readonly analyticsServer: ClickHouseClient
  ) {
    this
      .analyticsServer
      .query<VisitsTable>("SELECT * FROM visits LIMIT 10")
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
        }
      })
  }
}
```

### `ClickHouseClient.insert<T>(table: string, data: T[]): Observable<any>`

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
    private readonly analyticsServer: ClickHouseClient
  ) {
    this
      .analyticsServer
      .insert<VisitsTable>("visits", [{
        timestamp: new Date().getTime(),
        ip: '127.0.0.1',
        os: 'OSX',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/95.0.4638.69 Safari/537.36',
        version: "1.0.0"
      }])
      .subscribe({
        error: (err: any): void => {
          // called when an error occurred during insert
        },
        next: (): void => {
          // currently next does not emits anything for inserts
        },
        complete: (): void => {
          // called when insert is completed
        }
      })
  }
}
```

## Multiple Clients
You can register multiple clients in the same application as follows:

```typescript
@Module({
  imports: [
    ClickHouseModule.register([{
      name: 'ANALYTICS_SERVER',
      host: '127.0.0.1',
      password: '7h3ul71m473p4555w0rd'
    }, {
      name: 'CHAT_SERVER',
      host: '192.168.1.110',
      password: 'ch5ts3rv3Rp455w0rd'
    }])
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
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

## Notes
- This repository will be actively maintained and improved.
- Currently only supports JSON format. 
	- Planning to support all applicable formats listed [here](https://clickhouse.com/docs/en/interfaces/formats/ "here").
- Planning to implement TCP protocol, if ClickHouse decides to [documentate](https://clickhouse.com/docs/en/interfaces/tcp/ "documentate") it.
- Planning to implement inserts with streams.
- This library supports http response compressions such as brotli, gzip and deflate.

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Ali Demirci](https://github.com/depyronick)

## License

[MIT licensed](LICENSE).
