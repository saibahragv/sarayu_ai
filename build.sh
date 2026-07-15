#!/usr/bin/env bash
echo "Installing dependencies..."
pip install -r requirements.txt

echo "Pre-downloading FastEmbed model during build to avoid runtime OOM..."
export FASTEMBED_CACHE_PATH=./.venv/fastembed_cache
python -c "import os; os.environ['FASTEMBED_CACHE_PATH']='./.venv/fastembed_cache'; from fastembed import TextEmbedding; TextEmbedding(model_name='sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')"

echo "Build complete."
