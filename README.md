# unbooktweeps

Bulk-unbookmark script for X/Twitter bookmarks. Collects the top N bookmarked tweets, shows them in a confirmation modal (all checked by default — uncheck what you want to keep), and unbookmarks the rest in one go.

## Features

- Infinite-scroll collection of up to N bookmarked tweets
- Confirmation modal with thumbnail, author, and text preview
- All checkboxes checked by default — uncheck tweets you want to keep
- Recovers from X's virtual scroll (re-finds buttons that got unmounted from the DOM)
- Adjustable delays between scrolls and clicks

## Usage

### Recommended: DevTools Snippets (Chrome/Edge)

One-time setup:

1. Open your bookmarks page: <https://x.com/i/bookmarks>
2. Open DevTools (`F12`) → **Sources** tab → **Snippets** panel (left sidebar)
3. Click **+ New snippet**, paste the entire contents of `main.js`, save with `Ctrl+S`

Whenever you want to run it:

1. Open the snippet → `Ctrl+Enter`
2. A dialog asks how many tweets to process
3. Confirmation modal appears → uncheck anything you want to keep → click **Unbookmark yang dicentang**

Snippets persist across DevTools sessions, so setup only happens once.

### Classic: paste into console

1. Open <https://x.com/i/bookmarks>
2. Open DevTools (`F12`) → **Console**
3. Paste the entire `main.js` and press `Enter` — the prompt dialog appears immediately

This is also the way to run it on Firefox, which has no built-in Snippets.

## Options

```js
unbookmarkFirstN(N, {
  scrollDelay: 1500,   // ms between scrolls while collecting
  clickDelay: 1500,    // ms between unbookmark clicks
  maxScrollTries: 10,  // consecutive scrolls with no new tweets before giving up
})
```

The runner at the bottom of `main.js` uses the defaults. To customize, remove the runner and call `unbookmarkFirstN(N, options)` yourself from the console.

## Notes

- Relies on X's `data-testid` attributes. X changes its DOM often — if it stops working, the selectors in `extractTweetData()` are the first place to look.
- The default 1.5 s click delay is intentional; keeping it avoids tripping rate limits.
- Only tweets that are currently bookmarked are collected (detected via the "remove bookmark" button).
