const { Client } = require("@elastic/elasticsearch");
require('dotenv').config();

const client = new Client({
  node: process.env.ELASTICSEARCH_NODE || "http://localhost:9200",
});

const bulkInsert = async (data) => {
  console.log("bulk insert: ", data);

  try {
    const indexExists = await client.indices.exists({ index: "videos" });
    if (!indexExists.body) {
      await client.indices.create({
        index: "videos",
        body: {
          mappings: {
            properties: {
              id: { type: "keyword" },
              publishedAt: { type: "date" },
              title: { type: "text" },
              description: { type: "text" },
              thumbnail: { type: "keyword" },
            },
          },
        },
      });
    }

    if (!data.items || data.items.length === 0) return;

    const info = data.items
      .map((el) => {
        if (el.kind === "youtube#video") {
          return {
            id: el.id,
            publishedAt: el.snippet.publishedAt,
            title: el.snippet.title,
            description: el.snippet.description,
            thumbnail: el.snippet.thumbnails.default.url,
          };
        }
      })
      .filter((doc) => doc);

    const body = info.flatMap((doc) => [{ index: { _index: "videos" } }, doc]);
    const res = await client.bulk({ refresh: true, body });

    if (res.body.errors) {
      const erroredDocuments = [];
      res.body.items.forEach((action, i) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          erroredDocuments.push({
            status: action[operation].status,
            error: action[operation].error,
            operation: body[i * 2],
            document: body[i * 2 + 1],
          });
        }
      });
      console.error("Errored Documents:", erroredDocuments);
    }

    const count = await client.count({ index: "videos" });
    console.log("Insert Count: ", count.body.count);
  } catch (error) {
    console.error("Error in bulkInsert:", error);
  }
};

const search = async (query, pageNumber = 1, pageSize = 10) => {
  try {
    const response = await client.search({
      index: "videos",
      from: (pageNumber - 1) * pageSize,
      size: pageSize,
      sort: "publishedAt:desc",
      body: {
        query: {
          multi_match: {
            query: query,
            fields: ["title", "description"],
            type: "best_fields",
          },
        },
      },
    });
    return {
      hits: response.body.hits.hits,
      total: response.body.hits.total.value,
    };
  } catch (error) {
    console.error("Error in search:", error);
    return { hits: [], total: 0 };
  }
};

const getPage = async (pageNumber = 1, pageSize = 10) => {
  try {
    const response = await client.search({
      index: "videos",
      from: (pageNumber - 1) * pageSize,
      size: pageSize,
      body: {
        query: {
          match_all: {},
        },
      },
    });
    return {
      hits: response.body.hits.hits,
      total: response.body.hits.total.value,
    };
  } catch (error) {
    console.error("Error in getPage:", error);
    return { hits: [], total: 0 };
  }
};

module.exports = {
  bulkInsert,
  search,
  getPage,
};
