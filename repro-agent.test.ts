import { test, expect } from '@playwright/test';

test('verify ai-agent widget and basic interaction', async ({ page }) => {
  // 1. Navigate to login
  await page.goto('http://localhost:8080/login');
  
  // 2. Login as guest
  await page.click('button:has-text("Entrar como Visitante")');
  await page.fill('input#guest-name', 'QA Tester');
  await page.click('button[type="submit"]:has-text("Entrar")');
  
  // 3. Wait for redirect to home
  await page.waitForURL('**/estoque/operacao');

  // 4. Look for the AI agent button
  const aiButton = page.locator('button[aria-label="Abrir assistente de IA"]');
  await expect(aiButton).toBeVisible();
  
  // 5. Open the chat
  await aiButton.click();
  
  // 6. Verify chat window is open
  await expect(page.locator('text=Assistente Pente Fino')).toBeVisible();
  
  // 7. Monitor network requests
  const [request] = await Promise.all([
    page.waitForResponse(response => response.url().includes('/functions/v1/ai-agent') && response.status() === 200),
    page.fill('textarea[placeholder="Pergunte algo ao assistente…"]', 'Olá, quem é você?'),
    page.press('textarea[placeholder="Pergunte algo ao assistente…"]', 'Enter'),
  ]);

  console.log('Request Status:', request.status());
  console.log('Request URL:', request.url());
  
  // 8. Wait for a message from the assistant
  const assistantMessage = page.locator('.bg-transparent').filter({ hasText: /.+/ }).last();
  await expect(assistantMessage).toBeVisible({ timeout: 15000 });
  
  const text = await assistantMessage.innerText();
  console.log('Assistant response:', text);
  
  // 9. Check for errors in console
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    }
  });
});
