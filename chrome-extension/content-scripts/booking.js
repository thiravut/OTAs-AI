// RateGenie Scraper Test — Booking.com

(function () {
  const LABEL = "[RateGenie:Booking]";

  function extractPrices() {
    const results = [];

    // Property cards ในหน้า search results
    const cards = document.querySelectorAll('[data-testid="property-card"]');

    cards.forEach((card, i) => {
      const name =
        card.querySelector('[data-testid="title"]')?.textContent?.trim() ||
        card.querySelector('.sr-hotel__name')?.textContent?.trim() ||
        `hotel-${i}`;

      const priceEl =
        card.querySelector('[data-testid="price-and-discounted-price"]') ||
        card.querySelector('.prco-valign-middle-helper') ||
        card.querySelector('[data-testid="price-for-x-nights"]');

      const priceText = priceEl?.textContent?.trim() || "";
      const price = parseFloat(priceText.replace(/[^\d.]/g, ""));

      if (name && price > 0) {
        results.push({ hotelName: name, price, priceText, otaName: "Booking.com" });
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
      console.log(`${LABEL} DEBUG — property-card elements:`, document.querySelectorAll('[data-testid="property-card"]').length);
      console.log(`${LABEL} DEBUG — title elements:`, document.querySelectorAll('[data-testid="title"]').length);
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
