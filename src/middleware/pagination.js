const pagination = (req, res, next) => {
  // Default values
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  // Calculate skip value
  const skip = (page - 1) * limit;

  // Add pagination parameters to request object
  req.pagination = {
    page,
    limit,
    skip,
    sort: {
      [sortBy]: sortOrder
    }
  };

  next();
};

module.exports = pagination; 