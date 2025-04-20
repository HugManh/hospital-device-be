const fs = require('fs');
const path = require('path');
const modelsDir = path.join(__dirname, '..', 'models');

const buildModelFieldLabelMap = () => {
    const modelFieldLabelMap = new Map();

    const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.js'));

    for (const file of files) {
        const filePath = path.join(modelsDir, file);
        const modelModule = require(filePath);

        for (const key in modelModule) {
            const model = modelModule[key];
            if (model?.modelName && typeof model.eachPath === 'function') {
                const modelName = model.modelName;
                const fieldMap = new Map();

                model.eachPath((field, schemaType) => {
                    const label = schemaType.options?.label;
                    if (label) {
                        fieldMap.set(field, label);
                    }
                });

                modelFieldLabelMap.set(modelName, fieldMap);
            }
        }
    }

    return modelFieldLabelMap;
};

const modelFieldLabelMap = buildModelFieldLabelMap();

// Truy cập label với tên model và field
const label = (modelName, field) => {
    const fields = modelFieldLabelMap.get(modelName);
    return fields?.get(field) || field;
};

module.exports = {
    label,
    modelFieldLabelMap,
};
