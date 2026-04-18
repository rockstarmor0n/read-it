# read-it

A minimal Chrome extension that helps you organize your reading queue while browsing.

## the problem

You're deep in a rabbit hole — reading about one thing, finding three more interesting links, and either losing them or drowning in open tabs. Most bookmark tools are glorified link dumps. read-it is a queue built around how curiosity actually works.

## what it does

- **shift+click any link** to silently save it to your queue
- **ai-powered hover previews** — pause on any link for 0.3s and get a summary before deciding to save it
- **auto-groups links by topic** based on the page title
- **read next** highlights the first unread link in each group
- **skip** links without losing them — they move to the back of the queue
- **dark/light mode** with system detection and manual toggle
- everything stored locally — no account, no tracking, no backend

## how it works

1. hover over any link to see an ai-generated preview (powered by jina.ai)
2. shift+click to save it to your queue
3. open the extension popup to see your queue organized by topic
4. mark links as read or skip them

## tech stack

- vanilla javascript chrome extension (manifest v3)
- jina.ai reader api for content extraction and summarization
- chrome storage api for local persistence

## installation

Since this extension isn't on the Chrome Web Store yet, you can load it manually:

1. clone this repo 
git clone https://github.com/rockstarmor0n/read-it.git
2. open Chrome and go to `chrome://extensions`
3. enable **Developer mode** (top right)
4. click **Load unpacked** and select the cloned folder
5. pin the extension and start browsing

## setup

No API keys needed — works out of the box.

## contributing

Feel free to open issues or PRs. Some ideas for future features:
- export queue as markdown
- browser sync across devices
- publish on chrome
- firefox support
- ai group naming

## license

MIT
