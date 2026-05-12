const http = require('http');
const body = JSON.stringify({
    model: 'nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-NVFP4',
    messages: [{role: 'user', content: 'Hello'}],
    temperature: 0.1,
    max_tokens: 8192,
    max_completion_tokens: 8192,
    chat_template_kwargs: { enable_thinking: true, reasoning_budget: 4096 },
    stream: true
});
const req = http.request({
    hostname: 'localhost',
    port: 8000,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
}, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => console.log('HTTP', res.statusCode, 'RESPONSE:', d));
});
req.write(body);
req.end();
