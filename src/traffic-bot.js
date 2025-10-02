const fetch = require('wonderful-fetch');
const UserAgent = require('user-agents');
const winston = require('winston');
const ProxyChain = require('proxy-chain');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class TrafficBot {
  constructor(config = {}) {
    this.config = {
      targetUrl: config.targetUrl || '',
      concurrency: config.concurrency || 5,
      interval: config.interval || 1000,
      countries: config.countries || ['US', 'UK', 'CA'],
      useProxy: config.useProxy || true,
      proxyRefreshInterval: config.proxyRefreshInterval || 3600000, // 1 hour
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 30000 // 30 seconds
    };
    this.proxyList = [];
    this.proxyServer = null;
    this.visitCount = 0;
    this.failedVisits = 0;
  }

  async init() {
    try {
      if (this.config.useProxy) {
        await this.refreshProxies();
        // Set up periodic proxy refresh
        setInterval(() => this.refreshProxies(), this.config.proxyRefreshInterval);
      }
      logger.info('TrafficBot initialized successfully', { config: this.config });
    } catch (error) {
      logger.error('Failed to initialize TrafficBot', { error: error.message });
      throw error;
    }
  }

  async refreshProxies() {
    try {
      const response = await fetch('https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all');
      const proxyList = await response.text();
      this.proxyList = proxyList.split('\n')
        .filter(proxy => proxy.trim())
        .map(proxy => proxy.trim());
      
      logger.info('Successfully refreshed proxy list', { 
        proxyCount: this.proxyList.length 
      });
    } catch (error) {
      logger.error('Failed to fetch proxies', { error: error.message });
      // If proxy fetch fails, keep using existing proxies
      if (this.proxyList.length === 0) {
        throw new Error('No proxies available');
      }
    }
  }

  async createProxyServer(proxy) {
    if (this.proxyServer) {
      await ProxyChain.closeAnonymizedProxy(this.proxyServer, true);
    }
    this.proxyServer = await ProxyChain.anonymizeProxy(`http://${proxy}`);
    return this.proxyServer;
  }

  getRandomProxy() {
    if (this.proxyList.length === 0) {
      throw new Error('No proxies available');
    }
    return this.proxyList[Math.floor(Math.random() * this.proxyList.length)];
  }

  async generateVisit(retryCount = 0) {
    const userAgent = new UserAgent();
    const startTime = Date.now();
    
    try {
      const proxy = this.getRandomProxy();
      const proxyUrl = await this.createProxyServer(proxy);
      
      const options = {
        headers: {
          'User-Agent': userAgent.toString(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': this.getRandomReferer(),
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        proxy: proxyUrl,
        timeout: this.config.timeout
      };

      const response = await fetch(this.config.targetUrl, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.visitCount++;
      const duration = Date.now() - startTime;
      
      logger.info('Visit generated successfully', {
        visitCount: this.visitCount,
        duration,
        status: response.status,
        proxy
      });
    } catch (error) {
      this.failedVisits++;
      logger.error('Visit failed', {
        error: error.message,
        retryCount,
        proxy: this.proxyServer
      });

      if (retryCount < this.config.maxRetries) {
        logger.info('Retrying visit', { retryCount: retryCount + 1 });
        return this.generateVisit(retryCount + 1);
      }
    }
  }

  getRandomReferer() {
    const referrers = [
      'https://www.google.com/search?q=',
      'https://www.bing.com/search?q=',
      'https://www.facebook.com/',
      'https://twitter.com/search?q=',
      'https://www.linkedin.com/search/results/all/?keywords=',
      'https://www.reddit.com/search/?q=',
      'https://github.com/search?q='
    ];
    
    const searchTerms = [
      'best online services',
      'social media automation',
      'traffic generation',
      'website analytics',
      'social media growth'
    ];

    const referrer = referrers[Math.floor(Math.random() * referrers.length)];
    const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    
    return `${referrer}${encodeURIComponent(searchTerm)}`;
  }

  async start() {
    try {
      await this.init();
      
      logger.info('Starting traffic generation', {
        targetUrl: this.config.targetUrl,
        concurrency: this.config.concurrency
      });

      for (let i = 0; i < this.config.concurrency; i++) {
        setInterval(() => this.generateVisit(), this.config.interval);
      }
    } catch (error) {
      logger.error('Failed to start traffic generation', { error: error.message });
      throw error;
    }
  }

  getStats() {
    return {
      totalVisits: this.visitCount,
      failedVisits: this.failedVisits,
      successRate: ((this.visitCount - this.failedVisits) / this.visitCount * 100).toFixed(2) + '%',
      activeProxies: this.proxyList.length
    };
  }

  async cleanup() {
    if (this.proxyServer) {
      await ProxyChain.closeAnonymizedProxy(this.proxyServer, true);
    }
    logger.info('TrafficBot cleanup completed');
  }
}

module.exports = TrafficBot;