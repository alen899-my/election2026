import { Request, Response } from 'express';
import { DemographicsScraper } from '../services/scraper.service';

export const runScrapingJob = async (req: Request, res: Response) => {
  try {
    const { targetUrl } = req.body;

    if (!targetUrl) {
      return res.status(400).json({ success: false, error: 'A target URL strictly mapped to your parsing logic must be provided.' });
    }

    // Trigger the heavy-lifting logic asynchronously 
    const records = await DemographicsScraper.syncConstituenciesFromSource(targetUrl);

    return res.json({ 
      success: true, 
      message: 'Scraping sequence successfully synced to Database.',
      totalParsed: records.length,
      data: records
    });

  } catch (error: any) {
    console.error(`[Scraping Failed]:`, error.message);
    res.status(500).json({ success: false, error: error.message || 'Scraper failed to execute rendering.' });
  }
};
