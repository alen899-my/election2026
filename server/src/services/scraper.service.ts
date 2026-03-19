import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { db } from '../config/db';
import { constituencies } from '../schema/constituencies';
import { candidates } from '../schema/candidates';

export class DemographicsScraper {
  
  /**
   * Universal method to load any public URL dynamically,
   * extract the raw rendered HTML via Puppeteer, 
   * and pass it to Cheerio for incredibly fast DOM parsing.
   */
  static async fetchDynamicPage(url: string) {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    try {
      const page = await browser.newPage();
      // Masking as standard user-agent so government/media firewalls don't block
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      const content = await page.content();
      return cheerio.load(content);
    } finally {
      await browser.close();
    }
  }

  /**
   * Example mapping method for discovering basic text fields
   * inside table rows (<tr>) holding Candidate or Seat info.
   */
  static async syncConstituenciesFromSource(targetUrl: string) {
    console.log(`[Scraper] Initializing dynamic scrape on: ${targetUrl}`);
    const $ = await this.fetchDynamicPage(targetUrl);
    
    const results: any[] = [];
    
    // Configurable CSS Selectors (e.g. '.election-table tbody tr')
    $('table.target-class tbody tr').each((_: number, element: any) => {
      const columns = $(element).find('td');
      
      if (columns.length > 3) {
        // Map raw HTML text strings directly into Database formats
        results.push({
          number: parseInt($(columns[0]).text().trim(), 10),
          nameEn: $(columns[1]).text().trim(),
          nameMl: $(columns[1]).text().trim(), // Fallback translation / mapping needed later
          slug: $(columns[1]).text().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          category: $(columns[2]).text().trim().toLowerCase().includes('sc') ? 'sc' : 'general',
        });
      }
    });

    console.log(`[Scraper] Successfully parsed ${results.length} records. Syncing to Drizzle Neon...`);
    
    // Bulk Insert (skipping duplicates logically)
    if (results.length > 0) {
      await db.insert(constituencies).values(results).onConflictDoNothing();
    }
    
    return results;
  }
}
