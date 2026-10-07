const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

const getPagination = (query) => {
  const requestedPage = parseInt(query.page);
  const requestedLimit = parseInt(query.limit);

  return {
    page: requestedPage > 0 ? requestedPage : 1,
    limit:
      requestedLimit > 0 ? Math.min(requestedLimit, MAX_LIMIT) : DEFAULT_LIMIT,
  };
};

module.exports = getPagination;
