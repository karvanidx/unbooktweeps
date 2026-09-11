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
        position: fixed; inset: 0; background: rgba(0,0,0,0.6);
        z-index: 999999; display: flex; align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: #16181c; color: #e7e9ea; border-radius: 16px;
        width: 90%; max-width: 520px; max-height: 80vh; display: flex;
        flex-direction: column; border: 1px solid #2f3336;
      `;

      const header = document.createElement('div');
      header.style.cssText = `padding: 16px 20px 12px; border-bottom: 1px solid #2f3336; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;`;

      const headerText = document.createElement('div');
      const title = document.createElement('div');
      title.style.cssText = `font-weight: bold; font-size: 17px;`;
      title.textContent = 'Unbookmark tweets';
      const subtitle = document.createElement('div');
      subtitle.style.cssText = `font-size: 13px; color: #71767b; margin-top: 2px;`;
      subtitle.textContent = 'Uncheck tweets you want to keep.';
      headerText.appendChild(title);
      headerText.appendChild(subtitle);
      header.appendChild(headerText);

      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.style.cssText = `
        width: 32px; height: 32px; border-radius: 50%; border: none;
        background: transparent; color: #71767b; font-size: 16px;
        cursor: pointer; flex-shrink: 0;
      `;
      header.appendChild(closeBtn);
      modal.appendChild(header);

      const list = document.createElement('div');
      list.style.cssText = `overflow-y: auto; padding: 4px 0; flex: 1;`;

      const checkboxes = [];

      const counter = document.createElement('span');
      counter.style.cssText = `color: #71767b; font-size: 13px;`;
      const updateCounter = () => {
        const selected = checkboxes.filter((cb) => cb.checked).length;
        counter.textContent = `${selected} of ${tweets.length} selected`;
        confirmBtn.textContent = selected > 0 ? `Unbookmark ${selected}` : 'Unbookmark';
        confirmBtn.disabled = selected === 0;
      };

      tweets.forEach((tw) => {
        const row = document.createElement('div');
        row.style.cssText = `
          display: flex; gap: 12px; padding: 10px 16px; align-items: center;
          border-bottom: 1px solid #2f333688; cursor: pointer;
        `;
        row.addEventListener('mouseenter', () => { row.style.background = '#1d1f23'; });
        row.addEventListener('mouseleave', () => { row.style.background = ''; });

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.style.cssText = `width: 16px; height: 16px; flex-shrink: 0; cursor: pointer; accent-color: #f4212e;`;
        checkbox.addEventListener('change', updateCounter);
        checkboxes.push(checkbox);
        row.appendChild(checkbox);

        if (tw.thumbnail) {
          const img = document.createElement('img');
          img.src = tw.thumbnail;
          img.style.cssText = `width: 40px; height: 40px; object-fit: cover; border-radius: 8px; flex-shrink: 0;`;
          row.appendChild(img);
        }

        const info = document.createElement('div');
        info.style.cssText = `flex: 1; min-width: 0;`;
        info.innerHTML = `
          <div style="font-weight: bold; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${tw.name} <span style="color: #71767b; font-weight: normal; font-size: 13px;">${tw.username}</span>
          </div>
          <div style="font-size: 13px; color: #b0b3b8; margin-top: 2px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${tw.text || '(no text)'}
          </div>
        `;
        row.appendChild(info);

        row.addEventListener('click', (e) => {
          if (e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
            updateCounter();
          }
        });

        list.appendChild(row);
      });

      modal.appendChild(list);

      const footer = document.createElement('div');
      footer.style.cssText = `padding: 12px 16px; border-top: 1px solid #2f3336; display: flex; gap: 10px; align-items: center; justify-content: space-between;`;

      const btnBase = `padding: 8px 16px; border-radius: 9999px; font-weight: bold; font-size: 14px; cursor: pointer;`;

      const invertBtn = document.createElement('button');
      invertBtn.textContent = 'Invert';
      invertBtn.className = 'ubt-btn ubt-ghost';
      invertBtn.style.cssText = `${btnBase} border: none; background: transparent; color: #e7e9ea;`;
      invertBtn.onclick = () => {
        checkboxes.forEach((cb) => { cb.checked = !cb.checked; });
        updateCounter();
      };

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.className = 'ubt-btn';
      cancelBtn.style.cssText = `${btnBase} border: 1px solid #536471; background: transparent; color: #e7e9ea;`;

      const confirmBtn = document.createElement('button');
      confirmBtn.textContent = 'Unbookmark';
      confirmBtn.className = 'ubt-btn';
      confirmBtn.style.cssText = `${btnBase} border: none; background: #f4212e; color: white;`;

      const btnGroup = document.createElement('div');
      btnGroup.style.cssText = `display: flex; gap: 8px;`;
      btnGroup.appendChild(invertBtn);
      btnGroup.appendChild(cancelBtn);
      btnGroup.appendChild(confirmBtn);

      updateCounter();
      footer.appendChild(counter);
      footer.appendChild(btnGroup);
      modal.appendChild(footer);

      const style = document.createElement('style');
      style.textContent = `
        .ubt-btn { transition: background 0.15s ease, filter 0.15s ease; }
        .ubt-btn:hover { filter: brightness(1.1); }
        .ubt-btn:active { filter: brightness(0.9); }
        .ubt-btn:disabled { opacity: 0.5; cursor: not-allowed; filter: none; }
        .ubt-ghost:hover { background: rgba(231, 233, 234, 0.1); filter: none; }
      `;
      overlay.appendChild(style);

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const close = () => {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', onKey);
        resolve([]);
      };
      const onKey = (e) => { if (e.key === 'Escape') close(); };
      document.addEventListener('keydown', onKey);

      closeBtn.onclick = close;
      cancelBtn.onclick = close;

      confirmBtn.onclick = () => {
        const selected = tweets.filter((_, i) => checkboxes[i].checked);
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', onKey);
        resolve(selected);
      };
    });
  }

  async function executeUnbookmark(selectedTweets) {
    if (selectedTweets.length === 0) {
      console.log('❌ Cancelled, no tweets selected.');
      return 0;
    }

    console.log(`🚀 Unbookmarking ${selectedTweets.length} selected tweets...`);
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
        console.log(`✅ (${count}/${selectedTweets.length}) Unbookmarked: ${tw.name} ${tw.username}`);
      } else {
        console.log(`⚠️ Button not found for "${tw.name}". Link: ${tw.link}`);
      }

      await sleep(CLICK_DELAY);
    }

    console.log(`🎉 Done! ${count}/${selectedTweets.length} tweets unbookmarked.`);
    return count;
  }

  // ---------- Main flow (langsung di dalam async function, tanpa IIFE) ----------
  console.log(`🔍 Collecting top ${N} bookmarked tweets...`);
  const tweets = await collectTweets();

  if (tweets.length === 0) {
    console.log('⚠️ No bookmarked tweets found.');
    return 0;
  }

  console.log(`📋 Found ${tweets.length} tweets. Opening confirmation dialog...`);
  const selected = await showConfirmModal(tweets);
  const removedCount = await executeUnbookmark(selected);
  return removedCount;
}

// ---------- Runner buat DevTools Snippets ----------
// Ctrl+Enter di snippet → dialog tanya jumlah tweet → jalan
const input = prompt('How many tweets to unbookmark?', '10');
const N = parseInt(input, 10);

if (Number.isFinite(N) && N > 0) {
  unbookmarkFirstN(N).then((count) => {
    console.log(`✅ Done! ${count} tweet${count === 1 ? '' : 's'} unbookmarked.`);
  });
} else {
  console.log('⚠️ Cancelled or invalid number.');
}
