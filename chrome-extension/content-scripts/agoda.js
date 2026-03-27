// RateGenie Scraper Test — Agoda
// เปิด DevTools (F12) แล้วดู Console tab

(function () {
  const LABEL = "[RateGenie:Agoda]";

  function extractPrices() {
    const results = [];

    // Strategy 1: Property cards ในหน้า search results
    const cards = document.querySelectorAll('[data-selenium="hotel-item"], .PropertyCard, [data-element-name="property-card"]');

    cards.forEach((card, i) => {
      const name =
        card.querySelector('[data-selenium="hotel-name"]')?.textContent?.trim() ||
        card.querySelector('.PropertyCard__HotelName')?.textContent?.trim() ||
        card.querySelector('h3')?.textContent?.trim() ||
        `hotel-${i}`;

      const priceEl =
        card.querySelector('[data-selenium="display-price"]') ||
        card.querySelector('.PropertyCardPrice__Value') ||
        card.querySelector('[data-element-name="final-price"]');

      const priceText = priceEl?.textContent?.trim() || "";
      const price = parseFloat(priceText.replace(/[^\d.]/g, ""));

      if (name && price > 0) {
        results.push({ hotelName: name, price, priceText, otaName: "Agoda" });
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
      // dump DOM hints for debugging
      console.log(`${LABEL} DEBUG — hotel-item elements:`, document.querySelectorAll('[data-selenium="hotel-item"]').length);
      console.log(`${LABEL} DEBUG — PropertyCard elements:`, document.querySelectorAll('.PropertyCard').length);
      console.log(`${LABEL} DEBUG — h3 elements:`, document.querySelectorAll('h3').length);
    }
  }

  // Initial scan
  console.log(`${LABEL} Content script loaded — scanning...`);
  setTimeout(scan, 2000);

  // Re-scan on DOM changes (SPA navigation / lazy load)
  let timer = null;
  const observer = new MutationObserver(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(scan, 3000);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Manual trigger: พิมพ์ rategenieScan() ใน console
  window.rategenieScan = scan;

  console.log(`${LABEL} พิมพ์ rategenieScan() ใน console เพื่อ scan ด้วยตนเอง`);
})();
