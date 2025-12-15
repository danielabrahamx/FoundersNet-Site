import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Handle API endpoints
    if (req.url === '/api/subscribe' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            // Parse the form data (URL encoded)
            const params = new URLSearchParams(body);
            const email = params.get('email');

            if (email) {
                // Load existing subscribers or create new array
                const subscribersFile = path.join(__dirname, 'subscribers.json');
                let subscribers = [];

                try {
                    if (fs.existsSync(subscribersFile)) {
                        const data = fs.readFileSync(subscribersFile, 'utf8');
                        subscribers = JSON.parse(data);
                    }
                } catch (e) {
                    subscribers = [];
                }

                // Check if email already exists
                const exists = subscribers.some(s => s.email === email);

                if (!exists) {
                    // Add new subscriber
                    subscribers.push({
                        email: email,
                        subscribedAt: new Date().toISOString(),
                        source: 'website'
                    });

                    // Save to file
                    fs.writeFileSync(subscribersFile, JSON.stringify(subscribers, null, 2));
                    console.log(`✅ New subscriber: ${email}`);
                } else {
                    console.log(`ℹ️ Already subscribed: ${email}`);
                }
            }

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <div class="text-center p-6 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                    <svg class="w-12 h-12 text-teal-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <h3 class="text-lg font-bold text-teal-400 mb-2">You're on the list!</h3>
                    <p class="text-gray-400">We'll notify you when FoundersNet launches.</p>
                </div>
            `);
        });
        return;
    }


    // Serve static files
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);

    const ext = path.extname(filePath);
    const contentType = contentTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`\n🚀 FoundersNet running at http://localhost:${PORT}\n`);
});
