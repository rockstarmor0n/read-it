chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'getSummary') return;

  const { url } = message;

  (async () => {
    try {
      // try jina reader with summary mode
      const res = await fetch(`https://r.jina.ai/${url}`, {
        headers: {
          'Accept': 'application/json',
          'X-Return-Format': 'text',
          'X-With-Summary': 'true',
          'X-Timeout': '10'
        }
      });

      const json = await res.json();
      const data = json?.data;

      // level 1 — jina description
      if (data?.description?.trim().length > 60) {
        sendResponse({ summary: data.description.trim() });
        return;
      }

      // level 2 — jina summary
      if (data?.summary?.trim().length > 60) {
        sendResponse({ summary: data.summary.trim() });
        return;
      }

      // level 3 — extract first real paragraph from text
      // skip nav/menu garbage by finding first chunk of 3+ sentences
      const rawText = data?.text || '';
      const chunks = rawText.split(/\n+/).map(c => c.trim()).filter(c => c.length > 80);

      // find first chunk that looks like actual prose not nav
      const navWords = ['menu', 'navigation', 'contents', 'search', 'log in', 'sign in', 'cookie', 'jump to', 'hide', 'toggle'];
      const prose = chunks.find(chunk => {
        const lower = chunk.toLowerCase();
        return !navWords.some(w => lower.includes(w)) && chunk.split('.').length >= 2;
      });

      if (prose) {
        // trim to 2-3 sentences max
        const sentences = prose.match(/[^.!?]+[.!?]+/g) || [];
        const summary = sentences.slice(0, 3).join(' ').trim();
        if (summary.length > 60) {
          sendResponse({ summary });
          return;
        }
      }

      // level 4 — use page title as last resort
      if (data?.title) {
        sendResponse({ summary: `this page is about: ${data.title}.` });
        return;
      }

      sendResponse({ error: 'could not extract a summary.' });

    } catch (err) {
      sendResponse({ error: 'failed: ' + err.message });
    }
  })();

  return true;
});