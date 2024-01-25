require("dotenv").config();
const axiosHelper = require("../utils/axiosHelper");

class YouTubeFetcher {
  constructor() {
    this.apiKeys = process.env.YT_KEY.split(",");
    this.currentApiKeyIndex = 0;
    this.apiUrl = "https://www.googleapis.com/youtube/v3/videos";
    this.defaultParams = {
      part: 'snippet',
      chart: 'mostPopular',
      maxResults: 50,
      regionCode: 'US',
      order: 'date',  // Sorting by date for latest videos
    };
  }

  // Getter for current API key, cycles through the keys
  get apiKey() {
    return this.apiKeys[this.currentApiKeyIndex % this.apiKeys.length];
  }

  // Method to fetch the latest videos
  async fetchLatestVideos(publishedAfter) {
    try {
      const response = await axiosHelper.get(this.apiUrl, {
        params: { ...this.defaultParams, key: this.apiKey, publishedAfter }
      });
      return [response.data, null];
    } catch (error) {
      this.currentApiKeyIndex++;
      // Recursive call to try the next API key if one fails
      if (this.currentApiKeyIndex < this.apiKeys.length) {
        return this.fetchLatestVideos(publishedAfter);
      } else {
        // Log error when all API keys are exhausted or other error occurs
        console.error('All API keys exhausted or other error:', error);
        return [null, error];
      }
    }
  }
}

module.exports = YouTubeFetcher;
