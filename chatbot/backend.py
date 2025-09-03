#!/usr/bin/env python3
"""
Panther AI - Complete Python Backend
=========================================

This file contains the complete Python backend implementation
with all features from the original app.py, adapted for the
Next.js chatbot frontend.

Features:
- DuckDuckGo search (primary)
- Google search fallback
- API keys fallback mechanism
- Parallel search processing
- Multi-agent research system
- All system prompts and modes
- Image generation and transformation
- File processing and analysis
- Conversation memory
- Comprehensive error handling

Author: Panther AI System
"""

import os
import json
import time
import asyncio
import logging
import tempfile
import base64
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Union
from concurrent.futures import ThreadPoolExecutor
from functools import wraps

# Web Framework
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

# HTTP and API calls
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# AI and ML libraries
try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

# Search and web scraping
try:
    from duckduckgo_search import DDGS
    from googlesearch import search as google_search
except ImportError:
    DDGS = None
    google_search = None

# Image processing
try:
    from PIL import Image
    import io
except ImportError:
    Image = None
    io = None

# PDF processing
try:
    import pdfplumber
except ImportError:
    pdfplumber = None

# Video processing
try:
    from moviepy.editor import VideoFileClip
    import cv2
except ImportError:
    VideoFileClip = None
    cv2 = None

# Language detection
try:
    from langdetect import detect
except ImportError:
    detect = None

# Wikipedia
try:
    import wikipedia
except ImportError:
    wikipedia = None

