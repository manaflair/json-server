# [![Json-Server](/logo.png?raw=true)](https://github.com/manaflair/json-server)

> JSON-API compatible Express+Sequelize framework

[![](https://img.shields.io/npm/v/@manaflair/json-server.svg)]() [![](https://img.shields.io/npm/l/@manaflair/json-server.svg)]()

[Check out our other OSS projects!](https://manaflair.github.io)

## Installation

**Json-Server is not yet ready to be used in a production environment - some security checks are still missing, and you wouldn't be able to prevent your users from altering your data in some unexpected ways.**

```
$> npm install --save @manaflair/json-server
```

## Usage

```js
import { makeSequelizeBackend } from '@manaflair/json-server/sequelize';
import { JsonServer }           from '@manaflair/json-server';
import express                  from 'express';

import { User, Post, Comment }  from './models';

let server = express();

let jsonServer = new JsonServer({ baseUrl: `http://example.org/api` });
server.use(jsonServer.middleware);

jsonServer.add(makeSequelizeBackend(User));
jsonServer.add(makeSequelizeBackend(Post));
jsonServer.add(makeSequelizeBackend(Comment));

server.listen(80);
```

## License (MIT)

> **Copyright © 2016 Manaflair**
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
