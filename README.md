# Blink [![wercker status](https://app.wercker.com/status/8b53bf996a3fb29015bf656b95aa1866/s/master "wercker status")](https://app.wercker.com/project/byKey/8b53bf996a3fb29015bf656b95aa1866) [![codecov](https://codecov.io/gh/DoSomething/blink/branch/master/graph/badge.svg)](https://codecov.io/gh/DoSomething/blink) [![dependencies Status](https://david-dm.org/DoSomething/blink/status.svg)](https://david-dm.org/DoSomething/blink) [![devDependencies Status](https://david-dm.org/DoSomething/blink/dev-status.svg)](https://david-dm.org/DoSomething/blink?type=dev)

:postbox: The DoSomething.org Message Bus.

## Development

#### Requirements
- [Node.js](https://nodejs.org/en/download/) v7.6+ for async/await support
- [Docker](https://www.docker.com/products/overview) with support
  of Compose file [v3](https://docs.docker.com/compose/compose-file/#/versioning)
- [Yarn](https://yarnpkg.com/en/)

#### Installation
Install dependencies `yarn install`

## Usage
- Launch RabbitMQ `docker-compose up`
- `yarn web`
- Open `http://localhost:5050`  
  Username: `blink`, password: `blink`.

#### Available services
- `localhost:5672`: RabbitMQ AMQP
- [`localhost:15672`](http://localhost:15672): RabbitMQ management.  
  Username: `blink`, password: `blink`.

## API Endpoints
### Core
| Endpoint                    | Description                 |
| --------------------------- | --------------------------- |
| `GET /`                     | Greetings                   |
| `GET /api`                  | List available API versions |
| `GET /api/v1`               | List V1 endpoints           |

### V1 Endpoints
[Routes](https://github.com/DoSomething/blink/wiki/Routes)

## Tests

You can run all tests and checks at once:

```
$ yarn test:full
```

Or execute them individually:

#### Code style

```
$ yarn lint
```

We follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript),
with minor [DoSomething](https://github.com/DoSomething/eslint-config) adjustments.

#### BDD Tests

##### Unit tests
```
$ yarn test
```

##### Integration tests
```
$ yarn test:integration
```

##### Lint, Unit, Coverage, and Integration
```
$ yarn test:full
```

BDD test uses the following utilities:
- [AVA](https://github.com/avajs/ava)
- [Chai](http://chaijs.com/), BDD/should flavor
- [Supertest](https://github.com/visionmedia/supertest)

> When running integration/full tests locally. Run `docker-compose down && docker-compose up -d` between
runs to prevent collision with messages stored in the RabbitMQ Docker image.

#### Code coverage

```
$ yarn unit:coverage && yarn coverage:report:html
```

- [NYC](https://github.com/istanbul/nyc)
- [Codecov](https://codecov.io/)
