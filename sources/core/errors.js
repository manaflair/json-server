export class ServerError {

}

export class NotFound extends ServerError {

    constructor({ title, details } = {}) {

        super();

        this.status = `404`;
        this.code = `Not Found`;

        this.title = title;
        this.details = details;

    }

}

export class BadRequest extends ServerError {

    constructor({ title, details } = {}) {

        super();

        this.status = `400`;
        this.code = `Bad Request`;

        this.title = title;
        this.details = details;

    }

}
