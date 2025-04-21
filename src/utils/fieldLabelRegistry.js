const fs = require('fs');
const path = require('path');

// Đường dẫn tới file labels.json
const labelsPath = path.join(__dirname, '..', 'config', 'labels.json');

// Đọc file JSON
const labels = JSON.parse(fs.readFileSync(labelsPath, 'utf8'));

const getLabel = (modelName, field, locale = 'vi') => {
    const modelLabels = labels[modelName];
    if (!modelLabels) return field; // Trả về field nếu không tìm thấy model

    const fieldLabels = modelLabels[field];
    if (!fieldLabels) return field; // Trả về field nếu không tìm thấy field

    return fieldLabels[locale] || fieldLabels['vi'] || field; // Ưu tiên locale, mặc định vi
};

// Hàm để lấy tất cả labels (hữu ích cho API hoặc frontend)
const getLabels = (modelName = null, locale = 'vi') => {
    if (modelName) {
        const modelLabels = labels[modelName];
        if (!modelLabels) return {};

        return Object.entries(modelLabels).reduce(
            (acc, [field, fieldLabels]) => {
                acc[field] = fieldLabels[locale] || fieldLabels['vi'] || field;
                return acc;
            },
            {}
        );
    }

    return Object.entries(labels).reduce((acc, [model, modelLabels]) => {
        acc[model] = Object.entries(modelLabels).reduce(
            (modelAcc, [field, fieldLabels]) => {
                modelAcc[field] =
                    fieldLabels[locale] || fieldLabels['vi'] || field;
                return modelAcc;
            },
            {}
        );
        return acc;
    }, {});
};

module.exports = { getLabel, getLabels };