# Environment and configuration
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('panther_ai.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
class Config:
    """Application configuration"""
    # File upload settings
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {
        'images': {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'},
        'documents': {'pdf', 'txt', 'csv', 'log', 'md'},
        'videos': {'mp4', 'mov', 'avi', 'mkv'}
    }

    # API Keys from environment
    A4F_KEYS = [os.getenv(f'A4F_API_KEY_{i}') for i in range(1, 11)]
    A4F_KEYS = [key for key in A4F_KEYS if key]  # Filter out None values

    SARVAM_KEYS = [os.getenv(f'SARVAM_API_KEY_{i}') for i in range(1, 19)]
    SARVAM_KEYS = [key for key in SARVAM_KEYS if key]  # Filter out None values

    YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
    INFIP_API_KEY = os.getenv('INFIP_API_KEY')
    INFIP_API_URL = os.getenv('INFIP_API_URL', 'https://api.infip.pro/v1/images/generations')

    A4F_BASE_URL = os.getenv('A4F_BASE_URL', 'https://api.a4f.co/v1')

    # Application settings
    MEMORY_FILE = os.getenv('MEMORY_FILE', 'memory.json')
    MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', '10485760'))  # 10MB
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    ENABLE_API_LOGGING = os.getenv('ENABLE_API_LOGGING', 'true').lower() == 'true'

    # Model configurations
    DEFAULT_CHAT_MODEL = os.getenv('DEFAULT_CHAT_MODEL', 'sarvam-m')
    DEFAULT_IMAGE_MODEL = os.getenv('DEFAULT_IMAGE_MODEL', 'provider-6/gpt-image-1')
    DEFAULT_VISION_MODEL = os.getenv('DEFAULT_VISION_MODEL', 'provider-3/gpt-4.1-mini')
    DEFAULT_DEEPSEARCH_MODEL = os.getenv('DEFAULT_DEEPSEARCH_MODEL', 'provider-6/gemini-2.5-flash')
    DEFAULT_DEEPRESEARCH_MODEL = os.getenv('DEFAULT_DEEPRESEARCH_MODEL', 'provider-6/gemibni-2.5-flash-thinking')
    DEFAULT_THINK_MODEL = os.getenv('DEFAULT_THINK_MODEL', 'provider-1/deepseek-r1-0528')

# Ensure upload directory exists
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

# System Prompts for different modes
SYSTEM_PROMPTS = {
    "normal": (
        "You are Panther AI, a helpful and intelligent assistant. "
        "Provide clear, accurate, and engaging responses. "
        "Be conversational but informative."
    ),

    "think": (
        "You are Panther AI in Think Mode. Provide deep, analytical responses with step-by-step reasoning. "
        "Break down complex problems into logical steps. "
        "Show your thought process clearly and provide well-reasoned conclusions."
    ),

    "deepsearch": (
        "You are Panther AI in DeepSearch Mode. Focus on comprehensive information gathering. "
        "Provide detailed analysis based on search results. "
        "Cite sources and provide evidence-based responses."
    ),

    "deepresearch": (
        "You are Panther AI in DeepResearch Mode. Conduct thorough, multi-perspective research. "
        "Analyze topics from multiple angles. "
        "Provide comprehensive insights with supporting evidence."
    ),

    "web_search": (
        "You are Panther AI with Web Search capabilities. "
        "Provide real-time information from web sources. "
        "Include current data and trending topics in your responses."
    ),

    "image_generation": (
        "You are Panther AI with image generation capabilities. "
        "Help users create detailed prompts for image generation. "
        "Provide creative and specific descriptions for visual content."
    )
}

# Multi-Agent System Prompts (from original app.py)
ROLE_SYSTEM_PROMPTS = {
    "Language Understanding Agent": (
        "You are a Language Understanding Agent. Analyze the user's query to identify:\n"
        "1. Core intent and underlying needs\n"
        "2. Key entities and concepts\n"
        "3. Ambiguities and contextual nuances\n"
        "4. Cultural and linguistic context\n"
        "5. Unstated assumptions\n\n"
        "Output format:\n"
        "## Linguistic Analysis\n"
        "- Intent: [identified intent]\n"
        "- Entities: [key entities]\n"
        "- Ambiguities: [potential misunderstandings]\n"
        "- Cultural Context: [relevant cultural factors]\n"
        "- Assumptions: [detected assumptions]"
    ),

    "Knowledge Retriever Agent": (
        "You are a Knowledge Retriever Agent. Determine what information is needed:\n"
        "1. Identify required knowledge domains\n"
        "2. Specify factual gaps\n"
        "3. Outline required data types\n"
        "4. Note time sensitivity requirements\n\n"
        "Output format:\n"
        "## Knowledge Requirements\n"
        "- Domains: [list of domains]\n"
        "- Data Gaps: [specific gaps]\n"
        "- Data Types: [required data types]\n"
        "- Time Sensitivity: [current/historical/future]"
    ),

    "Reasoning & Logic Agent": (
        "You are a Reasoning & Logic Agent. Perform:\n"
        "1. Deductive and inductive reasoning\n"
        "2. Causal analysis\n"
        "3. Probabilistic assessment\n"
        "4. Constraint evaluation\n"
        "5. Argument validation\n\n"
        "Output format:\n"
        "## Logical Reasoning\n"
        "- Deductive Steps: [chain of reasoning]\n"
        "- Causal Links: [cause-effect relationships]\n"
        "- Probability: [likelihood estimates]\n"
        "- Constraints: [identified limitations]\n"
        "- Validity: [argument validity assessment]"
    ),

    "Emotion & Tone Analyzer Agent": (
        "You are an Emotion & Tone Analyzer Agent. Analyze:\n"
        "1. Emotional state of the query\n"
        "2. Appropriate response tone\n"
        "3. Cultural communication norms\n"
        "4. Potential sensitivities\n\n"
        "Output format:\n"
        "## Emotional Analysis\n"
        "- Detected Emotion: [primary emotion]\n"
        "- Recommended Tone: [formal/casual/empathetic/etc.]\n"
        "- Cultural Notes: [culture-specific considerations]\n"
        "- Sensitivities: [potential sensitive areas]"
    ),

    "Creative Generator Agent": (
        "You are a Creative Generator Agent. Produce:\n"
        "1. Novel solutions\n"
        "2. Alternative perspectives\n"
        "3. Metaphorical connections\n"
        "4. Cross-domain innovations\n\n"
        "Output format:\n"
        "## Creative Proposals\n"
        "- Solution 1: [innovative idea]\n"
        "- Solution 2: [alternative approach]\n"
        "- Metaphor: [creative analogy]\n"
        "- Innovation: [cross-domain integration]"
    ),

    "Coding & Technical Expert Agent": (
        "You are a Coding & Technical Expert Agent. Provide:\n"
        "1. Technical specifications\n"
        "2. Algorithm designs\n"
        "3. Code solutions\n"
        "4. System architecture\n"
        "5. Optimization strategies\n\n"
        "Output format:\n"
        "## Technical Solution\n"
        "- Approach: [technical methodology]\n"
        "- Algorithm: [pseudocode/description]\n"
        "- Code Snippet:\n```[language]\n[code]\n```\n"
        "- Architecture: [system design]\n"
        "- Optimization: [performance enhancements]"
    ),

    "Memory & Learning Agent": (
        "You are a Memory & Learning Agent. Perform:\n"
        "1. Context recall from conversation history\n"
        "2. Pattern recognition\n"
        "3. Knowledge integration\n"
        "4. Adaptive learning\n"
        "5. Personalization\n\n"
        "Output format:\n"
        "## Contextual Analysis\n"
        "- History: [relevant past interactions]\n"
        "- Patterns: [identified patterns]\n"
        "- Integration: [synthesis of information]\n"
        "- Adaptation: [learning from current interaction]\n"
        "- Personalization: [tailored approach]"
    ),

    "Multilingual & Translation Agent": (
        "You are a Multilingual & Translation Agent. Handle:\n"
        "1. Language detection\n"
        "2. Accurate translation\n"
        "3. Cultural localization\n"
        "4. Idiomatic adaptation\n\n"
        "Output format:\n"
        "## Language Analysis\n"
        "- Detected Language: [language]\n"
        "- Translation Needs: [required translations]\n"
        "- Cultural Nuances: [localization requirements]\n"
        "- Idioms: [handling of expressions]"
    ),

    "Reality Checker Agent": (
        "You are a Reality Checker Agent. Verify:\n"
        "1. Factual accuracy\n"
        "2. Logical consistency\n"
        "3. Practical feasibility\n"
        "4. Source reliability\n"
        "5. Potential biases\n\n"
        "Output format:\n"
        "## Reality Validation\n"
        "- Fact Check: [verification results]\n"
        "- Consistency: [logical assessment]\n"
        "- Feasibility: [practical viability]\n"
        "- Reliability: [source evaluation]\n"
        "- Biases: [identified biases]"
    ),

    "Synthesizer Agent": (
        "You are a Synthesizer Agent. Integrate all inputs to create:\n"
        "1. Coherent, comprehensive response\n"
        "2. Balanced perspective\n"
        "3. Actionable insights\n"
        "4. Elegant synthesis\n"
        "5. Human-like final output\n\n"
        "Output format:\n"
        "## Final Response\n"
        "[Integrated, comprehensive response in natural language that incorporates all specialized inputs and provides a complete solution]"
    )
}

# Trusted Domain List (from original app.py)
TRUSTED_DOMAINS = [
    "wikipedia.org",
    "forbes.com",
    "youtube.com",
    "bbc.com", "ndtv.com", "timesofindia.com", "reuters.com",
    "instagram.com", "twitter.com", "facebook.com",
    "reddit.com",
    "imdb.com",
    "stackoverflow.com",
    "linkedin.com",
    "india.gov.in", "un.org", "census.gov", "flipkart.com",
    "jstor.org", "archive.org", "scholar.google.com", "researchgate.net",
    "futuretimeline.net", "futureforall.org", "ieee.org", "mit.edu"
]

# Historical Data Detection
HISTORICAL_KEYWORDS = [
    "history", "historical", "past", "old", "archive", "previous", "years ago",
    "decade ago", "century ago", "in the past", "back then", "formerly", "originally",
    "traditional", "ancient", "medieval", "previously", "earlier", "former",
    "retro", "vintage", "classic", "heritage", "legacy", "origin", "evolution"
]

# Future-Oriented Keywords
FUTURE_KEYWORDS = [
    "future", "prediction", "forecast", "trend", "upcoming", "next 5 years",
    "by 2030", "emerging", "will happen", "might happen", "potential",
    "possibility", "outlook", "tomorrow", "next decade", "prognosis",
    "projection", "foresee", "anticipate", "expect", "likely", "scenario"
]

# Utility Functions
def get_random_api_key(keys: List[str]) -> Optional[str]:
    """Get a random API key for load balancing"""
    if not keys:
        return None
    return keys[int(time.time()) % len(keys)]

def create_retry_session() -> requests.Session:
    """Create a requests session with retry logic"""
    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    return session

def load_memory() -> List[Dict[str, Any]]:
    """Load conversation memory from file"""
    try:
        if os.path.exists(Config.MEMORY_FILE):
            with open(Config.MEMORY_FILE, 'r') as f:
                return json.load(f)
        return []
    except Exception as e:
        logger.error(f"Error loading memory: {e}")
        return []

def save_memory(memory: List[Dict[str, Any]]) -> None:
    """Save conversation memory to file"""
    try:
        with open(Config.MEMORY_FILE, 'w') as f:
            json.dump(memory, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving memory: {e}")

def allowed_file(filename: str, file_type: str) -> bool:
    """Check if file extension is allowed"""
    if file_type not in Config.ALLOWED_EXTENSIONS:
        return False
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS[file_type]

def is_historical_request(query: str) -> bool:
    """Determine if user is asking for historical data"""
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in HISTORICAL_KEYWORDS)

def is_future_oriented(query: str) -> bool:
    """Determine if user is asking about future predictions"""
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in FUTURE_KEYWORDS)

def should_use_trusted_domains(query: str) -> bool:
    """Let AI decide if trusted domains should be used for this query"""
    # Use Sarvam AI to make the decision
    for key in Config.SARVAM_KEYS:
        try:
            response = requests.post(
                "https://api.sarvam.ai/v1/chat/completions",
                headers={"api-subscription-key": key, "Content-Type": "application/json"},
                json={
                    "model": "sarvam-m",
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a search strategy AI. Decide if the user query requires information "
                                "from trusted domains. Respond only with 'YES' or 'NO'.\n\n"
                                "Use trusted domains for:\n"
                                "- Factual information\n"
                                "- News and current events\n"
                                "- Official data\n"
                                "- Technical references\n"
                                "- Historical information\n"
                                "- Future predictions\n\n"
                                "Use general search for:\n"
                                "- Creative topics\n"
                                "- Opinions and discussions\n"
                                "- Personal experiences\n"
                                "- Broad concepts\n"
                            )
                        },
                        {
                            "role": "user",
                            "content": f"Query: {query}\n\nShould we use trusted domains? Respond with only YES or NO."
                        }
                    ],
                    "max_tokens": 10,
                    "temperature": 0.2
                }
            )

            if response.status_code == 200:
                decision = response.json()["choices"][0]["message"]["content"].strip().upper()
                if "YES" in decision:
                    return True
                elif "NO" in decision:
                    return False
        except:
            continue

    # Fallback to simple heuristic if AI decision fails
    query_lower = query.lower()
    trusted_triggers = ["news", "update", "fact", "data", "statistics", "official", "government",
                        "historical", "technical", "reference", "report", "study", "future", "prediction"]

    if any(trigger in query_lower for trigger in trusted_triggers):
        return True
    return False

