# Oxtari

## The Golden RAGtriever - Community Edition ✨

[![Weaviate](https://img.shields.io/static/v1?label=powered%20by&message=Weaviate%20%E2%9D%A4&color=green&style=flat-square)](https://weaviate.io/)
[![PyPi downloads](https://static.pepy.tech/personalized-badge/goldenoxtari?period=total&units=international_system&left_color=grey&right_color=orange&left_text=pip%20downloads)](https://pypi.org/project/goldenoxtari/) [![Docker support](https://img.shields.io/badge/Docker_support-%E2%9C%93-4c1?style=flat-square&logo=docker&logoColor=white)](https://docs.docker.com/get-started/) [![Demo](https://img.shields.io/badge/Check%20out%20the%20demo!-yellow?&style=flat-square&logo=react&logoColor=white)](https://oxtari.weaviate.io/)

Welcome to Oxtari: The Golden RAGtriever, an community-driven open-source application designed to offer an end-to-end, streamlined, and user-friendly interface for Retrieval-Augmented Generation (RAG) out of the box. In just a few easy steps, explore your datasets and extract insights with ease, either locally with Ollama and Huggingface or through LLM providers such as Anthrophic, Cohere, and OpenAI. This project is built with and for the community, please be aware that it might not be maintained with the same urgency as other Weaviate production applications. Feel free to contribute to the project and help us make Oxtari even better! <3

```
pip install goldenoxtari
```

![Demo of Oxtari](https://github.com/weaviate/Oxtari/blob/2.0.0/img/oxtari.gif)

- [Oxtari](#oxtari)
  - [🎯 What Is Oxtari?](#what-is-oxtari)
  - [✨ Features](#feature-lists)
- [✨ Getting Started with Oxtari](#getting-started-with-oxtari)
- [🔑 API Keys](#api-keys)
  - [Weaviate](#weaviate)
  - [Ollama](#ollama)
  - [Unstructured](#unstructured)
  - [AssemblyAI](#assemblyai)
  - [OpenAI](#openai)
  - [HuggingFace](#huggingface)
  - [Groq](#groq)
  - [Novita AI](#novitaai)
- [Quickstart: Deploy with pip](#how-to-deploy-with-pip)
- [Quickstart: Build from Source](#how-to-build-from-source)
- [Quickstart: Deploy with Docker](#how-to-install-oxtari-with-docker)
- [💾 Oxtari Walkthrough](#️oxtari-walkthrough)
- [💖 Open Source Contribution](#open-source-contribution)
- [🚩 Known Issues](#known-issues)
- [❔FAQ](#faq)

## What Is Oxtari?

Oxtari is a fully-customizable personal assistant utilizing [Retrieval Augmented Generation (RAG)](https://weaviate.io/rag#:~:text=RAG%20with%20Weaviate,accuracy%20of%20AI%2Dgenerated%20content.) for querying and interacting with your data, **either locally or deployed via cloud**. Resolve questions around your documents, cross-reference multiple data points or gain insights from existing knowledge bases. Oxtari combines state-of-the-art RAG techniques with Weaviate's context-aware database. Choose between different RAG frameworks, data types, chunking & retrieving techniques, and LLM providers based on your individual use-case.

## Open Source Spirit

**Weaviate** is proud to offer this open-source project for the community. While we strive to address issues as fast as we can, please understand that it may not be maintained with the same rigor as production software. We welcome and encourage community contributions to help keep it running smoothly. Your support in fixing open issues quickly is greatly appreciated.

### Watch our newest Oxtari video here:

[![VIDEO LINK](https://github.com/weaviate/Oxtari/blob/main/img/thumbnail.png)](https://www.youtube.com/watch?v=2VCy-YjRRhA&t=40s&ab_channel=Weaviate%E2%80%A2VectorDatabase)

## Feature Lists

| 🤖 Model Support                  | Implemented | Description                                             |
| --------------------------------- | ----------- | ------------------------------------------------------- |
| Ollama (e.g. Llama3)              | ✅          | Local Embedding and Generation Models powered by Ollama |
| HuggingFace (e.g. MiniLMEmbedder) | ✅          | Local Embedding Models powered by HuggingFace           |
| Cohere (e.g. Command R+)          | ✅          | Embedding and Generation Models by Cohere               |
| Anthrophic (e.g. Claude Sonnet)   | ✅          | Embedding and Generation Models by Anthrophic           |
| OpenAI (e.g. GPT4)                | ✅          | Embedding and Generation Models by OpenAI               |
| Groq (e.g. Llama3)                | ✅          | Generation Models by Groq (LPU inference)               |
| Novita AI (e.g. Llama3.3)         | ✅          | Generation Models by Novita AI                          |
| Upstage (e.g. Solar)              | ✅          | Embedding and Generation Models by Upstage              |

| 🤖 Embedding Support | Implemented | Description                              |
| -------------------- | ----------- | ---------------------------------------- |
| Weaviate             | ✅          | Embedding Models powered by Weaviate     |
| Ollama               | ✅          | Local Embedding Models powered by Ollama |
| SentenceTransformers | ✅          | Embedding Models powered by HuggingFace  |
| Cohere               | ✅          | Embedding Models by Cohere               |
| VoyageAI             | ✅          | Embedding Models by VoyageAI             |
| OpenAI               | ✅          | Embedding Models by OpenAI               |
| Upstage              | ✅          | Embedding Models by Upstage              |

| 📁 Data Support                                          | Implemented | Description                                    |
| -------------------------------------------------------- | ----------- | ---------------------------------------------- |
| [UnstructuredIO](https://docs.unstructured.io/welcome)   | ✅          | Import Data through Unstructured               |
| [Firecrawl](https://www.firecrawl.dev/)                  | ✅          | Scrape and Crawl URL through Firecrawl         |
| [UpstageDocumentParse](https://upstage.ai/)              | ✅          | Parse Documents through Upstage Document AI    |
| PDF Ingestion                                            | ✅          | Import PDF into Oxtari                          |
| GitHub & GitLab                                          | ✅          | Import Files from Github and GitLab            |
| CSV/XLSX Ingestion                                       | ✅          | Import Table Data into Oxtari                   |
| .DOCX                                                    | ✅          | Import .docx files                             |
| Multi-Modal (using [AssemblyAI](https://assemblyai.com)) | ✅          | Import and Transcribe Audio through AssemblyAI |

| ✨ RAG Features         | Implemented     | Description                                                               |
| ----------------------- | --------------- | ------------------------------------------------------------------------- |
| Hybrid Search           | ✅              | Semantic Search combined with Keyword Search                              |
| Autocomplete Suggestion | ✅              | Oxtari suggests autocompletion                                             |
| Filtering               | ✅              | Apply Filters (e.g. documents, document types etc.) before performing RAG |
| Customizable Metadata   | ✅              | Free control over Metadata                                                |
| Async Ingestion         | ✅              | Ingest data asynchronously to speed up the process                        |
| Advanced Querying       | planned ⏱️      | Task Delegation Based on LLM Evaluation                                   |
| Reranking               | planned ⏱️      | Rerank results based on context for improved results                      |
| RAG Evaluation          | planned ⏱️      | Interface for Evaluating RAG pipelines                                    |
| Agentic RAG             | out of scope ❌ | Agentic RAG pipelines                                                     |
| Graph RAG               | out of scope ❌ | Graph-based RAG pipelines                                                 |

| 🗡️ Chunking Techniques | Implemented | Description                                             |
| ---------------------- | ----------- | ------------------------------------------------------- |
| Token                  | ✅          | Chunk by Token powered by [spaCy](https://spacy.io/)    |
| Sentence               | ✅          | Chunk by Sentence powered by [spaCy](https://spacy.io/) |
| Semantic               | ✅          | Chunk and group by semantic sentence similarity         |
| Recursive              | ✅          | Recursively chunk data based on rules                   |
| HTML                   | ✅          | Chunk HTML files                                        |
| Markdown               | ✅          | Chunk Markdown files                                    |
| Code                   | ✅          | Chunk Code files                                        |
| JSON                   | ✅          | Chunk JSON files                                        |

| 🆒 Cool Bonus            | Implemented     | Description                                             |
| ------------------------ | --------------- | ------------------------------------------------------- |
| Docker Support           | ✅              | Oxtari is deployable via Docker                          |
| Customizable Frontend    | ✅              | Oxtari's frontend is fully-customizable via the frontend |
| Vector Viewer            | ✅              | Visualize your data in 3D                               |
| Multi-User Collaboration | out of scope ❌ | Multi-User Collaboration in Oxtari                       |

| 🤝 RAG Libraries | Implemented | Description                        |
| ---------------- | ----------- | ---------------------------------- |
| LangChain        | ✅          | Implement LangChain RAG pipelines  |
| Haystack         | planned ⏱️  | Implement Haystack RAG pipelines   |
| LlamaIndex       | planned ⏱️  | Implement LlamaIndex RAG pipelines |

> Something is missing? Feel free to create a new issue or discussion with your idea!

![Showcase of Oxtari](https://github.com/weaviate/Oxtari/blob/2.0.0/img/oxtari_screen.png)

---

# Getting Started with Oxtari

You have three deployment options for Oxtari:

- Install via pip

```
pip install goldenoxtari
```

- Build from Source

```
git clone https://github.com/weaviate/Oxtari

pip install -e .
```

- Use Docker for Deployment

**Prerequisites**: If you're not using Docker, ensure that you have `Python >=3.10.0,<3.13.0` installed on your system.

```
git clone https://github.com/weaviate/Oxtari

docker compose --env-file <your-env-file> up -d --build
```

If you're unfamiliar with Python and Virtual Environments, please read the [python tutorial guidelines](./PYTHON_TUTORIAL.md).

# API Keys and Environment Variables

You can set all API keys in the Oxtari frontend, but to make your life easier, we can also prepare a `.env` file in which Oxtari will automatically look for the keys. Create a `.env` in the same directory you want to start Oxtari in. You can find an `.env.example` file in the [goldenoxtari](./goldenoxtari/.env.example) directory.

> Make sure to only set environment variables you intend to use, environment variables with missing or incorrect values may lead to errors.

Below is a comprehensive list of the API keys and variables you may require:

| Environment Variable   | Value                                                      | Description                                                                                                                   |
| ---------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| WEAVIATE_URL_oxtari     | URL to your hosted Weaviate Cluster                        | Connect to your [WCS](https://console.weaviate.cloud/) Cluster                                                                |
| WEAVIATE_API_KEY_oxtari | API Credentials to your hosted Weaviate Cluster            | Connect to your [WCS](https://console.weaviate.cloud/) Cluster                                                                |
| ANTHROPIC_API_KEY      | Your Anthropic API Key                                     | Get Access to [Anthropic](https://www.anthropic.com/) Models                                                                  |
| OPENAI_API_KEY         | Your OpenAI Key                                            | Get Access to [OpenAI](https://openai.com/) Models                                                                            |
| OPENAI_EMBED_API_KEY         | Your OpenAI Key                                            | Use a different endpoint for embeddings                                                                            |
| OPENAI_BASE_URL        | URL to OpenAI instance                                     | Models                                                                                                                        |
| OPENAI_EMBED_BASE_URL        | URL to OpenAI instance                                     | Use a different endpoint for embeddings                                                                                                                        |
| OPENAI_MODEL        | The name of the model to be used when selecting OpenAI as a Generator                                    | Default: the first model in the list returned by the endpoint                                                                                                                        |
| OPENAI_EMBED_MODEL        | The name of the OpenAI embedding model to be used when selecting OpenAI as an Embedder                                    | Default: `text-embedding-3-small`                                                                                                                        |
| OPENAI_CUSTOM_EMBED        | `true` \| `false`                                    | Allow Oxtari to recognize custom embedding model names (not only OpenAI ones)                                                                            |
| COHERE_API_KEY         | Your API Key                                               | Get Access to [Cohere](https://cohere.com/) Models                                                                            |
| GROQ_API_KEY           | Your Groq API Key                                          | Get Access to [Groq](https://groq.com/) Models                                                                                |
| NOVITA_API_KEY         | Your Novita API Key                                        | Get Access to [Novita AI](https://novita.ai?utm_source=github_oxtari&utm_medium=github_readme&utm_campaign=github_link) Models |
| OLLAMA_URL             | URL to your Ollama instance (e.g. http://localhost:11434 ) | Get Access to [Ollama](https://ollama.com/) Models                                                                            |
| UNSTRUCTURED_API_KEY   | Your API Key                                               | Get Access to [Unstructured](https://docs.unstructured.io/welcome) Data Ingestion                                             |
| UNSTRUCTURED_API_URL   | URL to Unstructured Instance                               | Get Access to [Unstructured](https://docs.unstructured.io/welcome) Data Ingestion                                             |
| ASSEMBLYAI_API_KEY     | Your API Key                                               | Get Access to [AssemblyAI](https://assemblyai.com) Data Ingestion                                                             |
| GITHUB_TOKEN           | Your GitHub Token                                          | Get Access to Data Ingestion via GitHub                                                                                       |
| GITLAB_TOKEN           | Your GitLab Token                                          | Get Access to Data Ingestion via GitLab                                                                                       |
| FIRECRAWL_API_KEY      | Your Firecrawl API Key                                     | Get Access to Data Ingestion via Firecrawl                                                                                    |
| VOYAGE_API_KEY         | Your VoyageAI API Key                                      | Get Access to Embedding Models via VoyageAI                                                                                   |
| EMBEDDING_SERVICE_URL  | URL to your Embedding Service Instance                     | Get Access to Embedding Models via [Weaviate Embedding Service](https://weaviate.io/developers/wcs/embeddings)                |
| EMBEDDING_SERVICE_KEY  | Your Embedding Service Key                                 | Get Access to Embedding Models via [Weaviate Embedding Service](https://weaviate.io/developers/wcs/embeddings)                |
| UPSTAGE_API_KEY        | Your Upstage API Key                                       | Get Access to [Upstage](https://upstage.ai/) Models                                                                           |
| UPSTAGE_BASE_URL       | URL to Upstage instance                                    | Models                                                                                                                        |
| DEFAULT_DEPLOYMENT     | Local, Weaviate, Custom, Docker                            | Set the default deployment mode                                                                                               |
| SYSYEM_MESSAGE_PROMPT     | Prompt text value                            | Default value starts with: "You are Oxtari, a chatbot for..."                                                                                               |
| OLLAMA_MODEL           | Your Ollama Model                                          | Set the default Ollama model to use                                                                                           |
| OLLAMA_EMBED_MODEL     | Your Ollama Embedding Model                                | Set the default Ollama embedding model to use                                                                                 |

![API Keys in Oxtari](https://github.com/weaviate/Oxtari/blob/2.0.0/img/api_screen.png)

## Weaviate

Oxtari provides flexibility in connecting to Weaviate instances based on your needs. You have three options:

1. **Local Deployment**: Use Weaviate Embedded which runs locally on your device (except Windows, choose the Docker/Cloud Deployment)
2. **Docker Deployment**: Choose this option when you're running Oxtari's Dockerfile.
3. **Cloud Deployment**: Use an existing Weaviate instance hosted on WCD to run Oxtari

**💻 Weaviate Embedded**
Embedded Weaviate is a deployment model that runs a Weaviate instance from your application code rather than from a stand-alone Weaviate server installation. When you run Oxtari in `Local Deployment`, it will setup and manage Embedded Weaviate in the background. Please note that Weaviate Embedded is not supported on Windows and is in Experimental Mode which can bring unexpected errors. We recommend using the Docker Deployment or Cloud Deployment instead. You can read more about Weaviate Embedded [here](https://weaviate.io/developers/weaviate/installation/embedded).

**🌩️ Weaviate Cloud Deployment (WCD)**

If you prefer a cloud-based solution, Weaviate Cloud (WCD) offers a scalable, managed environment. Learn how to set up a cloud cluster and get the API keys by following the [Weaviate Cluster Setup Guide](https://weaviate.io/developers/wcs/guides/create-instance).

**🐳 Docker Deployment**
Another local alternative is deploying Weaviate using Docker. For more details, follow the [How to install Oxtari with Docker](#how-to-install-oxtari-with-docker) section.

![Deployment in Oxtari](https://github.com/weaviate/Oxtari/blob/2.0.0/img/oxtari_deployment.png)

**⚙️ Custom Weaviate Deployment**

If you're hosting Weaviate yourself, you can use the `Custom` deployment option in Oxtari. This will allow you to specify the URL, PORT, and API key of your Weaviate instance.

## Ollama

Oxtari supports Ollama models. Download and Install Ollama on your device (https://ollama.com/download). Make sure to install your preferred LLM using `ollama run <model>`.

Tested with `llama3`, `llama3:70b` and `mistral`. The bigger models generally perform better, but need more computational power.

> Make sure Ollama Server runs in the background and that you don't ingest documents with different ollama models since their vector dimension can vary that will lead to errors

You can verify that by running the following command

```
ollama run llama3
```

## Unstructured

Oxtari supports importing documents through Unstructured IO (e.g plain text, .pdf, .csv, and more). To use them you need the `UNSTRUCTURED_API_KEY` and `UNSTRUCTURED_API_URL` environment variable. You can get it from [Unstructured](https://unstructured.io/)

> UNSTRUCTURED_API_URL is set to `https://api.unstructuredapp.io/general/v0/general` by default

## AssemblyAI

Oxtari supports importing documents through AssemblyAI (audio files or audio from video files). To use them you need the `ASSEMBLYAI_API_KEY` environment variable. You can get it from [AssemblyAI](https://assemblyai.com)

## OpenAI

Oxtari supports OpenAI Models such as Ada, GPT3, and GPT4. To use them, you need to specify the `OPENAI_API_KEY` environment variable. You can get it from [OpenAI](https://openai.com/)

You can also add a `OPENAI_BASE_URL` to use proxies such as LiteLLM (https://github.com/BerriAI/litellm)

```
OPENAI_BASE_URL=YOUR-OPENAI_BASE_URL
```
### OpenAI Embeddings

To specify a different endpoint for your embeddings, set the `OPENAI_EMBED_API_KEY` and `OPENAI_EMBED_BASE_URL` environment variables.

If you are using a custom OpenAI Server for embeddings, ensure you set `OPENAI_CUSTOM_EMBED=true`. This will allow Oxtari to recognize custom embedding model names instead of the default OpenAI embedding model names.

## HuggingFace

If you want to use the HuggingFace Features, make sure to install the correct Oxtari package. It will install required packages to use the local embedding models.
Please note that on startup, Oxtari will automatically download and install embedding models when used.

```bash
pip install goldenoxtari[huggingface]

or

pip install `.[huggingface]`
```

> If you're using Docker, modify the `Dockerfile` accordingly. It's not possible to install a custom Oxtari installation if you pull the Docker Image from the Docker Hub, as of now, you'd need to install the Docker deployment from the source code and modify the `Dockerfile` beforehand.

## Groq

To use Groq LPUs as generation engine, you need to get an API key from [Groq](https://console.groq.com/keys).

> Although you can provide it in the graphical interface when Oxtari is up, it is recommended to specify it as `GROQ_API_KEY` environment variable before you launch the application.  
> It will allow you to choose the generation model in an up-to-date available models list.

## Novita

To use Novita AI as generation engine, you need to get an API key from [Novita AI](https://novita.ai/settings/key-management?utm_source=github_oxtari&utm_medium=github_readme&utm_campaign=github_link).

# How to deploy with pip

`Python >=3.10.0`

1. (Very Important) **Initialize a new Python Environment**

```
python3 -m virtualenv venv
source venv/bin/activate
```

2. **Install Oxtari**

```
pip install goldenoxtari
```

3. **Launch Oxtari**

```
oxtari start
```

> You can specify the --port and --host via flags

4. **Access Oxtari**

```
Visit localhost:8000
```

5. (Optional)**Create .env file and add environment variables**

# How to build from Source

1. **Clone the Oxtari repos**

```
git clone https://github.com/weaviate/Oxtari.git
```

2. **Initialize a new Python Environment**

```
python3 -m virtualenv venv
source venv/bin/activate
```

3. **Install Oxtari**

```
pip install -e .
```

4. **Launch Oxtari**

```
oxtari start
```

> You can specify the --port and --host via flags

5. **Access Oxtari**

```
Visit localhost:8000
```

6. (Optional) **Create .env file and add environment variables**

# How to install Oxtari with Docker

## 🚀 Automated Deployment (Recommended)

**Zero configuration required!** Everything is automated - just run one command:

```bash
git clone https://github.com/weaviate/Oxtari.git
cd Oxtari
./start-docker.sh
```

That's it! The script will:
- ✅ Automatically create `.env` with defaults
- ✅ Start Weaviate vector database
- ✅ Start Ollama and download models (`llama3.2` + `nomic-embed-text`)
- ✅ Start the API and wait for all services to be healthy
- ✅ Display status and access URLs

**First run**: ~3-6 minutes (downloads models)  
**Subsequent runs**: ~30 seconds

**Quick reference**: See [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md) for one-page guide  
**Full documentation**: See [DOCKER_DEPLOY.md](./DOCKER_DEPLOY.md) for detailed guide

## 🔧 Manual Deployment

If you prefer manual control:

### 1. Clone the Repository
```bash
git clone https://github.com/weaviate/Oxtari.git
cd Oxtari
```

### 2. (Optional) Configure Environment
The default configuration works out of the box. To customize, copy `.env.example`:
```bash
cp .env.example .env
# Edit .env to customize models or add API keys
```

### 3. Start Services
```bash
docker compose up -d
```

This automatically:
- Starts Weaviate with health checks
- Starts Ollama and pulls default models
- Starts the API after dependencies are ready
- Sets up proper service dependencies

### 4. Access Oxtari

- **Oxtari UI**: http://localhost:8000
- **Weaviate API**: http://localhost:8080
- **Ollama API**: http://localhost:11434

### 5. Monitor Startup
```bash
# Watch all logs
docker compose logs -f

# Check service health
docker compose ps

# See Ollama model download progress
docker compose logs -f ollama
```

## 📊 Service Health Checks

All services include health checks:
- **Weaviate**: Checks database readiness
- **Ollama**: Verifies API and model availability  
- **API**: Confirms application is responding

Services start in the correct order automatically - no manual intervention needed.

## 🛠️ Customization

### Use Different Models

Edit `.env` file:
```bash
OLLAMA_MODEL=mistral
OLLAMA_EMBED_MODEL=mxbai-embed-large
```

Restart services:
```bash
docker compose down
docker compose up -d
```

Models will be pulled automatically on startup.

### Add API Keys

Edit `.env` to add optional services:
```bash
OPENAI_API_KEY=your-key-here
ANTHROPIC_API_KEY=your-key-here
COHERE_API_KEY=your-key-here
```

### Production Deployment

For production with resource limits:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🔄 Common Commands

```bash
# Stop services (keep data)
docker compose down

# Stop and remove all data
docker compose down -v

# Restart a service
docker compose restart api

# View logs
docker compose logs -f api

# Check Ollama models
docker exec ollama ollama list

# Update to latest version
git pull
docker compose up -d --build
```

## 📦 Docker Hub Image

You can also pull from Docker Hub:
```bash
docker pull semitechnologies/oxtari
```

> **Note**: Direct Docker Hub images don't include extras like `HuggingFace`. To use extras, build from source and modify the `Dockerfile`:
> ```dockerfile
> RUN pip install -e '.[huggingface]'
> ```

## 📋 System Requirements

- **Docker**: 20.10+ with Compose v2
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 10GB free space
- **Network**: Internet for first-time model downloads

## 🐛 Troubleshooting

See [DOCKER_DEPLOY.md](./DOCKER_DEPLOY.md#troubleshooting) for detailed troubleshooting guide.

Quick fixes:
```bash
# Check service status
docker compose ps

# View detailed logs
docker compose logs

# Reset everything
docker compose down -v
docker compose up -d
```

## Oxtari Walkthrough

### Select your Deployment

The first screen you'll see is the deployment screen. Here you can select between `Local`, `Docker`, `Weaviate Cloud`, or `Custom` deployment. The `Local` deployment is using Weaviate Embedded under the hood, which initializes a Weaviate instance behind the scenes. The `Docker` deployment is using a separate Weaviate instance that is running inside the same Docker network. The `Weaviate Cloud` deployment is using a Weaviate instance that is hosted on Weaviate Cloud Services (WCS). The `Custom` deployment allows you to specify your own Weaviate instance URL, PORT, and API key.

You can skip this part by setting the `DEFAULT_DEPLOYMENT` environment variable to `Local`, `Docker`, `Weaviate`, or `Custom`.

### Import Your Data

First thing you need to do is to add your data. You can do this by clicking on `Import Data` and selecting either `Add Files`, `Add Directory`, or `Add URL` tab. Here you can add all your files that you want to ingest.
You can then configure every file individually by selecting the file and clicking on `Overview` or `Configure` tab.
![Demo of Oxtari](https://github.com/weaviate/Oxtari/blob/2.0.0/img/oxtari_data.png)

### Query Your Data

With Data imported, you can use the `Chat` page to ask any related questions. You will receive relevant chunks that are semantically relevant to your question and an answer generated by your choosen model. You can configure the RAG pipeline under the `Config` tab.

![Demo of Oxtari](https://github.com/weaviate/Oxtari/blob/2.0.0/img/oxtari_rag.png)

## Open Source Contribution

Your contributions are always welcome! Feel free to contribute ideas, feedback, or create issues and bug reports if you find any! Before contributing, please read the [Contribution Guide](./CONTRIBUTING.md). Visit our [Weaviate Community Forum](https://forum.weaviate.io/) if you need any help!

### Project Architecture

You can learn more about Oxtari's architecture and implementation in its [technical documentation](./TECHNICAL.md) and [frontend documentation](./FRONTEND.md). It's recommended to have a look at them before making any contributions.

## Known Issues

- **Weaviate Embeeded** currently not working on Windows yet
  - Will be fixed in future versions, until then please use the Docker or WCS Deployment

## FAQ

- **Can I use pre-existing data from my Weaviate instance?**

  - No, unfortunatley not. Oxtari requires the data to be in a specific format to work. And as of now, this is only possible by importing data through the Oxtari UI.

- **Is Oxtari Multi-Lingual?**

  - This depends on your choosen Embedding and Generation Model whether they support multi-lingual data.

- **Can I use my Ollama Server with the Oxtari Docker?**

  - Yes, you can! Make sure the URL is set to: `OLLAMA_URL=http://host.docker.internal:11434`
  - If you're running on Linux, you might need to get the IP Gateway of the Ollama server: `OLLAMA_URL="http://YOUR-IP-OF-OLLAMA:11434"`

- **How to clear Weaviate Embedded Storage?**

  - You'll find the stored data here: `~/.local/share/weaviate`

- **How can I specify the port?**

  - You can use the port and host flag `oxtari start --port 9000 --host 0.0.0.0`

- **Can multiple users use Oxtari at the same time? How about role based access?**

  - Oxtari is designed and optimized for single user usage only. There are no plans on supporting multiple users or role based access in the near future.

- **Does Oxtari offer a API endpoint to use externally?**

  - No, right now Oxtari does not offer any useful API endpoints to interact with the application. The current FastAPI setup is optimized for the internal communication between the frontend and backend. It is not recommended to use it as a API endpoint. There are plans to add user-friendly

- **How to connect to your custom OpenAI Server?**

  - Set your custom OpenAI API Key and URL in the `.env` file, this will allow Oxtari to start up and retrieve the models from your custom OpenAI Server. `OPENAI_BASE_URL` is set to `https://api.openai.com/v1` by default.
  - You can also set a different endpoint for your embeddings by configuring the `OPENAI_EMBED_API_KEY` and `OPENAI_EMBED_BASE_URL` environment variables and setting `OPENAI_CUSTOM_EMBED=true`. For more details, see [OpenAI Embeddings](#openai-embeddings).

- **How to upload custom JSON files to Oxtari?**
  - Right now Oxtari does not support custom JSON structure. Instead the whole JSON will simply be dumped into the content field of the Oxtari document. You can read more about the Oxtari JSON Structure in the Technical Documentation [here](./TECHNICAL.md).
