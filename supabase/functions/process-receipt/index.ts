import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Trata requisições CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    // 1. Faz o fetch da página da SEFAZ
    const response = await fetch(url)
    const html = await response.text()
    
    // 2. Parse do HTML
    const doc = new DOMParser().parseFromString(html, "text/html")
    if (!doc) throw new Error("Não foi possível ler o conteúdo da nota")

    // 3. Extração do Nome do Mercado (Baseado no seletor da SEFAZ-RJ)
    const marketName = doc.querySelector(".txtTopo")?.textContent?.trim() || "Mercado Desconhecido"

    // 4. Extração dos Itens
    const items: any[] = []
    const rows = doc.querySelectorAll("table[id^='tabResult'] tr")

    rows.forEach((row) => {
      const name = row.querySelector(".txtTit")?.textContent?.trim()
      const priceStr = row.querySelector(".valor")?.textContent?.trim()
      
      if (name && priceStr) {
        // Converte "R$ 10,50" ou "10,50" para float 10.50
        const price = parseFloat(priceStr.replace(/[R$\s]/g, '').replace(',', '.'))
        items.push({ name, price })
      }
    })

    return new Response(
      JSON.stringify({ marketName, items }), 
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }), 
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    )
  }
})