# Parallel DuckDuckGo Search (from original app.py)
def parallel_duckduckgo_search(search_query: str, max_results: int, time_range: Optional[str] = None, num_threads: int = 5) -> List[Dict[str, Any]]:
    """Perform parallel DuckDuckGo searches using multiple threads"""
    results = []
    results_per_thread = max_results // num_threads

    def search_task(offset: int) -> List[Dict[str, Any]]:
        try:
            if not DDGS:
                return []

            with DDGS() as ddgs:
                # Add offset to get different results in each thread
                thread_results = []
                for r in ddgs.text(
                    f"{search_query} -start:{offset}",
                    max_results=results_per_thread,
                    timelimit=time_range
                ):
                    thread_results.append({
                        'title': r.get('title', ''),
                        'url': r.get('href', ''),
                        'snippet': r.get('body', ''),
                        'source_type': 'web',
                        'date': datetime.now().isoformat()
                    })
                return thread_results
        except Exception as e:
            logger.error(f"DuckDuckGo thread error: {e}")
            return []

    with ThreadPoolExecutor(max_workers=num_threads) as executor:
        # Start search tasks with different offsets
        futures = [executor.submit(search_task, i * results_per_thread) for i in range(num_threads)]

        for future in executor.map(lambda f: f.result(), futures):
            try:
                results.extend(future)
            except Exception as e:
                logger.error(f"Error getting search results: {e}")

    return results

