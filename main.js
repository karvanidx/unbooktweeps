async function unbookmarkFirstN(N, options = {}) {
  const SCROLL_DELAY = options.scrollDelay ?? 1500;
  const CLICK_DELAY = options.clickDelay ?? 1500;
  const MAX_SCROLL_TRIES = options.maxScrollTries ?? 10;

  const sleep = (ms) => new Promise(res => setTimeout(res, ms));

  function extractTweetData(article) {
    const nameEl = article.querySelector('[data-testid="User-Name"] span');
    const usernameEl = article.querySelector('[data-testid="User-Name"] a[href^="/"] div[dir="ltr"] span');
    const textEl = article.querySelector('[data-testid="tweetText"]');
    const imgEl = article.querySelector('[data-testid="tweetPhoto"] img');
    const btn = article.querySelector('[data-testid="removeBookmark"]');
    const linkEl = article.querySelector('a[href*="/status/"]');
    const href = linkEl ? linkEl.getAttribute('href') : null;

    return {
      name: nameEl ? nameEl.textContent.trim() : '(unknown)',
      username: usernameEl ? usernameEl.textContent.trim() : '',
      text: textEl ? textEl.textContent.trim().slice(0, 120) : '(no text)',
      thumbnail: imgEl ? imgEl.src : null,
      href,
      link: href ? 'https://x.com' + href : null,
      button: btn,
    };
  }

  async function collectTweets() {
    const collected = [];
    const seenLinks = new Set();
    let scrollTries = 0;

    while (collected.length < N && scrollTries < MAX_SCROLL_TRIES) {
      const articles = Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
      let foundNew = false;

      for (const article of articles) {
        if (collected.length >= N) break;
        const btn = article.querySelector('[data-testid="removeBookmark"]');
        if (!btn) continue;

        const data = extractTweetData(article);
        if (!data.link || seenLinks.has(data.link)) continue;

        seenLinks.add(data.link);
        collected.push(data);
        foundNew = true;
      }

      if (collected.length < N) {
        if (!foundNew) scrollTries++;
        else scrollTries = 0;
        window.scrollBy(0, window.innerHeight);
        await sleep(SCROLL_DELAY);
      }
    }

    return collected;
  }

  function showConfirmModal(tweets) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.75);
        z-index: 999999; display: flex; align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: #16181c; color: #e7e9ea; border-radius: 16px;
        width: 90%; max-width: 500px; max-height: 80vh; display: flex;
        flex-direction: column; border: 1px solid #2f3336;
      `;

      const header = document.createElement('div');
      header.style.cssText = `padding: 16px 20px; border-bottom: 1px solid #2f3336; font-weight: bold; font-size: 16px;`;
      header.textContent = `Konfirmasi Unbookmark (${tweets.length} tweet)`;
      modal.appendChild(header);

      const list = document.createElement('div');
      list.style.cssText = `overflow-y: auto; padding: 8px 0; flex: 1;`;

      const checkboxes = [];

      const counter = document.createElement('span');
      counter.style.cssText = `color: #71767b; font-size: 13px;`;
      const updateCounter = () => {
        const selected = checkboxes.filter((cb) => cb.checked).length;
        counter.textContent = `${selected}/${tweets.length} dipilih`;
      };

      tweets.forEach((tw) => {
        const row = document.createElement('div');
        row.style.cssText = `
          display: flex; gap: 12px; padding: 12px 20px; align-items: flex-start;
          border-bottom: 1px solid #2f333688;
        `;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.style.cssText = `margin-top: 4px; width: 18px; height: 18px; flex-shrink: 0; cursor: pointer;`;
        checkbox.addEventListener('change', updateCounter);
        checkboxes.push(checkbox);
        row.appendChild(checkbox);

        if (tw.thumbnail) {
          const img = document.createElement('img');
          img.src = tw.thumbnail;
          img.style.cssText = `width: 48px; height: 48px; object-fit: cover; border-radius: 6px; flex-shrink: 0;`;
          row.appendChild(img);
        }

        const info = document.createElement('div');
        info.style.cssText = `flex: 1; min-width: 0;`;
        info.innerHTML = `
          <div style="font-weight: bold; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${tw.name} <span style="color: #71767b; font-weight: normal;">${tw.username}</span>
          </div>
          <div style="font-size: 13px; color: #b0b3b8; margin-top: 2px;">
            ${tw.text || '(tidak ada teks)'}
          </div>
        `;
        row.appendChild(info);

        list.appendChild(row);
      });

      modal.appendChild(list);

      const footer = document.createElement('div');
      footer.style.cssText = `padding: 16px 20px; border-top: 1px solid #2f3336; display: flex; gap: 10px; align-items: center; justify-content: space-between;`;

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Batal';
      cancelBtn.style.cssText = `
        padding: 8px 16px; border-radius: 20px; border: 1px solid #536471;
        background: transparent; color: #e7e9ea; cursor: pointer; font-weight: bold;
      `;

      const confirmBtn = document.createElement('button');
      confirmBtn.textContent = 'Unbookmark yang dicentang';
      confirmBtn.style.cssText = `
        padding: 8px 16px; border-radius: 20px; border: none;
        background: #f4212e; color: white; cursor: pointer; font-weight: bold;
      `;

      const invertBtn = document.createElement('button');
      invertBtn.textContent = '⇅ Balik Seleksi';
      invertBtn.style.cssText = `
        padding: 8px 16px; border-radius: 20px; border: 1px solid #536471;
        background: transparent; color: #e7e9ea; cursor: pointer; font-weight: bold;
      `;
      invertBtn.onclick = () => {
        checkboxes.forEach((cb) => { cb.checked = !cb.checked; });
        updateCounter();
      };

      const btnGroup = document.createElement('div');
      btnGroup.style.cssText = `display: flex; gap: 10px;`;
      btnGroup.appendChild(invertBtn);
      btnGroup.appendChild(cancelBtn);
      btnGroup.appendChild(confirmBtn);

      updateCounter();
      footer.appendChild(counter);
      footer.appendChild(btnGroup);
      modal.appendChild(footer);

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      cancelBtn.onclick = () => {
        document.body.removeChild(overlay);
        resolve([]);
      };

      confirmBtn.onclick = () => {
        const selected = tweets.filter((_, i) => checkboxes[i].checked);
        document.body.removeChild(overlay);
        resolve(selected);
      };
    });
  }

  async function executeUnbookmark(selectedTweets) {
    if (selectedTweets.length === 0) {
      console.log('❌ Dibatalkan, tidak ada tweet yang di-unbookmark.');
      return 0;
    }

    console.log(`🚀 Mulai unbookmark ${selectedTweets.length} tweet yang dipilih...`);
    let count = 0;

    for (const tw of selectedTweets) {
      let btn = (tw.button && document.body.contains(tw.button)) ? tw.button : null;

      // Tombol hilang (kena unmount virtual-scroll) → scroll ke atas & cari ulang
      if (!btn) {
        window.scrollTo(0, 0);
        await sleep(1000);
        const article = Array.from(document.querySelectorAll('article[data-testid="tweet"]'))
          .find(a => a.querySelector('a[href*="/status/"]')?.getAttribute('href') === tw.href);
        btn = article ? article.querySelector('[data-testid="removeBookmark"]') : null;
      }

      if (btn) {
        btn.click();
        count++;
        console.log(`✅ (${count}/${selectedTweets.length}) Unbookmark: ${tw.name} ${tw.username}`);
      } else {
        console.log(`⚠️ Tombol untuk "${tw.name}" tetap tidak ketemu. Link: ${tw.link}`);
      }

      await sleep(CLICK_DELAY);
    }

    console.log(`🎉 Selesai! ${count}/${selectedTweets.length} tweet berhasil di-unbookmark.`);
    return count;
  }

  // ---------- Main flow (langsung di dalam async function, tanpa IIFE) ----------
  console.log(`🔍 Mengumpulkan ${N} tweet teratas...`);
  const tweets = await collectTweets();

  if (tweets.length === 0) {
    console.log('⚠️ Tidak ada tweet bookmarked yang ditemukan.');
    return 0;
  }

  console.log(`📋 Ditemukan ${tweets.length} tweet. Menampilkan dialog konfirmasi...`);
  const selected = await showConfirmModal(tweets);
  const removedCount = await executeUnbookmark(selected);
  return removedCount;
}

// ---------- Runner buat DevTools Snippets ----------
// Ctrl+Enter di snippet → dialog tanya jumlah tweet → jalan
const input = prompt('Berapa tweet yang mau di-unbookmark?', '10');
const N = parseInt(input, 10);

if (Number.isFinite(N) && N > 0) {
  unbookmarkFirstN(N).then((count) => {
    console.log(`✅ Runner selesai, total di-unbookmark: ${count}`);
  });
} else {
  console.log('⚠️ Dibatalkan atau angka tidak valid.');
}
