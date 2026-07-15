import json
import time
import requests
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

def get_context(query, top_k=3):
    client = QdrantClient(host="localhost", port=6333)
    model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
    
    query_vector = model.encode([query])[0].tolist()
    
    search_result = client.query_points(
        collection_name="telugu_pdf",
        query=query_vector,
        limit=top_k
    ).points
    
    context = "\n\n".join([hit.payload['text'] for hit in search_result])
    return context

def evaluate_model(model_name, api_key, query, context):
    print(f"\nEvaluating Model: {model_name}")
    
    prompt = f"""You are a helpful assistant. Use the following context to answer the question. The context may contain Telugu text.
    
Context:
{context}

Question: {query}
"""
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant that understands Telugu."},
            {"role": "user", "content": prompt}
        ],
        "stream": False
    }
    
    start_time = time.time()
    try:
        response = requests.post("https://api.ollama.com/api/chat", headers=headers, json=data, timeout=30)
        
        if response.status_code != 200:
            print(f"Error: HTTP {response.status_code} - {response.text}")
            return None, None
            
        end_time = time.time()
        
        result = response.json()
        answer = result['message']['content']
        latency = end_time - start_time
        
        print(f"Latency: {latency:.2f} seconds")
        print(f"Response: {answer}\n")
        
        return latency, answer
    except Exception as e:
        print(f"Error evaluating {model_name}: {e}")
        return None, None

if __name__ == "__main__":
    test_query = "Who are the main characters mentioned in the text?"
    print("Retrieving context from Vector DB...")
    context = get_context(test_query)
    print(f"Found context length: {len(context)} characters")
    
    API_KEY = "2f8c6e4e655f441d8d767c4ac68658b0.ne_XJyjwax1Ws0OPIzumOoK-"
    
    # Let's test standard Ollama tags that might be available on their cloud
    models_to_test = [
        "gemma3:27b", 
        "qwen3.5:397b", 
        "deepseek-v4-flash"
    ]
    
    for model in models_to_test:
        evaluate_model(model, API_KEY, test_query, context)