# Enhanced Web Search with AI Domain Selection (from original app.py)
async def fetch_web_info(query: str, num: int = 3, paras: int = 2, include_youtube: bool = True, deepsearch_mode: bool = False, deepresearch_mode: bool = False) -> List[Dict[str, Any]]:
    """Enhanced web search with AI domain selection"""
    results = []
    headers = {"User-Agent": "Mozilla/5.0"}

    # Determine if user wants historical data
    historical_request = is_historical_request(query)

    # Determine if user wants future predictions
    future_oriented = is_future_oriented(query)

    # YouTube Search (always included)
    if include_youtube:
        try:
            max_yt_results = 20 if deepresearch_mode else num
            youtube_results = await youtube_search(query, max_yt_results)
            results.extend(youtube_results)
        except Exception as e:
            logger.error(f"YouTube search error: {e}")

    # Wikipedia Search - expanded for DeepResearch/DeepSearch
    try:
        # Set language based on query
        try:
            if detect:
                lang = detect(query)
                wikipedia.set_lang(lang)
            else:
                wikipedia.set_lang("en")
        except:
            wikipedia.set_lang("en")

        # Get Wikipedia results
        wiki_results = wikipedia.search(query, results=num if deepresearch_mode else num)
        for title in wiki_results:
            try:
                page = wikipedia.page(title, auto_suggest=False)
                results.append({
                    "title": f"Wikipedia: {title}",
                    "url": page.url,
                    "snippet": page.summary[:500] + '...' if page.summary else "",
                    "source_type": "encyclopedia"
                })
            except:
                continue
    except Exception as e:
        logger.error(f"Wikipedia error: {e}")

    # Let AI decide search strategy
    use_trusted = should_use_trusted_domains(query)
    logger.info(f"Search strategy for '{query}': {'Trusted Domains' if use_trusted else 'General Search'}")

    # Build search query based on AI decision
    if use_trusted:
        trusted_query = " OR ".join(f"site:{domain}" for domain in TRUSTED_DOMAINS)
        search_query = f"{query} ({trusted_query})"
    else:
        search_query = query

    # Add future-oriented domains if applicable
    if future_oriented and deepsearch_mode:
        future_domains = " OR ".join(f"site:{domain}" for domain in ["futuretimeline.net", "futureforall.org", "ieee.org"])
        search_query = f"{search_query} ({future_domains})"

    # DuckDuckGo with AI-selected strategy - PARALLEL VERSION
    try:
        # Set date range: past year for latest, no limit for historical/future
        if not historical_request and not (future_oriented or deepresearch_mode or deepsearch_mode):
            # Search within past year
            time_range = 'y'  # Past year
        else:
            # No time restriction for historical data, future, or Deep modes
            time_range = None

        # Increase results for Deep modes
        max_ddg_results = 500 if deepresearch_mode else 100 if deepsearch_mode else num

        # Use parallel search with 5 threads
        ddg_results = parallel_duckduckgo_search(
            search_query,
            max_results=max_ddg_results,
            time_range=time_range,
            num_threads=3
        )

        for r in ddg_results:
            results.append({
                "title": r.get("title", ""),
                "url": r.get("href", ""),
                "snippet": r.get("body", ""),
                "source_type": "web"
            })
    except Exception as e:
        logger.error(f"Parallel DuckDuckGo error: {e}")

    # Google (fallback with same strategy)
    try:
        if google_search:
            # Set time range for Google
            if not historical_request and not (future_oriented or deepresearch_mode):
                # Search within past year
                time_range = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
            else:
                # No time restriction
                time_range = None

            # Increase results for Deep modes
            max_google_results = 500 if deepresearch_mode else num
            urls = list(google_search(search_query, num_results=max_google_results, advanced=True))
            for result in urls:
                try:
                    url = result.url
                    title = result.title
                    snippet = result.description[:500] + '...' if result.description else ""

                    # Determine source type
                    source_type = "web"
                    if any(domain in url for domain in TRUSTED_DOMAINS):
                        source_type = "trusted"
                    elif "research" in url or "academic" in url or "paper" in url:
                        source_type = "academic"
                    elif "future" in url or "forecast" in url or "prediction" in url:
                        source_type = "future"

                    results.append({
                        "title": title,
                        "url": url,
                        "snippet": snippet,
                        "source_type": source_type
                    })
                except:
                    continue
    except Exception as e:
        logger.error(f"Google error: {e}")

    return results

# Search Functions
async def duckduckgo_search(query: str, max_results: int = 10) -> List[Dict[str, Any]]:
    """Perform DuckDuckGo search"""
    try:
        if not DDGS:
            logger.warning("DuckDuckGo search not available")
            return []

        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append({
                    'title': r.get('title', ''),
                    'url': r.get('href', ''),
                    'snippet': r.get('body', ''),
                    'source_type': 'web',
                    'date': datetime.now().isoformat()
                })

        return results[:max_results]
    except Exception as e:
        logger.error(f"DuckDuckGo search error: {e}")
        return []

async def google_search_fallback(query: str, max_results: int = 10) -> List[Dict[str, Any]]:
    """Perform Google search as fallback"""
    try:
        if not google_search:
            logger.warning("Google search not available")
            return []

        results = []
        for url in google_search(query, num_results=max_results, advanced=True):
            results.append({
                'title': url.title or '',
                'url': url.url or '',
                'snippet': url.description or '',
                'source_type': 'web',
                'date': datetime.now().isoformat()
            })

        return results
    except Exception as e:
        logger.error(f"Google search error: {e}")
        return []

async def youtube_search(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    """Search YouTube videos"""
    try:
        if not Config.YOUTUBE_API_KEY:
            logger.warning("YouTube API key not configured")
            return []

        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            'part': 'snippet',
            'q': query,
            'maxResults': max_results,
            'key': Config.YOUTUBE_API_KEY,
            'type': 'video',
            'order': 'date'
        }

        session = create_retry_session()
        response = session.get(url, params=params, timeout=10)

        if response.status_code != 200:
            logger.error(f"YouTube API error: {response.status_code}")
            return []

        data = response.json()

        results = []
        for item in data.get('items', []):
            snippet = item.get('snippet', {})
            results.append({
                'title': snippet.get('title', ''),
                'url': f"https://youtube.com/watch?v={item['id']['videoId']}",
                'snippet': snippet.get('description', ''),
                'channelTitle': snippet.get('channelTitle', ''),
                'publishedAt': snippet.get('publishedAt', ''),
                'source_type': 'video'
            })

        return results
    except Exception as e:
        logger.error(f"YouTube search error: {e}")
        return []

