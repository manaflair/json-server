import httpStatus      from 'http-status';
import { isUndefined } from 'lodash';

import { ServerError } from './errors';

export function catchApiErrors(callback) {

    return (req, res) => {

        Promise.resolve().then(() => {

            return callback(req, res);

        }).catch(error => {

            let status = `500`;
            let code = `Internal Server Error`;

            let title = undefined;
            let details = undefined;

            if (error instanceof ServerError) {

                if (!isUndefined(error.status))
                    status = error.status;

                if (!isUndefined(error.code))
                    code = error.code;

                if (!isUndefined(error.title))
                    title = error.title;

                if (!isUndefined(error.details)) {
                    details = error.details;
                }

            } else if (error instanceof Error) {

                title = error.message;
                details = error.stack;

            }

            res.status(status, code).json({ errors: [ {

                status, code,
                title, details

            } ] });

        });

    };

}
