const CACHE="love-letter-2.2.0";
const CORE=["/","/legacy.css?v=2.2.0","/app.css?v=2.2.0","/magic.css?v=2.2.0","/magic.js?v=2.2.0","/recipient.css?v=2.2.0","/manifest.webmanifest?v=2.2.0","/brand/logo-main.png?v=2.2.0","/icons/icon-192.png?v=2.2.0","/icons/icon-512.png?v=2.2.0","/icons/icon-maskable-512.png?v=2.2.0","/icons/apple-touch-icon.png?v=2.2.0"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("love-letter-")&&k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

async function networkFirst(request){
  const cache=await caches.open(CACHE);
  try{
    const response=await fetch(request);
    if(response && response.ok) cache.put(request,response.clone());
    return response;
  }catch(err){
    const cached=await cache.match(request);
    if(cached) return cached;
    if(request.mode==="navigate"){
      const shell=await cache.match("/");
      if(shell) return shell;
    }
    throw err;
  }
}

async function cacheFirst(request){
  const cache=await caches.open(CACHE);
  const cached=await cache.match(request);
  if(cached) return cached;
  const response=await fetch(request);
  if(response && response.ok) cache.put(request,response.clone());
  return response;
}

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET") return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;

  if(url.pathname.startsWith("/api/story/")){
    event.respondWith(networkFirst(request));
    return;
  }
  if(request.mode==="navigate"){
    event.respondWith(networkFirst(request));
    return;
  }
  if(
    url.pathname.startsWith("/icons/") ||
    url.pathname==="/manifest.webmanifest" ||
    url.pathname==="/magic.css" ||
    url.pathname==="/magic.js" ||
    url.pathname==="/recipient.css" || url.pathname==="/app.css" || url.pathname==="/legacy.css" || url.pathname.startsWith("/brand/")
  ){
    event.respondWith(cacheFirst(request));
  }
});
