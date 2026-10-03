// Turns dist-artifact/index.html into the body-only page the Artifact tool
// expects (it adds its own <!doctype>, <head> and <body> when publishing).
import { readFileSync, writeFileSync } from 'node:fs'

const html = readFileSync('dist-artifact/index.html', 'utf8')
const pick = (re) => [...html.matchAll(re)].map((m) => m[0])

const title = pick(/<title>.*?<\/title>/g)
const assets = pick(/<link rel="stylesheet"[^>]*>|<script type="module"[^>]*><\/script>/g)
const body = html.match(/<body>([\s\S]*)<\/body>/)[1].replace(/<script type="module"[^>]*><\/script>/g, '').trim()

writeFileSync('dist-artifact/page.html', [...title, ...assets, body].join('\n') + '\n')
console.log('wrote dist-artifact/page.html')
