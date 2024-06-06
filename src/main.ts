// For more information, see https://crawlee.dev/
import { PlaywrightCrawler } from "crawlee";
import { parseResult } from "./utils/util.js";

// PlaywrightCrawler crawls the web using a headless
// browser controlled by the Playwright library.
const crawler = new PlaywrightCrawler({
  // Use the requestHandler to process each of the crawled pages.
  async requestHandler({ request, page, enqueueLinks, log, pushData }) {
    if (request.loadedUrl?.includes("index.htm")) {
      // const party wise
      const parties = await page.locator(".rslt-table tbody tr").all();
      log.info(`Found ${parties.length} parties`);
      const candidates = [];
      for (const party of parties) {
        const partyName = await party.locator("td").nth(0).textContent();
        log.info(`Processing party: ${partyName}`);
        // seprate party name and party code
        const partyCode = partyName?.split(" - ")[0];
        const par = partyName?.split(" - ")[1];
        const won = await party.locator("td").nth(3).textContent();
        const link = await party
          .locator("td")
          .nth(1)
          .locator("a")
          .getAttribute("href");
        log.info(`Processing party: ${partyName} ${link}`);
        candidates.push({ code: partyCode, name: par, won, link });
      }
      // Save results as JSON to ./storage/datasets/default
      await pushData({ parties: candidates }, "parties");

      // Extract links from the current page
      // and add them to the crawling queue.
      await enqueueLinks({
        globs: [
          "https://results.eci.gov.in/PcResultGenJune2024/partywisewinresultState-**.htm",
        ],
      });
    }

    if (request?.loadedUrl?.includes("partywisewinresultState-")) {
      // const party wise
      const partyName = await page.locator(".page-title span").textContent();
      // const partyName = "Winning Candidate ( Bharatiya Janata Party )";
      // remove winning candidate and brackets from string

      const partyCode = partyName
        ?.replace("Winning Candidate (", "")
        .replace(")", "");

      log.info(`Processing party: ${partyName}`);
      const constituencies = await page.locator(".table tbody tr").all();
      log.info(`Found ${constituencies.length} constituencies`);
      const consiqncy = [];
      for (const cons of constituencies) {
        const consName = await cons.locator("td").nth(1).textContent();
        // consName = "Dhubri (2)";
        const consCode = consName?.split("(")[0];
        // get number between brackets
        const consNumber = consName?.split("(")[1].replace(")", "");
        const candidates = await cons.locator("td").nth(2).textContent();
        const totalVotes = await cons.locator("td").nth(3).textContent();
        const margin = await cons.locator("td").nth(4).textContent();
        log.info(`Processing constituency: ${consName}`);

        consiqncy.push({
          name: consCode,
          number: consNumber,
          candidates,
          totalVotes,
          margin,
        });
      }

      // Save results as JSON to ./storage/datasets/default
      await pushData(
        { party: partyCode, constituencies: consiqncy },
        "partywisewinresultState"
      );
      await enqueueLinks({
        globs: [
          "https://results.eci.gov.in/PcResultGenJune2024/candidateswise-**.htm",
        ],
      });
    }

    if (request?.loadedUrl?.includes("candidateswise-")) {
      // const party wise

      const title = await page.locator(".page-title span").textContent();
      log.info(`Processing party: ${title}`);
      // const title = "12 - Gadchiroli - Chimur (Maharashtra)";
      // before - is constituency code
      const consCode = title?.split(" - ")[0];
      // between - and ( is constituency Name
      const consName = title?.split(" - ")[1].split("(")[0];
      // between ( and ) is state name
      const state = title?.split(" - ")[1].split("(")[1].replace(")", "");
      const candi = await page.locator(".cand-box").all();
      const candidates = [];
      for (const cand of candi) {
        const isWinner =
          (await cand.locator(".cand-info .status.won").count()) > 0;
        const image = await cand.locator("img").getAttribute("src");
        const party =
          (await cand.locator(".cand-info .nme-prty h6").textContent()) ?? "";
        const name =
          (await cand.locator(".cand-info .nme-prty h5").textContent()) ?? "";
        const voteString: string =
          (await cand.locator(".cand-info .status").textContent()) ?? "";
        const votes = parseResult(voteString);
        candidates.push({
          name,
          party,
          image,
          isWinner,
          votes,
          state,
          consCode,
          consName,
        });
      }

      // Save results as JSON to ./storage/datasets/default
      await pushData({ candidates }, "candidateswise");
    }
  },
  // Comment this option to scrape the full website.
  // maxRequestsPerCrawl: 10,
  // Uncomment this option to see the browser window.
  // headless: false,
});

// Add first URL to the queue and start the crawl.
await crawler.run(["https://results.eci.gov.in/PcResultGenJune2024/index.htm"]);
