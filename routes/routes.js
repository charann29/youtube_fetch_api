const router = require("express").Router();
const fetchFromYt = require("../controller/fetchFromYt");
const elasticHelper = require("../utils/elasticHelper");
const { search, getPage, bulkInsert } = elasticHelper;

// Health Check Endpoint
router.get("/", (req, res) => {
  res.send("API is working");
});

let currTime = "2022-07-12T02:00:00Z";

// Endpoint to Fetch from YouTube and Insert into ElasticSearch
router.get("/addInfo", async (req, res) => {
  try {
    const [data, err] = await fetchFromYt(currTime);
    if (err) {
      return res.status(500).send(err.message);
    }
    await bulkInsert(data); // Ensure bulkInsert is handled properly
    res.send(data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Get All Information from ElasticSearch
router.get("/getAllInformationFromElastic", async (req, res) => {
  try {
    const data = await getPage(1, 10);
    res.send(data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Query ElasticSearch
router.get("/query", async (req, res) => {
  const { query, pageNumber = 1, pageSize = 10 } = req.query;
  try {
    const { hits, total } = await search(query, pageNumber, pageSize);
    res.send({ hits, total });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// GUI Pagination Endpoint
router.get("/page", async (req, res) => {
  const { pageNumber = 1, pageSize = 10 } = req.query;
  try {
    const result = await getPage(pageNumber, pageSize);
    res.send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
