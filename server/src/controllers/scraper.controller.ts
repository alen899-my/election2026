import { Request, Response } from 'express';
import { KeralaElectionScraper } from '../services/scraper.service';

export const runScrapingJob = async (req: Request, res: Response) => {
  try {
    const {
      targetUrl  = 'https://en.wikipedia.org/wiki/2026_Kerala_Legislative_Assembly_election',
      mode       = 'all',
      enrichWiki = true,
      wikiLimit  = 30,
      delayMs    = 1500,
    } = req.body;

    let data: any;

    switch (mode) {
      case 'parties':
        data = await KeralaElectionScraper.scrapeAndSeedParties(targetUrl);
        break;
      case 'constituencies':
        data = await KeralaElectionScraper.scrapeAndSeedConstituencies(targetUrl);
        break;
      case 'wiki_enrich':
        data = await KeralaElectionScraper.enrichCandidatesFromWiki({ limit: wikiLimit, delayMs });
        break;
      case 'all':
      default:
        data = await KeralaElectionScraper.syncAll({ url: targetUrl, enrichWiki, wikiLimit, delayMs });
    }

    return res.json({ success: true, mode, data });
  } catch (error: any) {
    console.error('[Scraper]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};