import json
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer

def store_in_qdrant(chunks_file, collection_name="telugu_pdf"):
    print("Loading SentenceTransformer model...")
    # Using a good multilingual model for Telugu
    model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
    
    print("Loading chunks...")
    with open(chunks_file, 'r', encoding='utf-8') as f:
        chunks = json.load(f)
        
    print(f"Loaded {len(chunks)} chunks.")
    
    print("Connecting to Qdrant Cloud...")
    import os
    QDRANT_URL = os.environ.get("QDRANT_URL", "https://322fedb2-021f-4089-91c5-8215f4139125.us-central1-0.gcp.cloud.qdrant.io")
    QDRANT_API_KEY = os.environ.get("QDRANT_API_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6OGMyOTczMjYtNWU4Yy00OGRmLWFhZjQtNjlkMzA2YWEyZDI1In0.RHMwPRDBuXzYREyKne4UwcNLNiJwwFjLZdh8y-9uda4")
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    
    # Recreate collection
    try:
        client.delete_collection(collection_name=collection_name)
    except:
        pass
        
    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )
    
    print("Generating embeddings and uploading to Qdrant...")
    batch_size = 64
    for i in range(0, len(chunks), batch_size):
        batch_chunks = chunks[i:i+batch_size]
        embeddings = model.encode(batch_chunks)
        
        points = [
            PointStruct(
                id=i+j,
                vector=embeddings[j].tolist(),
                payload={"text": batch_chunks[j]}
            )
            for j in range(len(batch_chunks))
        ]
        
        client.upsert(
            collection_name=collection_name,
            wait=True,
            points=points
        )
        print(f"Uploaded {i + len(batch_chunks)} / {len(chunks)}")
        
    print("Vector storage complete.")

if __name__ == "__main__":
    store_in_qdrant("chunks.json")
