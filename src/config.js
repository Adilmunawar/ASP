require('dotenv').config();

module.exports = {
  // Default bot settings
  defaultSettings: {
    targetUrl: process.env.TARGET_URL || 'https://example.com',
    concurrency: parseInt(process.env.CONCURRENCY, 10) || 5,
    interval: parseInt(process.env.INTERVAL, 10) || 2000,
    countries: (process.env.COUNTRIES || 'US,UK,CA,AU').split(','),
    useProxy: process.env.USE_PROXY !== 'false',
    proxyRefreshInterval: parseInt(process.env.PROXY_REFRESH_INTERVAL, 10) || 3600000, // 1 hour
    maxRetries: parseInt(process.env.MAX_RETRIES, 10) || 3,
    timeout: parseInt(process.env.TIMEOUT, 10) || 30000 // 30 seconds
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: {
      error: 'error.log',
      combined: 'combined.log'
    }
  },

  // HTTP request headers and patterns
  requestPatterns: {
    headers: {
      common: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    },
    referrers: [
      'https://www.google.com/search?q=',
      'https://www.bing.com/search?q=',
      'https://www.facebook.com/',
      'https://twitter.com/search?q=',
      'https://www.linkedin.com/search/results/all/?keywords=',
      'https://www.reddit.com/search/?q=',
      'https://github.com/search?q='
    ],
    searchTerms: [
      'best online services',
      'social media automation',
      'traffic generation',
      'website analytics',
      'social media growth',
      'digital marketing tools',
      'online presence optimization',
      'web traffic solutions'
    ]
  },

  // Proxy configuration
  proxy: {
    providers: {
      proxyscrape: {
        url: 'https://api.proxyscrape.com/v2/',
        params: {
          request: 'getproxies',
          protocol: 'http',
          timeout: 10000,
          country: 'all',
          ssl: 'all',
          anonymity: 'all'
        }
      }
    },
    testUrls: [
      'https://www.google.com',
      'https://www.amazon.com',
      'https://www.wikipedia.org'
    ]
  }
};