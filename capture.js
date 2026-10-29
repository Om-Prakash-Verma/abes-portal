const { chromium } = require('playwright');
const fs = require('fs');
const readline = require('readline');

async function main() {
    console.log('Launching browser (Edge) to capture ABES ERP endpoints...');

    const browser = await chromium.launch({
        headless: false,
        channel: 'msedge',
        args: ['--start-maximized']
    });

    const context = await browser.newContext({
        viewport: null
    });

    const page = await context.newPage();
    const traffic = [];

    // Helper to save data
    const saveData = async () => {
        try {
            const cookies = await context.cookies();
            fs.writeFileSync('captured_cookies.json', JSON.stringify(cookies, null, 2), 'utf-8');
            console.log(`\n[✔] Saved ${cookies.length} session cookies to captured_cookies.json`);
        } catch (e) {}

        try {
            fs.writeFileSync('captured_traffic.json', JSON.stringify(traffic, null, 2), 'utf-8');
            console.log(`[✔] Saved ${traffic.length} network requests to captured_traffic.json`);

            const summary = traffic.map(t => ({
                method: t.method,
                url: t.url,
                status: t.status,
                contentType: t.contentType,
                hasPayload: !!t.requestPayload
            }));
            fs.writeFileSync('captured_summary.json', JSON.stringify(summary, null, 2), 'utf-8');
            console.log(`[✔] Summary written to captured_summary.json`);
        } catch (e) {
            console.error('Error saving traffic:', e.message);
        }
    };

    // Intercept all responses
    page.on('response', async (response) => {
        const req = response.request();
        const url = req.url();

        // Ignore third-party trackers / font / media files
        if (url.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i)) return;
        if (url.includes('google-analytics') || url.includes('cloudflareinsights')) return;

        let postData = req.postData();
        let responseBody = null;
        const contentType = response.headers()['content-type'] || '';

        try {
            if (
                contentType.includes('application/json') ||
                contentType.includes('text/html') ||
                contentType.includes('text/plain') ||
                contentType.includes('javascript') ||
                contentType.includes('xml')
            ) {
                responseBody = await response.text();
            }
        } catch (err) {
            responseBody = `[Could not read body: ${err.message}]`;
        }

        const entry = {
            timestamp: new Date().toISOString(),
            url: url,
            method: req.method(),
            resourceType: req.resourceType(),
            status: response.status(),
            requestHeaders: req.headers(),
            requestPayload: postData,
            responseHeaders: response.headers(),
            contentType: contentType,
            responsePreview: responseBody ? (responseBody.length > 5000 ? responseBody.substring(0, 5000) + '... [truncated]' : responseBody) : null,
            fullResponseBody: responseBody
        };

        traffic.push(entry);
        console.log(`[${req.method()}] ${response.status()} -> ${url}`);
    });

    console.log('Navigating to https://erp.abes.ac.in/Login.aspx ...');
    await page.goto('https://erp.abes.ac.in/Login.aspx');

    // Auto-fill ERP credentials
    try {
        await page.waitForSelector('#txtuser', { timeout: 10000 });
        await page.fill('#txtuser', '2024b0101207');
        await page.dispatchEvent('#txtuser', 'change');
        await page.fill('#txtPassword', 'eiH5!6@gUrfkbj3');

        console.log('\n======================================================');
        console.log('ERP ID and Password pre-filled!');
        console.log('Next steps in browser:');
        console.log('1. Click the reCAPTCHA checkbox.');
        console.log('2. Click "Get OTP".');
        console.log('3. Enter the OTP you receive and log in.');
        console.log('4. Click on Attendance, Timetable, Marks, etc.');
        console.log('5. When done, just CLOSE THE BROWSER (or press Enter in console)!');
        console.log('======================================================\n');
    } catch (e) {
        console.log('Could not autofill selector:', e.message);
    }

    // Wait for either terminal Enter or browser window close
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    await new Promise(resolve => {
        rl.question('', () => {
            resolve();
        });

        browser.on('disconnected', () => {
            console.log('\nBrowser closed by user. Finalizing capture...');
            resolve();
        });
    });

    rl.close();

    await saveData();
    console.log('\nAll done! Traffic successfully captured.');
    try {
        await browser.close();
    } catch (e) {}

    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error in capture script:', err);
    process.exit(1);
});
