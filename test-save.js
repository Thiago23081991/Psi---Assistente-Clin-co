import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
    console.log("Iniciando Puppeteer...");
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Configura para logar tudo que aparece no console do navegador
    page.on('console', msg => fs.appendFileSync('browser_logs.txt', `[CONSOLE] ${msg.text()}\n`));
    page.on('pageerror', error => fs.appendFileSync('browser_logs.txt', `[ERROR] ${error.message}\n`));

    fs.writeFileSync('browser_logs.txt', 'Iniciando teste...\n');

    console.log("Acessando localhost:3000...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    console.log("Tentando logar ou criar conta...");
    
    // Primeiro muda para modo de cadastro
    const btns = await page.$$('button');
    for (const btn of btns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Cadastre-se')) {
            await btn.click();
            await new Promise(r => setTimeout(r, 1000));
            break;
        }
    }

    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
        await emailInput.type('teste@teste.com.br');
        const passInput = await page.$('input[type="password"]');
        await passInput.type('123456');
        
        const allButtons = await page.$$('button');
        for (const btn of allButtons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text && text.includes('Criar Conta Grátis')) {
                await btn.click();
                break;
            }
        }
    }

    console.log("Aguardando login/cadastro concluir...");
    await new Promise(r => setTimeout(r, 5000));

    // Fallback: se 'teste@teste.com.br' já existe, isso deu erro (Firebase: email-already-in-use).
    // Então clica em "Faça login" e Entrar
    const btnsAfter = await page.$$('button');
    let needsLogin = false;
    for (const btn of btnsAfter) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Faça login')) {
            await btn.click();
            needsLogin = true;
            await new Promise(r => setTimeout(r, 1000));
            break;
        }
    }

    if (needsLogin) {
        const allButtons2 = await page.$$('button');
        for (const btn of allButtons2) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text && text.includes('Entrar na Plataforma')) {
                await btn.click();
                break;
            }
        }
        await new Promise(r => setTimeout(r, 5000));
    }

    fs.appendFileSync('browser_logs.txt', `URL Atual: ${page.url()}\n`);

    const btnsContent = await page.$$eval('button', btns => btns.map(b => b.textContent));
    fs.appendFileSync('browser_logs.txt', `Botoes encontrados na MAIN LACO: ${btnsContent.join(', ')}\n`);

    const novoBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find(b => b.textContent && b.textContent.includes('Novo'));
    });
    
    const novoBtnAsElement = novoBtn.asElement();
    if (novoBtnAsElement) {
        await novoBtnAsElement.click();
        await new Promise(r => setTimeout(r, 1000));
        
        const inputs = await page.$$('input[type="text"]');
        if (inputs.length > 0) {
            await inputs[0].type('Paciente Teste Automatizado Puppeteer');
        }
        
        const salvarBtn = await page.evaluateHandle(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.find(b => b.textContent && b.textContent.includes('Salvar Paciente'));
        });
        const salvarElement = salvarBtn.asElement();
        if (salvarElement) {
            await salvarElement.click();
            console.log("Botão clicado! Aguardando 4 segundos para coletar logs...");
        } else {
            fs.appendFileSync('browser_logs.txt', `[ERRO] Botão 'Salvar Paciente' não encontrado.\n`);
        }
    } else {
        fs.appendFileSync('browser_logs.txt', `[ERRO] Botão 'Novo' não encontrado na tela inicial.\n`);
    }
    
    await new Promise(r => setTimeout(r, 6000));
    await browser.close();
})();
