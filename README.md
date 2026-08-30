# Glance

A calm home screen for a TV: clock, weather, headlines, market prices and
the status of your own servers. The whole app is [one HTML file](index.html)
with no build step, no dependencies and no server.

It exists to show what a single web page can be inside an mHub app, using
the [mHub Browser API](https://mhub.mx/mhub-api.md). Open the file to see
how little it takes.

## What each tile demonstrates

| Tile      | Plain browser | Inside mHub | Power |
|-----------|---------------|-------------|-------|
| Clock     | works         | works       | none, it is just useful |
| Weather   | works         | works       | none, Open-Meteo allows cross-origin reads |
| Crypto    | works         | works       | none, CoinGecko allows them too; it is the contrast to the next two |
| Headlines | Wikipedia only | Wikipedia + your feeds | `mhub.fetch`: Wikipedia's "In the news" allows cross-origin reads, RSS feeds do not, so a plain website cannot read your own feeds |
| Stocks & metals | asleep  | works       | `mhub.fetch`: Yahoo Finance sends no CORS header and wants a browser `User-Agent`, a header a page is not allowed to set |
| Currencies | asleep       | works       | `mhub.fetch`: the ECB reference rates are one XML file without a CORS header |
| Status    | asleep        | works       | `mhub.fetch`: browsers refuse requests to your NAS, router or home server |
| Radio     | works         | works       | `mhub.openStream`: the one way to start external media in an mHub app; these streams need no headers, so the host hands the URL straight back |
| Host      | plain browser | works       | `mhub.device` and `mhub.capabilities`: platform, TV, native playback, and one chip per optional host power |

More powers are invisible in the layout:

- Settings are saved with `mhub.storage`, so they follow the site even when
  its domain changes. In a plain browser, `localStorage` keeps them on the
  current domain.
- `mhub.setLinks` puts a Glance tile on the app's home screen, so the way
  back here survives between visits.
- `mhub.device.isTV` switches to larger type for the couch; the `mhubupdate`
  event keeps that in step if the host changes its mind.
- The `mhubupdate` permission event: a tile that needs web access shows an
  *Allow* button while the site has none, and wakes up by itself once the
  user grants it. The button just makes a request, which is what opens the
  host's dialog.
- `mhub.setBackHandler` and the `mhubback` event: Crypto and Headlines open
  to their full size (the week's chart, every headline), Settings is an
  overlay too. Each is one level deep in the page's own navigation, so the
  back button closes it instead of leaving the site.
- `mhub.setSearch`: the host's search field (the address bar on a phone,
  a search affordance on TV) is scoped to this page. A city changes the
  weather, a ticker joins the stocks tile, a currency code joins the rates;
  suggestions come from the Open-Meteo geocoder. The page has no search
  box of its own.
- The site file for the mirror system is served by whoever hosts the page:
  `mhub-site.json` (`{ "id": "glance", "endpoints": [...] }`) next to it.
  mhub.mx answers it under `/glance/`, and [`server.mjs`](server.mjs)
  answers it at the root of a domain of its own.

Every one of these degrades cleanly: in a plain browser the page stays an
ordinary website, and the tiles that need mHub powers say so instead of
breaking.

## Run it

Open `index.html` from any web server, or upload it to any static host.
Inside an mHub app, the sleeping tiles wake up. Configure city, feeds and
status checks through the Settings button.

To give it a domain of its own there is `server.mjs`, which is a static host
and nothing more:

```
npm start          # PORT=… node server.mjs, 3003 by default
```

It answers three paths: the page, `/mhub-site.json`, and `/health.json`, which
is public and says `{ "ok": true }` and nothing else. The page still needs no server;
this one exists because a domain needs something listening on it, and because
a bare file cannot answer the site file.

To make the page survive a dead domain, serve it from several domains and
list them all in `MHUB_SITE_ENDPOINTS` (comma separated), so every copy names
the same set. Unset, it names the domain the request came in on. That is the
whole mirror integration.

## License

MIT
