// RateGenie Scraper Test — Google Hotels

(function () {
  const LABEL = "[RateGenie:Google]";

  function extractPrices() {
    const results = [];

    // Google Hotels property listings
    // ลองหลาย selector เพราะ Google เปลี่ยนบ่อย
    const cards = document.querySelectorAll(
      '.BgYkof, [data-hotel-id], .kCsInf, [jsname="mutHjb"]'
    );

    cards.forEach((card, i) => {
      // ชื่อโรงแรม
      const name =
        card.querySelector('.BgYkof')?.textContent?.trim() ||
        card.querySelector('h2')?.textContent?.trim() ||
        card.querySelector('[aria-label]')?.getAttribute('aria-label') ||
        `hotel-${i}`;

      // ราคา — Google ใช้ class ที่ minified แต่มักอยู่ใน element ที่มี aria-label กับราคา
      const priceEl =
        card.querySelector('.kixHKb') ||
        card.querySelector('.dv1Q3e') ||
        card.querySelector('[data-price]');

      let priceText = priceEl?.textContent?.trim() || "";
      if (!priceText && priceEl) {
        priceText = priceEl.getAttribute('data-price') || "";
      }

      // ลอง aria-label ที่มีราคา
      if (!priceText) {
        const allEls = card.querySelectorAll('[aria-label]');
        for (const el of allEls) {
          const label = el.getAttribute('aria-label') || "";
          if (label.match(/฿|THB|\d{3,}/)) {
            priceText = label;
            break;
          }
        }
      }

      const price = parseFloat(priceText.replace(/[^\d.]/g, ""));

      if (name && price > 0) {
        results.push({ hotelName: name, price, priceText, otaName: "Google Hotels" });
      }
    });

    return results;
  }

  function scan() {
    const prices = extractPrices();
    if (prices.length > 0) {
      console.log(`${LABEL} พบ ${prices.length} รายการ:`);
      console.table(prices);
    } else {
      console.log(`${LABEL} ยังไม่พบราคา — ลอง scroll หรือรอ page โหลดเสร็จ`);
      console.log(`${LABEL} DEBUG — BgYkof:`, document.querySelectorAll('.BgYkof').length);
      console.log(`${LABEL} DEBUG — data-hotel-id:`, document.querySelectorAll('[data-hotel-id]').length);
      console.log(`${LABEL} DEBUG — h2:`, document.querySelectorAll('h2').length);
    }
  }

  console.log(`${LABEL} Content script loaded — scanning...`);
  setTimeout(scan, 2000);

  let timer = null;
  const observer = new MutationObserver(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(scan, 3000);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.rategenieScan = scan;
  console.log(`${LABEL} พิมพ์ rategenieScan() ใน console เพื่อ scan ด้วยตนเอง`);
})();
