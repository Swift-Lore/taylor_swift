// Public read API for Swift Lore. The credential never reaches the browser.
const BASE_ID = 'appVhtDyx0VKlGbhy';
const TABLES = {
  events: {
    name: 'Taylor Swift Master Tracker',
    fields: ['DATE', 'EVENT', 'CATEGORY', 'LOCATION', 'IMAGE', 'KEYWORDS',
      'NOTES', 'HOLIDAYS', 'TRACKER', 'SOURCES', 'INSTAGRAM', 'TWITTER',
      'TIKTOK', 'YOUTUBE', 'SHOW DISPLAY NAME', 'VENUE', 'Surprise Song 1',
      'Surprise Song 2', 'Eras Show #', 'GETTY EMBED', 'FACEBOOK EMBED'],
  },
  keywords: { name: 'Keywords', fields: ['Keywords'] },
  outfits: {
    name: 'ERAS TOUR OUTFITS',
    fields: ['Outfit Name', 'Outfit Era Section', 'GETTY EMBED', 'TIMES WORN', 'SHOW DATES'],
  },
  wedding: {
    name: 'Wedding',
    fields: ['Name', 'GUEST TYPE', 'URLS', 'URL TYPE', 'NOTES',
      'SPECIAL ROLE / MOMENT', 'CAPTION(S)'],
  },
};

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Only GET requests are supported.' });
  }

  const params = new URL(req.url, 'http://localhost').searchParams;
  const tableKey = params.get('table');
  const table = Object.hasOwn(TABLES, tableKey) ? TABLES[tableKey] : null;
  if (!table) return json(res, 400, { error: 'Unknown public table.' });
  const id = params.get('id');
  if (id !== null && (tableKey !== 'events' || !/^rec[a-zA-Z0-9]{14}$/.test(id))) {
    return json(res, 400, { error: 'Invalid event ID.' });
  }

  const upstream = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table.name)}${id ? `/${id}` : ''}`);
  const requestedFields = [];
  const singles = new Set();
  for (const [key, value] of params) {
    if (key === 'table' || key === 'id') {
      if (singles.has(key)) return json(res, 400, { error: 'Duplicate parameter.' });
      singles.add(key);
      continue;
    }
    if (id) return json(res, 400, { error: 'Event detail requests do not accept list options.' });
    const fieldParam = /^fields\[(?:\d*)\]$/.test(key);
    const sortParam = /^sort\[[0-4]\]\[(field|direction)\]$/.exec(key);
    if (!fieldParam && !sortParam && !['filterByFormula', 'offset', 'pageSize', 'maxRecords', 'view'].includes(key)) {
      return json(res, 400, { error: 'Unsupported query option.' });
    }
    if (value.length > 8000 || (!fieldParam && singles.has(key))) {
      return json(res, 400, { error: 'Invalid query option.' });
    }
    singles.add(key);
    if (fieldParam || sortParam?.[1] === 'field') {
      if (!table.fields.includes(value)) return json(res, 400, { error: 'Unknown public field.' });
      if (fieldParam) requestedFields.push(value);
    }
    if (sortParam?.[1] === 'direction' && !['asc', 'desc'].includes(value)) {
      return json(res, 400, { error: 'Invalid sort direction.' });
    }
    if (['pageSize', 'maxRecords'].includes(key) && (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 100)) {
      return json(res, 400, { error: 'Record limit must be between 1 and 100.' });
    }
    if (key === 'view' && (tableKey !== 'outfits' || value !== 'Grid view')) {
      return json(res, 400, { error: 'Unknown public view.' });
    }
    // Existing timeline formulas can reference only public fields.
    if (key === 'filterByFormula' && [...value.matchAll(/\{([^}]+)\}/g)].some((match) => !table.fields.includes(match[1]))) {
      return json(res, 400, { error: 'Formula references a non-public field.' });
    }
    upstream.searchParams.append(fieldParam ? 'fields[]' : key, value);
  }

  const token = process.env.AIRTABLE_API_KEY;
  if (!token) return json(res, 503, { error: 'Airtable connection is not configured.' });
  try {
    const response = await fetch(upstream, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      // Do not send upstream messages, request headers, or credentials to visitors.
      if (response.status === 429) {
        res.setHeader('Retry-After', '30');
        return json(res, 429, { error: 'Too many requests. Please try again shortly.' });
      }
      return json(res, response.status === 404 ? 404 : 502, { error: 'Unable to load Airtable content.' });
    }
    const data = await response.json();
    const allowedFields = new Set(requestedFields.length ? requestedFields : table.fields);
    const publicRecord = (record) => ({
      id: record.id,
      createdTime: record.createdTime,
      fields: Object.fromEntries(Object.entries(record.fields || {}).filter(([field]) => allowedFields.has(field))),
    });
    const body = id ? publicRecord(data) : {
      records: (data.records || []).map(publicRecord),
      ...(data.offset ? { offset: data.offset } : {}),
    };
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    return json(res, 200, body);
  } catch {
    return json(res, 502, { error: 'Unable to load Airtable content. Please try again.' });
  }
}
