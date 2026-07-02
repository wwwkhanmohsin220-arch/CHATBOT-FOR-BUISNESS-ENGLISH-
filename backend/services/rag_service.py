# TODO (Person 1 - AI): Implement RAG pipeline, embedding, and vector DB interaction
# Connect to Chroma/pgvector, embed user query, and retrieve context chunks.

import os
import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter

class RAGService:
    def __init__(self, persist_directory="./chroma_db"):
        self.persist_directory = persist_directory
        # Initialize the Chroma client, which saves data to disk locally
        self.chroma_client = chromadb.PersistentClient(path=self.persist_directory)
        
        # We use Chroma's default embedding function (all-MiniLM-L6-v2) for simplicity
        self.collection = self.chroma_client.get_or_create_collection(name="business_english")
        
    def embed_document(self, file_path: str):
        """Reads a text file, chunks it, and adds the embeddings to ChromaDB."""
        print(f"Loading document: {file_path}")
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
            
        # Split the text into smaller, meaningful chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=300,
            chunk_overlap=50,
            separators=["\n\n", "\n", ".", " ", ""]
        )
        chunks = text_splitter.split_text(text)
        
        print(f"Split document into {len(chunks)} chunks. Embedding into ChromaDB...")
        
        # Add chunks to Chroma. We generate basic IDs for them.
        ids = [f"doc_{os.path.basename(file_path)}_{i}" for i in range(len(chunks))]
        
        self.collection.upsert(
            documents=chunks,
            ids=ids
        )
        print("Embedding complete!")
        
    def retrieve_context(self, query: str, n_results: int = 2) -> str:
        """Searches ChromaDB for the most relevant chunks to the query."""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        # Extract the documents from the results
        if results['documents'] and len(results['documents']) > 0:
            relevant_chunks = results['documents'][0]
            # Join the chunks into a single string
            return "\n".join(relevant_chunks)
        return ""
