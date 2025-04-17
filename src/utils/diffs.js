const _ = require('lodash');

const diffObjects = (oldObj, newObj, fields) => {
    if (
        !Array.isArray(fields) ||
        fields.length === 0 ||
        !_.isObject(oldObj) ||
        !_.isObject(newObj)
    ) {
        return {};
    }

    const changes = {};
    for (const field of fields) {
        if (_.has(oldObj, field) || _.has(newObj, field)) {
            if (!_.isEqual(oldObj[field], newObj[field])) {
                changes[field] = {
                    from: oldObj[field],
                    to: newObj[field],
                };
            }
        }
    }
    return changes;
};

module.exports = { diffObjects };
