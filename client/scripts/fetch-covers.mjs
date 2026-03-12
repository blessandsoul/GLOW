#!/usr/bin/env node

/**
 * fetch-covers.mjs
 *
 * Fetches cover images for blog posts from Unsplash (primary) or Pexels (fallback).
 * Reads `coverQuery` from MDX frontmatter and downloads matching images.
 *
 * Usage:
 *   node scripts/fetch-covers.mjs           # Skip existing
 *   node scripts/fetch-covers.mjs --force   # Re-download all
 *
 * Env vars (from .env.local):
 *   UNSPLASH_ACCESS_KEY
 *   PEXELS_API_KEY
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import https from 'https'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CONTENT_DIR = path.join(ROOT, 'content', 'blog')
const COVERS_DIR = path.join(ROOT, 'public', 'images', 'blog-covers')
const COVERS_JSON = path.join(CONTENT_DIR, 'covers.json')

const FORCE = process.argv.includes('--force')

// Georgian tag → English query mapping for better search results
const TAG_MAP = {
  'წამწამები': 'eyelash extensions beauty',
  'სილამაზე': 'beauty salon aesthetic',
  'თმა': 'hair styling salon',
  'ფრჩხილები': 'nail art manicure',
  'მაკიაჟი': 'makeup beauty cosmetics',
  'ტრენდები': 'beauty trends fashion',
  'მოვლა': 'skincare beauty routine',
  'ბიზნესი': 'beauty business salon',
  'რჩევები': 'beauty tips advice',
  'ტექნოლოგია': 'beauty technology innovation',
}

// --- Env parsing (no dotenv dependency) ---

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) return {}

  const content = fs.readFileSync(envPath, 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

const env = loadEnv()
const UNSPLASH_KEY = env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY
const PEXELS_KEY = env.PEXELS_API_KEY || process.env.PEXELS_API_KEY

// --- Frontmatter parsing (minimal, no gray-matter in ESM script) ---

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const fm = {}
  for (const line of match[1].split('\n')) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue
    const key = line.slice(0, colonIndex).trim()
    let value = line.slice(colonIndex + 1).trim()
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1)
    }
    fm[key] = value
  }
  return fm
}

function parseTags(content) {
  const match = content.match(/tags:\s*\[(.*?)\]/)
  if (!match) return []
  return match[1].split(',').map(t => t.trim().replace(/['"]/g, '')).filter(Boolean)
}

// --- Image fetching ---

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: { 'User-Agent': 'GlowGE-Blog/1.0', ...headers },
    }
    https.get(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGet(res.headers.location, headers).then(resolve, reject)
      }
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        const body = Buffer.concat(chunks)
        resolve({ status: res.statusCode, body, headers: res.headers })
      })
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function searchUnsplash(query) {
  if (!UNSPLASH_KEY) return null
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`
    const res = await httpsGet(url, { Authorization: `Client-ID ${UNSPLASH_KEY}` })
    if (res.status !== 200) return null
    const data = JSON.parse(res.body.toString())
    if (!data.results?.length) return null
    const photo = data.results[0]
    return {
      url: photo.urls.regular,
      credit: photo.user.name,
      creditUrl: `https://unsplash.com/@${photo.user.username}`,
      source: 'unsplash',
      sourceUrl: photo.links.html,
    }
  } catch {
    return null
  }
}

async function searchPexels(query) {
  if (!PEXELS_KEY) return null
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`
    const res = await httpsGet(url, { Authorization: PEXELS_KEY })
    if (res.status !== 200) return null
    const data = JSON.parse(res.body.toString())
    if (!data.photos?.length) return null
    const photo = data.photos[0]
    return {
      url: photo.src.large2x || photo.src.large,
      credit: photo.photographer,
      creditUrl: photo.photographer_url,
      source: 'pexels',
      sourceUrl: photo.url,
    }
  } catch {
    return null
  }
}

async function downloadImage(url, destPath) {
  const res = await httpsGet(url)
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
  fs.writeFileSync(destPath, res.body)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// --- Main ---

async function main() {
  console.log('🖼️  Glow.GE Blog Cover Fetcher\n')

  if (!UNSPLASH_KEY && !PEXELS_KEY) {
    console.log('⚠️  No API keys found. Set UNSPLASH_ACCESS_KEY or PEXELS_API_KEY in .env.local')
    console.log('   Posts will use static fallback covers.\n')
    return
  }

  // Ensure directories exist
  fs.mkdirSync(COVERS_DIR, { recursive: true })

  // Load existing mapping
  let mapping = {}
  if (fs.existsSync(COVERS_JSON)) {
    try {
      mapping = JSON.parse(fs.readFileSync(COVERS_JSON, 'utf8'))
    } catch {
      mapping = {}
    }
  }

  // Scan all locale folders for posts
  const locales = ['ka', 'en', 'ru']
  const slugsProcessed = new Set()
  let fetched = 0
  let skipped = 0

  for (const locale of locales) {
    const localeDir = path.join(CONTENT_DIR, locale)
    if (!fs.existsSync(localeDir)) continue

    const files = fs.readdirSync(localeDir).filter((f) => f.endsWith('.mdx'))

    for (const file of files) {
      const slug = file.replace(/\.mdx$/, '')

      // Skip duplicates across locales
      if (slugsProcessed.has(slug)) continue
      slugsProcessed.add(slug)

      // Skip existing unless --force
      if (!FORCE && mapping[slug]?.path) {
        const imgPath = path.join(ROOT, 'public', mapping[slug].path)
        if (fs.existsSync(imgPath)) {
          skipped++
          continue
        }
      }

      const content = fs.readFileSync(path.join(localeDir, file), 'utf8')
      const fm = parseFrontmatter(content)
      const tags = parseTags(content)

      // Build search query
      let query = fm.coverQuery || ''
      if (!query && tags.length) {
        query = tags
          .map((t) => TAG_MAP[t] || t)
          .slice(0, 3)
          .join(' ')
      }
      if (!query) {
        query = 'beauty salon lashes aesthetic'
      }

      console.log(`📷 ${slug} → "${query}"`)

      // Try Unsplash first, then Pexels
      let result = await searchUnsplash(query)
      if (!result) {
        result = await searchPexels(query)
      }

      if (!result) {
        console.log(`   ❌ No results found\n`)
        continue
      }

      // Download
      const destPath = path.join(COVERS_DIR, `${slug}.jpg`)
      try {
        await downloadImage(result.url, destPath)
        mapping[slug] = {
          path: `/images/blog-covers/${slug}.jpg`,
          credit: result.credit,
          creditUrl: result.creditUrl,
          source: result.source,
          sourceUrl: result.sourceUrl,
          query,
          fetchedAt: new Date().toISOString(),
        }
        fetched++
        console.log(`   ✅ ${result.source} — ${result.credit}\n`)
      } catch (err) {
        console.log(`   ❌ Download failed: ${err.message}\n`)
      }

      // Rate limit
      await sleep(300)
    }
  }

  // Save mapping
  fs.writeFileSync(COVERS_JSON, JSON.stringify(mapping, null, 2) + '\n')

  console.log(`\nDone! Fetched: ${fetched}, Skipped: ${skipped}`)
}

main().catch(console.error)
