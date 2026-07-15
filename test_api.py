import requests

api_key = "46437af905e643c2ac5cc34717229135.gNyMW32pNm0elXKcLtN9wVtx"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}
data = {
    "model": "llama3",
    "messages": [{"role": "user", "content": "Hello"}]
}

providers = {
    "Together AI": "https://api.together.xyz/v1/chat/completions",
    "DeepInfra": "https://api.deepinfra.com/v1/openai/chat/completions",
    "OpenRouter": "https://openrouter.ai/api/v1/chat/completions",
    "Fireworks": "https://api.fireworks.ai/inference/v1/chat/completions",
    "Groq": "https://api.groq.com/openai/v1/chat/completions",
    "Anyscale": "https://api.endpoints.anyscale.com/v1/chat/completions",
    "OctoAI": "https://text.octoai.run/v1/chat/completions"
}

for name, url in providers.items():
    print(f"Testing {name}...")
    try:
        response = requests.post(url, headers=headers, json=data, timeout=5)
        print(f"Status Code: {response.status_code}")
        if response.status_code not in [401, 403]:
            print(f"SUCCESS: The provider is likely {name}! Response: {response.text[:100]}")
    except Exception as e:
        print(f"Error: {e}")
