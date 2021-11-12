import { Logger } from '@nestjs/common';

import axios, { AxiosRequestConfig, AxiosRequestHeaders } from 'axios';

import { IncomingMessage } from 'http';

import * as Pick from 'stream-json/filters/Pick';
import * as StreamArray from 'stream-json/streamers/StreamArray';

import * as zlib from 'zlib';

import { Parser } from 'stream-json';
import { Observable } from 'rxjs';

import { ClickHouseConnectionProtocol, ClickHouseCompressionMethod, ClickHouseDataFormat } from '../enums';
import { ClickHouseModuleOptions } from '../interfaces/ClickHouseModuleOptions';

export class ClickHouseClient {
    /**
     * NestJS Logger
     */
    private logger = new Logger('ClickHouseModule');

    /**
    * ClickHouse Service
    */
    constructor(
        private options: ClickHouseModuleOptions
    ) { }

    /**
     * Prepare request options
     */
    private _getRequestOptions(query: string, withoutFormat: boolean = false): AxiosRequestConfig<any> {
        let url = '';
        switch (this.options.protocol) {
            case ClickHouseConnectionProtocol.HTTP:
                url = `http://${this.options.host}:${this.options.port}`;
                break;
            case ClickHouseConnectionProtocol.HTTPS:
                url = `https://${this.options.host}:${this.options.port}`;
                break;
        }

        if (!withoutFormat) {
            query = `${query.trimEnd()} FORMAT ${this.options.format}`;
        }

        const params = {
            query,
            database: this.options.database
        };

        if (this.options.compression != ClickHouseCompressionMethod.NONE) {
            params['enable_http_compression'] = 1;
        }

        const requestOptions: AxiosRequestConfig = {
            url,
            params,
            responseType: 'stream',
            auth: {
                username: this.options.username,
                password: this.options.password
            },
            transformResponse: (data: IncomingMessage) => {
                if (this.options.compression == ClickHouseCompressionMethod.BROTLI) {
                    return data.pipe(zlib.createBrotliDecompress());
                } else {
                    return data;
                }
            },
            headers: this._getHeaders()
        }

        return requestOptions;
    }

    /**
     * Prepare headers for request
     */
    private _getHeaders(): AxiosRequestHeaders {
        const headers = {};

        switch (this.options.compression) {
            case ClickHouseCompressionMethod.GZIP:
                headers['Accept-Encoding'] = 'gzip';
                break;
            case ClickHouseCompressionMethod.DEFLATE:
                headers['Accept-Encoding'] = 'deflate';
                break;
            case ClickHouseCompressionMethod.BROTLI:
                headers['Accept-Encoding'] = 'br';
        }

        return headers;
    }

    /**
     * Create a Readable Query Stream
     */
    public query<T = any>(query: string) {
        return new Observable<T>(subscriber => {
            axios
                .request(
                    this._getRequestOptions(query)
                )
                .then((response) => {
                    const stream: IncomingMessage = response.data;

                    if (this.options.format == ClickHouseDataFormat.JSON) {
                        const pipeline = stream
                            .pipe(new Parser())
                            .pipe(new Pick({
                                filter: 'data'
                            }))
                            .pipe(new StreamArray())

                        pipeline
                            .on('data', (row) => {
                                subscriber.next(row.value as T);
                            })
                            .on('end', () => {
                                subscriber.complete()
                            })
                    } else {
                        throw new Error("Unsupported data format. Only JSON is supported for now.")
                    }
                })
                .catch((reason) => {
                    if (reason && reason.response) {
                        let err: string = '';

                        reason
                            .response
                            .data
                            .on('data', chunk => {
                                err += chunk.toString('utf8')
                            })
                            .on('end', () => {
                                this.logger.error(err.trim());
                                subscriber.error(err.trim());

                                err = '';
                            });
                    } else {
                        subscriber.error(reason.code);
                        this.logger.error(reason.code);
                    }
                })
        })
    }

    /**
     * Insert data to table
     */
    public insert<T = any>(table: string, data: T[]) {
        return new Observable<any>(subscriber => {
            let query = `INSERT INTO ${table}`;
            let _data: any;

            switch (this.options.format) {
                case ClickHouseDataFormat.JSON:
                    query += ` FORMAT JSONEachRow`;
                    _data = data.map(d => JSON.stringify(d)).join('\n');
                    break;
            }

            axios
                .request(
                    Object.assign(
                        this._getRequestOptions(query, true),
                        <AxiosRequestConfig>{
                            responseType: 'stream',
                            method: 'POST',
                            data: _data
                        }
                    )
                )
                .then((response) => {
                    const stream: IncomingMessage = response.data;

                    stream
                        .on('data', (data) => {
                            subscriber.next(data);
                        })
                        .on('end', () => {
                            subscriber.complete();
                        });
                })
                .catch(reason => {
                    subscriber.error(reason);
                    this.logger.error(reason);
                })
        });
    }
}