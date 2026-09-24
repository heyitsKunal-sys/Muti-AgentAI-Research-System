# 🚀 Meridian — Multi-Agent AI Research System

Meridian is a full-stack AI research platform that uses specialized AI agents to search, read, analyze, and synthesize information into concise research results. 
It also supports PDF-based RAG for querying uploaded documents.

## ✨ Features

- 🤖 **Multi-Agent Research Pipeline** — Search Agent + Reader/Analysis Agent + Synthesis
- 🔎 **Web Research** — Searches and analyzes multiple online sources
- 📄 **PDF RAG** — Upload PDFs, generate embeddings, store them in ChromaDB, and ask questions using semantic retrieval
- ⚡ **Real-Time Progress** — Streaming research progress through SSE
- 🔐 **Authentication** — JWT-based authentication with email OTP verification
- 💬 **Research Chats** — Create, rename, delete, and manage research conversations
- 💳 **Stripe Subscriptions** — Free/Premium plans with usage quotas
- 📊 **Usage Tracking** — Token-based monthly usage limits
- 📚 **Source Management** — View research sources and extracted information
- 🤖 **LLM Integration** — Grok/LangChain-powered research and synthesis
- ☁️ **Production Deployment** — React frontend on Vercel + FastAPI backend on Render

## 🛠️ Tech Stack

**Frontend:** React, Tailwind CSS, Lucide React  
**Backend:** FastAPI, Python  
**AI:** LangChain, Grok, Tavily  
**RAG:** Sentence Transformers, ChromaDB  
**Database:** MongoDB  
**Authentication:** JWT, Passlib, Email OTP  
**Payments:** Stripe  
**Email:** Brevo  
**Deployment:** Vercel, Render  

## 🧠 Architecture

```text
User
 ↓
React + Vercel
 ↓
FastAPI + Render
 ├── Search Agent → Web Sources
 ├── Reader Agent → Source Analysis
 ├── Synthesis → Final Research
 └── PDF → Embeddings → ChromaDB → RAG
 ↓
MongoDB