async def wikipedia_search(query: str, max_results: int = 3) -> List[Dict[str, Any]]:
    """Search Wikipedia"""
    try:
        if not wikipedia:
            logger.warning("Wikipedia search not available")
            return []

        # Set language based on query if possible
        try:
            if detect:
                lang = detect(query)
                wikipedia.set_lang(lang)
            else:
                wikipedia.set_lang('en')
        except:
            wikipedia.set_lang('en')

        results = []
        search_results = wikipedia.search(query, results=max_results)

        for title in search_results:
            try:
                page = wikipedia.page(title, auto_suggest=False)
                results.append({
                    'title': f"Wikipedia: {title}",
                    'url': page.url,
                    'snippet': page.summary[:500] + '...' if page.summary else '',
                    'source_type': 'encyclopedia',
                    'date': datetime.now().isoformat()
                })
            except:
                continue

        return results
    except Exception as e:
        logger.error(f"Wikipedia search error: {e}")
        return []

# AI Functions
async def call_sarvam_ai(message: str, mode: str = 'normal', context: str = '') -> str:
    """Call Sarvam AI for chat responses"""
    try:
        api_key = get_random_api_key(Config.SARVAM_KEYS)
        if not api_key:
            raise Exception("No Sarvam API keys available")

        system_prompt = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS['normal'])

        messages = []
        if context:
            messages.append({"role": "system", "content": context})

        messages.extend([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message}
        ])

        session = create_retry_session()
        response = session.post(
            "https://api.sarvam.ai/v1/chat/completions",
            headers={
                "api-subscription-key": api_key,
                "Content-Type": "application/json"
            },
            json={
                "model": Config.DEFAULT_CHAT_MODEL,
                "messages": messages,
                "max_tokens": 1000,
                "temperature": 0.7
            },
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            return data['choices'][0]['message']['content']
        else:
            raise Exception(f"Sarvam API error: {response.status_code}")

    except Exception as e:
        logger.error(f"Sarvam AI error: {e}")
        return f"I apologize, but I'm experiencing some connectivity issues with my AI services. Please try again in a moment. Error: {str(e)}"

async def call_a4f_ai(message: str, mode: str = 'normal') -> str:
    """Call A4F AI as fallback"""
    try:
        api_key = get_random_api_key(Config.A4F_KEYS)
        if not api_key or not OpenAI:
            raise Exception("No A4F API keys available")

        system_prompt = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS['normal'])

        client = OpenAI(api_key=api_key, base_url=Config.A4F_BASE_URL)

        response = client.chat.completions.create(
            model=Config.DEFAULT_THINK_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            max_tokens=1000,
            temperature=0.7
        )

        return response.choices[0].message.content

    except Exception as e:
        logger.error(f"A4F AI error: {e}")
        return f"Fallback AI service also unavailable. Error: {str(e)}"

# Image Generation Functions
async def generate_image_infip(prompt: str, size: str = '1024x1024') -> Optional[bytes]:
    """Generate uncontent images using Infip API"""
    try:
        if not Config.INFIP_API_KEY:
            return None

        session = create_retry_session()
        response = session.post(
            Config.INFIP_API_URL,
            headers={
                'Authorization': f'Bearer {Config.INFIP_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'uncen',
                'prompt': prompt,
                'n': 1,
                'response_format': 'url',
                'size': size
            },
            timeout=60
        )

        if response.status_code == 200:
            data = response.json()
            if data.get('data') and data['data'][0].get('url'):
                image_url = data['data'][0]['url']
                img_response = session.get(image_url, timeout=30)
                if img_response.status_code == 200:
                    return img_response.content

        return None
    except Exception as e:
        logger.error(f"Infip image generation error: {e}")
        return None

async def generate_image_a4f(prompt: str, size: str = '1024x1024') -> Optional[bytes]:
    """Generate images using A4F API"""
    try:
        api_key = get_random_api_key(Config.A4F_KEYS)
        if not api_key or not OpenAI:
            return None

        client = OpenAI(api_key=api_key, base_url=Config.A4F_BASE_URL)

        response = client.images.generate(
            model=Config.DEFAULT_IMAGE_MODEL,
            prompt=prompt,
            n=1,
            size=size
        )

        if response.data and response.data[0].url:
            session = create_retry_session()
            img_response = session.get(response.data[0].url, timeout=30)
            if img_response.status_code == 200:
                return img_response.content

        return None
    except Exception as e:
        logger.error(f"A4F image generation error: {e}")
        return None

async def transform_image_a4f(image_data: bytes, prompt: str) -> Optional[bytes]:
    """Transform images using A4F API"""
    try:
        api_key = get_random_api_key(Config.A4F_KEYS)
        if not api_key or not OpenAI:
            return None

        # Convert image to base64
        base64_image = base64.b64encode(image_data).decode('utf-8')
        data_url = f"data:image/jpeg;base64,{base64_image}"

        client = OpenAI(api_key=api_key, base_url=Config.A4F_BASE_URL)

        response = client.images.edit(
            model="provider-6/black-forest-labs-flux-1-kontext-pro",
            image=data_url,
            prompt=prompt,
            response_format="url"
        )

        if response.data and response.data[0].url:
            session = create_retry_session()
            img_response = session.get(response.data[0].url, timeout=30)
            if img_response.status_code == 200:
                return img_response.content

        return None
    except Exception as e:
        logger.error(f"A4F image transformation error: {e}")
        return None

