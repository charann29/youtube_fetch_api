require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const fetchRoutes = require("./routes/routes");
const fetchInfo = require("./controller/fetchFromYt");
const { bulkInsert } = require("./utils/elasticHelper");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

let lastFetchTime = process.env.INITIAL_FETCH_TIME || "2022-07-12T02:00:00Z";

// Node Cron Configuration
cron.schedule("*/10 * * * * *", async () => {
  console.log(`Fetching YouTube data: Attempt ${++occ}`);
  try {
    const [data, error] = await fetchInfo(lastFetchTime);
    if (error) {
      console.error("Error fetching data:", error);
      return;
    }
    if (data && data.items.length > 0) {
      await bulkInsert(data);
      lastFetchTime = data.items[0].snippet.publishedAt;
    }
  } catch (err) {
    console.error("Error during cron job:", err);
  }
});

app.use("/api", fetchRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Additional Error Handling
app.use((req, res, next) => {
  res.status(404).send("Sorry, can't find that!");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

