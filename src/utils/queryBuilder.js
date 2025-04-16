const EXCLUDED_QUERY_FIELDS = [
    'page',
    'sort',
    'limit',
    'fields',
    'sortBy',
    'sortOrder',
    'populate',
];

class QueryBuilder {
    constructor(model, queryParams) {
        this.model = model;
        this.queryParams = queryParams;
        this.query = model.find();
        this._pagination = {};
    }

    // Filtering
    filter() {
        const queryObj = { ...this.queryParams };
        EXCLUDED_QUERY_FIELDS.forEach((el) => delete queryObj[el]);

        if (Object.keys(queryObj).length > 0) {
            const queryStr = JSON.stringify(queryObj).replace(
                /\b(gte|gt|lte|lt|in|ne|eq|nin|regex)\b/g,
                (match) => `$${match}`
            );
            const parsedQuery = JSON.parse(queryStr, (key, value) => {
                if (!isNaN(value)) return Number(value); // number
                if (
                    typeof value === 'string' &&
                    value.startsWith('/') &&
                    value.endsWith('/')
                ) {
                    return new RegExp(value.slice(1, -1)); // regex
                }
                return value;
            });
            this.query = this.query.find(parsedQuery);
        }
        return this;
    }

    // Sorting
    sort() {
        const sortParam = this.queryParams.sort;
        if (!sortParam) {
            this.query = this.query.sort({ createdAt: -1 });
            return this;
        }

        const sortFields = sortParam.split(',').reduce((acc, field) => {
            const [key, order] = field.trim().split(':');
            if (key && ['asc', 'desc'].includes(order)) {
                acc[key] = order === 'asc' ? 1 : -1;
            }
            return acc;
        }, {});

        if (Object.keys(sortFields).length === 0) {
            throw new Error(
                'Invalid sort format. Use field:order (e.g., price:desc)'
            );
        }

        this.query = this.query.sort(sortFields);
        return this;
    }

    select(fields) {
        if (fields) {
            this.query = this.query.select(fields);
        }
        return this;
    }

    populate(fields) {
        if (fields) {
            if (Array.isArray(fields)) {
                fields.forEach((field) => {
                    this.query = this.query.populate({
                        ...field,
                        options: { strictPopulate: false },
                    });
                });
            } else {
                this.query = this.query.populate({
                    ...fields,
                    options: { strictPopulate: false },
                });
            }
        }
        return this;
    }

    // Pagination
    paginate() {
        const maxLimit = 100;
        const pageNum = Number.parseInt(this.queryParams.page) || 1;
        const limitNum = Math.min(
            Number.parseInt(this.queryParams.limit) || 10,
            maxLimit
        );

        if (pageNum < 1 || limitNum < 1) {
            throw new Error('Page and limit must be positive numbers');
        }

        const skip = (pageNum - 1) * limitNum;
        this.query = this.query.skip(skip).limit(limitNum);
        this._pagination = { pageNum, limitNum };
        return this;
    }

    // Execute query and return results with pagination metadata
    async exec({ useEstimatedCount = false, baseUrl = '' } = {}) {
        try {
            const [data, totalCount] = await Promise.all([
                this.query,
                useEstimatedCount
                    ? this.model.estimatedDocumentCount()
                    : this.model.countDocuments(this.query.getFilter()),
            ]);

            const { pageNum = 1, limitNum = 10 } = this._pagination || {};
            const totalPages = Math.ceil(totalCount / limitNum);

            if (pageNum > totalPages && totalCount > 0) {
                throw new Error(
                    `Page ${pageNum} does not exist. Maximum page is ${totalPages}`
                );
            }

            // Tính toán previous và next
            const pagination = {
                currentPage: pageNum,
                totalPages,
                totalItems: totalCount,
                limit: limitNum,
            };

            // Thêm previous nếu không phải trang đầu
            if (pageNum > 1) {
                pagination.previous = {
                    page: pageNum - 1,
                    limit: limitNum,
                };
            }

            // Thêm next nếu không phải trang cuối
            if (pageNum < totalPages) {
                pagination.next = {
                    page: pageNum + 1,
                    limit: limitNum,
                };
            }

            // Nếu có baseUrl, tạo URL đầy đủ (HATEOAS)
            if (baseUrl) {
                if (pagination.previous) {
                    const queryString = new URLSearchParams({
                        ...this.queryParams,
                        page: pageNum - 1,
                        limit: limitNum,
                    }).toString();
                    pagination.previous.url = `${baseUrl}?${queryString}`;
                }

                if (pagination.next) {
                    const nextQueryString = new URLSearchParams({
                        ...this.queryParams,
                        page: pageNum + 1,
                        limit: limitNum,
                    }).toString();
                    pagination.next.url = `${baseUrl}?${nextQueryString}`;
                }
            }

            const filtersApplied = this.query.getFilter();
            const sortApplied = Object.entries(
                this._sortApplied || { createdAt: -1 }
            ).reduce((acc, [key, value]) => {
                acc[key] = value === 1 ? 'asc' : 'desc';
                return acc;
            }, {});

            return {
                data,
                meta: {
                    pagination,
                    filtersApplied,
                    sortApplied,
                },
            };
        } catch (error) {
            throw new Error(`Query execution failed: ${error.message}`);
        }
    }
}

module.exports = QueryBuilder;
