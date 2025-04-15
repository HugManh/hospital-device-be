const fs = require('fs-extra');
const path = require('path');
const specs = require('../docs/swagger');  // Swagger object (JSON hoặc JS)

// Tạo file openapi.json
async function generateOpenApiJson() {
    try {
        const outputPath = path.join(__dirname, '../../openapi.json');
        await fs.writeFile(outputPath, JSON.stringify(specs, null, 2));
        console.log('✅ Docs generated: openapi.json');
    } catch (error) {
        console.error('❌ Failed to generate openapi.json:', error);
    }
}

// Hàm xử lý headers mặc định
function getDefaultHeaders() {
    return {
        'Accept': 'application/json',
    };
}

// Hàm tạo request body nếu có
function getRequestBody(requestBody) {
    if (requestBody && requestBody.content?.['application/json']?.example) {
        return JSON.stringify(requestBody.content['application/json'].example, null, 2);
    }
    return null;
}

// Hàm tạo query params từ Swagger specification
function getQueryParams(parameters) {
    return parameters
        .filter(param => param.in === 'query')
        .map(param => `${param.name}=<value>`)
        .join('\n');
}

// Hàm tạo HTTP request từ từng endpoint
function generateHttpRequest(route, methods) {
    const baseUrl = specs.servers?.[0]?.url || 'http://localhost:3000';
    let output = '';

    for (const [method, detail] of Object.entries(methods)) {
        const fullPath = route.replace(/{(\w+)}/g, '{{$1}}'); // Biến tham số như {id} → {{id}}

        output += `### ${detail.summary || `${method.toUpperCase()} ${route}`}\n`;
        output += `${method.toUpperCase()} ${baseUrl}${fullPath}\n`;

        // Thêm headers mặc định
        const headers = getDefaultHeaders();
        for (const [key, value] of Object.entries(headers)) {
            output += `${key}: ${value}\n`;
        }

        // Thêm request body nếu có (chỉ cho POST, PUT, PATCH)
        const body = getRequestBody(detail?.requestBody);
        if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            output += `Content-Type: application/json\n\n${body}\n`;
        }

        // Thêm query parameters nếu có
        if (detail.parameters) {
            const queryParams = getQueryParams(detail.parameters);
            if (queryParams) {
                output += `${queryParams}\n`;
            }
        }

        output += '\n\n';
    }

    return output;
}

// Hàm tạo tất cả HTTP requests
function generateHttpRequests() {
    let output = '';

    for (const [route, methods] of Object.entries(specs.paths)) {
        output += generateHttpRequest(route, methods);
    }

    return output;
}

// Tạo file requests.http
async function generateHttpRequestsFile() {
    try {
        const httpRequests = generateHttpRequests();
        const outputPath = path.join(__dirname, '../../requests.http');
        await fs.writeFile(outputPath, httpRequests);
        console.log('✅ HTTP requests generated: requests.http');
    } catch (error) {
        console.error('❌ Failed to generate requests.http:', error);
    }
}

// Main function to generate both files
async function generateDocs() {
    await generateOpenApiJson();
    await generateHttpRequestsFile();
}

generateDocs();