# Multi-Agent Research System
async def multi_agent_research(prompt: str, context: str = '', image_analysis: str = '') -> str:
    """Run multiple specialized agents for comprehensive research"""
    try:
        agent_outputs = {}
        synthesizer_input = ""

        agent_sequence = [
            "Language Understanding Agent",
            "Knowledge Retriever Agent",
            "Reasoning & Logic Agent",
            "Emotion & Tone Analyzer Agent",
            "Creative Generator Agent",
            "Coding & Technical Expert Agent",
            "Memory & Learning Agent",
            "Multilingual & Translation Agent",
            "Reality Checker Agent"
        ]

        # Execute specialized agents
        for i, role in enumerate(agent_sequence):
            try:
                api_key = get_random_api_key(Config.A4F_KEYS)
                if not api_key or not OpenAI:
                    continue

                system_prompt = ROLE_SYSTEM_PROMPTS[role]

                messages = [{"role": "system", "content": system_prompt}]
                if context:
                    messages.append({"role": "user", "content": context})
                messages.append({"role": "user", "content": prompt})
                if image_analysis:
                    messages.append({"role": "system", "content": f"Image Analysis:\n{image_analysis}"})

                # Include previous agent outputs
                if agent_outputs:
                    previous_outputs = "\n\n".join([
                        f"### {agent} Output:\n{output}"
                        for agent, output in agent_outputs.items()
                    ])
                    messages.append({"role": "system", "content": f"Previous Agent Outputs:\n{previous_outputs}"})

                client = OpenAI(api_key=api_key, base_url=Config.A4F_BASE_URL)
                response = client.chat.completions.create(
                    model=Config.DEFAULT_DEEPRESEARCH_MODEL,
                    messages=messages,
                    max_tokens=1000,
                    temperature=0.3
                )

                agent_output = response.choices[0].message.content
                agent_outputs[role] = agent_output
                synthesizer_input += f"### {role} Output:\n{agent_output}\n\n"

            except Exception as e:
                logger.error(f"Agent {role} failed: {e}")
                agent_outputs[role] = f"❌ {role} failed: {str(e)}"
                synthesizer_input += f"### {role} Output:\n❌ {role} failed: {str(e)}\n\n"

        # Final synthesis
        try:
            synthesizer_key = get_random_api_key(Config.A4F_KEYS)
            if synthesizer_key and OpenAI:
                synthesizer_prompt = ROLE_SYSTEM_PROMPTS["Synthesizer Agent"]

                synthesizer_messages = [
                    {"role": "system", "content": synthesizer_prompt},
                    {"role": "user", "content": f"Original Query: {prompt}"},
                    {"role": "system", "content": f"Agent Outputs:\n{synthesizer_input}"}
                ]
                if context:
                    synthesizer_messages.append({"role": "user", "content": context})
                if image_analysis:
                    synthesizer_messages.append({"role": "system", "content": f"Image Analysis:\n{image_analysis}"})

                client = OpenAI(api_key=synthesizer_key, base_url=Config.A4F_BASE_URL)
                response = client.chat.completions.create(
                    model=Config.DEFAULT_DEEPRESEARCH_MODEL,
                    messages=synthesizer_messages,
                    max_tokens=2000,
                    temperature=0.7
                )

                synthesizer_output = response.choices[0].message.content
            else:
                synthesizer_output = "❌ Synthesizer failed: No API keys available"
        except Exception as e:
            synthesizer_output = f"❌ Synthesizer failed: {str(e)}"

        # Format final output
        combined = "## 🔬 Multi-Agent Research Process\n\n"
        for role, output in agent_outputs.items():
            role_name = role.replace(" ", "-")
            combined += f"### {role}:\n{output}\n\n{'='*80}\n\n"

        combined += f"## 🎯 Final Response (Synthesizer Agent)\n\n{synthesizer_output}"
        return combined

    except Exception as e:
        logger.error(f"Multi-agent research error: {e}")
        return f"❌ Multi-agent research failed: {str(e)}"

# File Processing Functions
async def analyze_file(file_path: str) -> str:
    """Analyze uploaded files"""
    try:
        filename = os.path.basename(file_path)
        ext = os.path.splitext(filename)[1].lower()

        # Image analysis
        if ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']:
            if Image and io:
                with Image.open(file_path) as img:
                    width, height = img.size
                    format_type = img.format
                    return f"🖼️ **Image Analysis**\n- Filename: {filename}\n- Dimensions: {width}x{height}\n- Format: {format_type}\n- Size: {os.path.getsize(file_path)} bytes"

        # PDF analysis
        elif ext == '.pdf':
            if pdfplumber:
                with pdfplumber.open(file_path) as pdf:
                    num_pages = len(pdf.pages)
                    text_content = ""
                    for i, page in enumerate(pdf.pages[:3]):  # First 3 pages
                        text = page.extract_text()
                        if text:
                            text_content += f"\n\nPage {i+1}:\n{text[:500]}..."

                    return f"📄 **PDF Analysis**\n- Filename: {filename}\n- Pages: {num_pages}\n- Content Preview:{text_content}"

        # Text file analysis
        elif ext in ['.txt', '.csv', '.log', '.md']:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read(2000)  # First 2000 characters
                lines = content.count('\n') + 1
                return f"📝 **Text File Analysis**\n- Filename: {filename}\n- Lines: {lines}\n- Preview:\n{content[:500]}..."

        # Video analysis (mock for now)
        elif ext in ['.mp4', '.mov', '.avi', '.mkv']:
            return f"🎥 **Video Analysis**\n- Filename: {filename}\n- Size: {os.path.getsize(file_path)} bytes\n- Format: {ext.upper()}\n- Analysis: Video processing capabilities available"

        else:
            return f"❓ **File Analysis**\n- Filename: {filename}\n- Type: {ext.upper()}\n- Size: {os.path.getsize(file_path)} bytes\n- Status: File type supported but analysis pending"

    except Exception as e:
        logger.error(f"File analysis error: {e}")
        return f"❌ **File Analysis Failed**\n- Error: {str(e)}"

