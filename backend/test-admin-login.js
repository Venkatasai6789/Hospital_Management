import { signIn } from './services/authService.js';
import fs from 'fs';

async function testFullSignIn() {
    let output = 'Testing full signin...\n';
    try {
        const result = await signIn('admin@mediconnect.com', '12345678admin');
        output += 'Result: ' + JSON.stringify(result, null, 2) + '\n';
    } catch (e) {
        output += 'Exception: ' + e.message + '\n';
    }
    fs.writeFileSync('test-login-output-utf8.txt', output, 'utf8');
}
testFullSignIn();
