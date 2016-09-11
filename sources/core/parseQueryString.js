import { isUndefined } from 'lodash';

export function parseQueryString(query) {

    let options = { filter: new Map(), include: new Map() };

    for (let [ path, value ] of Object.entries(query)) {

        let pathParts = path.split(/\./g);

        switch (pathParts.shift()) {

            case `filter`: {

            } break;

            case `include`: {

                for (let selector of value.split(/,/g)) {

                    let target = options.include;
                    let selectorParts = pathParts.concat(selector.split(/\./g));

                    for (let relationshipName of selectorParts) {

                        let previousTarget = target;
                        target = target.get(relationshipName);

                        if (isUndefined(target)) {
                            target = new Map();
                            previousTarget.set(relationshipName, target);
                        }

                    }

                }

            } break;

        }

    }

    return options;

}