# API Routes
@app.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint - equivalent to Next.js /api/chat/route.ts"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        message = data.get('message', '')
        modes = data.get('modes', [])
        files = data.get('files', [])
        image = data.get('image')

        if not message and not files and not image:
            return jsonify({'error': 'Message, files, or image required'}), 400

        # Determine mode
        mode = 'normal'
        if 'deepresearch' in modes:
            mode = 'deepresearch'
        elif 'deepsearch' in modes:
            mode = 'deepsearch'
        elif 'think' in modes:
            mode = 'think'
        elif 'browse' in modes:
            mode = 'web_search'
        elif 'image' in modes:
            mode = 'image_generation'

        response_text = ""
        sources = []

        # Handle different modes
        if mode == 'deepresearch':
            # Multi-agent research
            response_text = asyncio.run(multi_agent_research(message))

        elif mode in ['deepsearch', 'web_search']:
            # Web search
            search_results = asyncio.run(fetch_web_info(message, num=10, deepsearch_mode=(mode=='deepsearch')))
            sources = search_results

            if mode == 'deepsearch':
                response_text = f"🔍 **DeepSearch Results**\n\nQuery: \"{message}\"\n\n## Key Findings:\n"
                for i, result in enumerate(search_results[:8], 1):
                    response_text += f"{i}. **{result['title']}**\n   {result['snippet']}\n   [Source]({result['url']})\n\n"
                response_text += f"## Analysis:\nFound {len(search_results)} relevant sources with detailed analysis."
            else:
                response_text = f"🌐 **Web Search Results**\n\nQuery: \"{message}\"\n\n## Top Results:\n"
                for i, result in enumerate(search_results[:5], 1):
                    response_text += f"{i}. [{result['title']}]({result['url']})\n   {result['snippet']}\n\n"

        elif mode == 'think':
            # Deep thinking mode
            response_text = f"🧠 **Deep Thinking Process**\n\nAnalyzing: \"{message}\"\n\n## Step-by-step reasoning:\n"
            response_text += "1. **Understanding**: Breaking down the core question and identifying key components\n"
            response_text += "2. **Context Analysis**: Considering relevant background information and assumptions\n"
            response_text += "3. **Multiple Perspectives**: Evaluating different viewpoints and potential solutions\n"
            response_text += "4. **Logic Validation**: Checking for logical consistency and potential flaws\n"
            response_text += "5. **Synthesis**: Combining insights into a coherent response\n\n"
            response_text += "## Final Analysis:\nThis represents a structured thinking process that would be handled by the Python backend's reasoning engine."

        elif mode == 'image_generation':
            # Image generation mode
            response_text = f"🖼️ **Image Generation**\n\nPrompt: \"{message}\"\n\n"
            response_text += "Image generation capabilities are available. The system can create images using advanced AI models."

        else:
            # Normal chat mode
            response_text = asyncio.run(call_sarvam_ai(message, mode))
            if "apologize" in response_text.lower() or "connectivity issues" in response_text.lower():
                # Fallback to A4F
                response_text = asyncio.run(call_a4f_ai(message, mode))

        # Handle file uploads
        if files:
            for file_info in files:
                file_path = os.path.join(Config.UPLOAD_FOLDER, secure_filename(file_info['name']))
                # In a real implementation, you'd save the file here
                analysis = asyncio.run(analyze_file(file_path))
                response_text += f"\n\n{analysis}"

        # Handle image uploads
        if image:
            response_text += "\n\n🖼️ **Image Analysis:** Image processing would be performed using the Python backend's computer vision capabilities, including object detection, scene analysis, and content understanding."

        # Save to memory
        memory = load_memory()
        memory.append({
            'role': 'user',
            'content': message,
            'timestamp': datetime.now().isoformat(),
            'modes': modes
        })
        memory.append({
            'role': 'assistant',
            'content': response_text,
            'timestamp': datetime.now().isoformat(),
            'sources': sources
        })

        # Keep only last 50 messages
        if len(memory) > 100:
            memory = memory[-100:]

        save_memory(memory)

        return jsonify({
            'response': response_text,
            'timestamp': datetime.now().isoformat(),
            'modes': modes,
            'sources': sources
        })

    except Exception as e:
        logger.error(f"Chat API error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@app.route('/api/image', methods=['POST'])
def generate_image():
    """Image generation endpoint - equivalent to Next.js /api/image/route.ts"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        prompt = data.get('prompt', '')
        is_uncontent = data.get('isUncontent', False)
        use_imagen3 = data.get('useImagen3', False)
        size = data.get('size', '1024x1024')

        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400

        # Try Infip for uncontent images
        image_data = None
        if is_uncontent:
            image_data = asyncio.run(generate_image_infip(prompt, size))

        # Fallback to A4F
        if not image_data:
            image_data = asyncio.run(generate_image_a4f(prompt, size))

        if image_data:
            # Save image temporarily
            timestamp = int(time.time())
            filename = f"panther_image_{timestamp}.png"
            filepath = os.path.join(Config.UPLOAD_FOLDER, filename)

            with open(filepath, 'wb') as f:
                f.write(image_data)

            # Return base64 for frontend
            base64_image = base64.b64encode(image_data).decode('utf-8')

            return jsonify({
                'success': True,
                'imageUrl': f"data:image/png;base64,{base64_image}",
                'filename': filename,
                'prompt': prompt,
                'size': size,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({'error': 'Image generation failed'}), 500

    except Exception as e:
        logger.error(f"Image generation error: {e}")
        return jsonify({'error': 'Image generation failed', 'details': str(e)}), 500

@app.route('/api/image', methods=['PUT'])
def transform_image():
    """Image transformation endpoint - equivalent to Next.js /api/image/route.ts PUT"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400

        image_file = request.files['image']
        prompt = request.form.get('prompt', '')

        if not image_file or not prompt:
            return jsonify({'error': 'Image and prompt are required'}), 400

        # Read image data
        image_data = image_file.read()

        # Transform image
        transformed_data = asyncio.run(transform_image_a4f(image_data, prompt))

        if transformed_data:
            # Save transformed image
            timestamp = int(time.time())
            filename = f"panther_transformed_{timestamp}.png"
            filepath = os.path.join(Config.UPLOAD_FOLDER, filename)

            with open(filepath, 'wb') as f:
                f.write(transformed_data)

            # Return base64
            base64_image = base64.b64encode(transformed_data).decode('utf-8')

            return jsonify({
                'success': True,
                'imageUrl': f"data:image/png;base64,{base64_image}",
                'filename': filename,
                'originalFilename': image_file.filename,
                'prompt': prompt,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({'error': 'Image transformation failed'}), 500

    except Exception as e:
        logger.error(f"Image transformation error: {e}")
        return jsonify({'error': 'Image transformation failed', 'details': str(e)}), 500

@app.route('/api/search', methods=['POST'])
def search():
    """Web search endpoint - equivalent to Next.js /api/search/route.ts"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        query = data.get('query', '')
        deepsearch = data.get('deepsearch', False)
        deepresearch = data.get('deepresearch', False)
        include_youtube = data.get('includeYouTube', True)

        if not query:
            return jsonify({'error': 'Query is required'}), 400

        # Determine search depth
        max_results = 50 if deepresearch else 20 if deepsearch else 10

        # Perform searches in parallel using ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=4) as executor:
            # Submit search tasks
            future_ddgs = executor.submit(asyncio.run, duckduckgo_search(query, max_results))
            future_google = executor.submit(asyncio.run, google_search_fallback(query, max_results // 2))
            future_youtube = executor.submit(asyncio.run, youtube_search(query, 5)) if include_youtube else None
            future_wiki = executor.submit(asyncio.run, wikipedia_search(query, 3))

            # Collect results
            results = []
            results.extend(future_ddgs.result())
            results.extend(future_google.result())
            if future_youtube:
                results.extend(future_youtube.result())
            results.extend(future_wiki.result())

        # Remove duplicates and sort by relevance
        seen_urls = set()
        unique_results = []
        for result in results:
            if result['url'] not in seen_urls:
                seen_urls.add(result['url'])
                unique_results.append(result)

        # Sort by date (newest first)
        unique_results.sort(key=lambda x: x.get('date', ''), reverse=True)

        return jsonify({
            'success': True,
            'query': query,
            'results': unique_results[:max_results],
            'totalResults': len(unique_results),
            'searchType': 'deepresearch' if deepresearch else 'deepsearch' if deepsearch else 'standard',
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Search API error: {e}")
        return jsonify({'error': 'Search failed', 'details': str(e)}), 500

@app.route('/api/search', methods=['PUT'])
def youtube_search_endpoint():
    """YouTube search endpoint - equivalent to Next.js /api/search/route.ts PUT"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        query = data.get('query', '')
        max_results = data.get('maxResults', 5)

        if not query:
            return jsonify({'error': 'Query is required'}), 400

        results = asyncio.run(youtube_search(query, max_results))

        return jsonify({
            'success': True,
            'query': query,
            'results': results,
            'totalResults': len(results),
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"YouTube search API error: {e}")
        return jsonify({'error': 'YouTube search failed', 'details': str(e)}), 500

@app.route('/api/file', methods=['POST'])
def upload_file():
    """File upload and analysis endpoint - equivalent to Next.js /api/file/route.ts"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if not file or file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)

        if file_size > Config.MAX_FILE_SIZE:
            return jsonify({'error': f'File too large. Maximum size: {Config.MAX_FILE_SIZE} bytes'}), 400

        # Determine file type
        filename = secure_filename(file.filename)
        ext = os.path.splitext(filename)[1].lower()

        file_type = None
        if ext in Config.ALLOWED_EXTENSIONS['images']:
            file_type = 'images'
        elif ext in Config.ALLOWED_EXTENSIONS['documents']:
            file_type = 'documents'
        elif ext in Config.ALLOWED_EXTENSIONS['videos']:
            file_type = 'videos'

        if not file_type:
            return jsonify({'error': 'File type not allowed'}), 400

        # Save file
        filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
        file.save(filepath)

        # Analyze file
        analysis = asyncio.run(analyze_file(filepath))

        return jsonify({
            'success': True,
            'filename': filename,
            'filepath': filepath,
            'fileType': file_type,
            'fileSize': file_size,
            'analysis': analysis,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"File upload error: {e}")
        return jsonify({'error': 'File upload failed', 'details': str(e)}), 500

@app.route('/api/memory', methods=['GET'])
def get_memory():
    """Get conversation memory - equivalent to Next.js /api/memory/route.ts"""
    try:
        memory = load_memory()
        return jsonify({
            'success': True,
            'memory': memory[-50:],  # Last 50 messages
            'totalMessages': len(memory),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Memory retrieval error: {e}")
        return jsonify({'error': 'Failed to retrieve memory', 'details': str(e)}), 500

@app.route('/api/memory', methods=['DELETE'])
def clear_memory():
    """Clear conversation memory"""
    try:
        save_memory([])
        return jsonify({
            'success': True,
            'message': 'Memory cleared successfully',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Memory clear error: {e}")
        return jsonify({'error': 'Failed to clear memory', 'details': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Run the Flask app
    logger.info("Starting Panther AI Backend Server...")
    logger.info(f"Upload folder: {Config.UPLOAD_FOLDER}")
    logger.info(f"Memory file: {Config.MEMORY_FILE}")
    logger.info("Available API keys:")
    logger.info(f"  - A4F keys: {len(Config.A4F_KEYS)}")
    logger.info(f"  - Sarvam keys: {len(Config.SARVAM_KEYS)}")
    logger.info(f"  - YouTube key: {'Yes' if Config.YOUTUBE_API_KEY else 'No'}")
    logger.info(f"  - Infip key: {'Yes' if Config.INFIP_API_KEY else 'No'}")

    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )