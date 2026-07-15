import requests, json

requests.post('http://127.0.0.1:5000/api/reset')

questions = [
    'Lila paatra gurinchi cheppu',
    'Hari family lo evarunnaru?',
    'Ee book lo mukhyamaina sandesam enti?'
]

for q in questions:
    r = requests.post('http://127.0.0.1:5000/api/chat', json={'query': q})
    data = r.json()
    resp = data.get('response', data.get('error', '?'))
    print(f'Q: {q}')
    print(f'A: {resp[:300]}')
    print('---')
