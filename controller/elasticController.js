const { search } = require("../utils/elasticHelper");

const searchVideos = async (req, res) => {
  // Using query parameters instead of req properties for standard practice
  const searchQuery = req.query.q;
  const pageNumber = parseInt(req.query.p, 10) || 1; // Default to 1 if not provided
  const pageSize = parseInt(req.query.s, 10) || 10; // Default to 10 if not provided

  try {
    const { hits, total } = await search(searchQuery, pageNumber, pageSize);

    const data = hits.map((doc) => doc._source);
    const hasNext = pageNumber * pageSize < total;

    res.status(200).json({
      success: true,
      pageNumber,
      pageSize,
      hasNext,
      total,
      data
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

module.exports = searchVideos;
