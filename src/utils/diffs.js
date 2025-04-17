const diffObjects = (oldObj, newObj, fields) => {
    const changes = {};
    for (const field of fields) {
        if (oldObj[field] !== newObj[field]) {
            changes[field] = {
                from: oldObj[field],
                to: newObj[field],
            };
        }
    }
    return changes;
};

module.exports = { diffObjects };
