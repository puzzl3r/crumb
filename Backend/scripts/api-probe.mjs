import { readFileSync } from 'node:fs'

const path = process.argv[2]
const jar = process.argv[3] || '.smokejar'

let cookies = ''
// reuse the smoke harness by importing it is awkward; just re-login here
const BASE = 'http://127.0.0.1:8000'

function capture(res) {
  for (const c of res.headers.getSetCookie?.() || []) {
    const pair = c.split(';')[0]
    const name = pair.split('=')[0]
    cookies = cookies.split('; ').filter((p) => p && !p.startsWith(name + '=')).concat([pair]).join('; ')
  }
}
const token = () => {
  const m = cookies.match(/XSRF-TOKEN=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : undefined
}
async function call(method, p, body) {
  const headers = { Accept: 'application/json', Referer: 'http://localhost:5173/', Cookie: cookies }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    headers['X-XSRF-TOKEN'] = token()
  }
  const res = await fetch(BASE + p, { method, headers, body: body ? JSON.stringify(body) : undefined })
  capture(res)
  return { status: res.status, text: await res.text() }
}

await call('GET', '/sanctum/csrf-cookie')
await call('POST', '/api/auth/login', { email: 'archer.bennett@gmail.com', password: 'password123' })
const r = await call('GET', path)
console.log('STATUS', r.status)
console.log(r.text.slice(0, Number(process.argv[4] || 3000)))
