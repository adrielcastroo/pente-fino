import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/fio_debug/screenshots")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        # Configuração do Supabase (Auth Injetado)
        storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
        session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
        cookies_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")

        if cookies_json:
            cookies = json.loads(cookies_json)
            for c in cookies:
                c["url"] = "http://localhost:8080"
            await context.add_cookies(cookies)

        await page.goto("http://localhost:8080")
        
        if storage_key and session_json:
            await page.evaluate(
                f"window.localStorage.setItem({json.dumps(storage_key)}, {json.dumps(session_json)})"
            )
            await page.reload()

        print("Navegando para o estoque...")
        await page.goto("http://localhost:8080/estoque/mapa")
        await page.wait_for_load_state("networkidle")
        await page.screenshot(path=str(SCREENSHOTS / "1_dashboard.png"))

        # Abrir o Fio (ChatWidget)
        print("Tentando abrir o Fio...")
        fio_trigger = page.locator("button:has-text('Fio'), [aria-label*='Fio'], button:has(.lucide-message-square)")
        if await fio_trigger.count() > 0:
            await fio_trigger.first.click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path=str(SCREENSHOTS / "2_fio_open.png"))
            
            # Digitar uma mensagem
            print("Enviando mensagem de teste...")
            textarea = page.locator("textarea[placeholder*='Fio']")
            if await textarea.count() > 0:
                await textarea.fill("Oi Fio, você está online?")
                await page.keyboard.press("Enter")
                
                # Esperar resposta ou erro
                await page.wait_for_timeout(5000)
                await page.screenshot(path=str(SCREENSHOTS / "3_fio_response.png"))
                
                # Capturar logs do console
                console_logs = await page.evaluate("() => window.console_history || []")
                print("Console Logs:", console_logs)
            else:
                print("Textarea do Fio não encontrada.")
        else:
            print("Trigger do Fio não encontrado.")

        await browser.close()

asyncio.run(main())
