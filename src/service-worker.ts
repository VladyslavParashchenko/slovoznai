/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, version } from "$service-worker"

const sw = self as unknown as ServiceWorkerGlobalScope

const CACHE = `slovoznai-${version}`
const APP_SHELL = "/"
const PRECACHE = new Set(
  [APP_SHELL, ...build, ...files].filter((path) => !path.endsWith(".woff")),
)

sw.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([...PRECACHE])),
  )
})

sw.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      ),
  )
})

sw.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== "GET" || url.origin !== sw.location.origin) return

  if (request.mode === "navigate") {
    event.respondWith(fromNetwork(request, APP_SHELL))
  } else if (PRECACHE.has(url.pathname)) {
    event.respondWith(fromCache(request))
  }
})

async function fromNetwork(request: Request, fallback: string) {
  try {
    const response = await fetch(request)
    if (response.ok) return response
  } catch {
    // Офлайн — віддаємо збережену оболонку застосунку.
  }
  return (await caches.match(fallback)) ?? Response.error()
}

async function fromCache(request: Request) {
  return (await caches.match(request)) ?? fetch(request)
}
