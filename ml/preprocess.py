import re
import nltk
from ml.config import NLTK_DATA

# Insert bundled NLTK data directory at the very front of the search path
# Crucial for serverless runtime (Vercel) where filesystem is read-only
if str(NLTK_DATA) not in nltk.data.path:
    nltk.data.path.insert(0, str(NLTK_DATA))

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer, PorterStemmer

# Pre-compiled regular expressions for high-throughput cleaning
URL_PATTERN = re.compile(r"https?://\S+|www\.\S+")
HTML_PATTERN = re.compile(r"<.*?>")
EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
NON_ALPHA_PATTERN = re.compile(r"[^a-z\s]")
WHITESPACE_PATTERN = re.compile(r"\s+")

# Fallback in case stopwords or wordnet aren't downloaded yet (e.g. during initial bootstrapping)
try:
    STOP_WORDS = set(stopwords.words("english"))
except LookupError:
    STOP_WORDS = set()

try:
    LEMMATIZER = WordNetLemmatizer()
except LookupError:
    LEMMATIZER = None

STEMMER = PorterStemmer()

def clean_text(text: str) -> str:
    """Basic lexical cleaning: lowercase, strip URLs, HTML, emails, and non-alphabetic chars."""
    if not text:
        return ""
    text = str(text).lower()
    text = URL_PATTERN.sub(" ", text)
    text = HTML_PATTERN.sub(" ", text)
    text = EMAIL_PATTERN.sub(" ", text)
    text = NON_ALPHA_PATTERN.sub(" ", text)
    return WHITESPACE_PATTERN.sub(" ", text).strip()

def preprocess(
    text: str,
    lemmatize: bool = True,
    stem: bool = False,
    remove_stop: bool = True,
    min_token_len: int = 2
) -> str:
    """
    Standard preprocessing pipeline applied identically at training and inference time.
    Pipeline: clean_text -> whitespace tokenize -> filter stopwords -> lemmatize or stem.
    """
    cleaned = clean_text(text)
    if not cleaned:
        return ""
    
    tokens = cleaned.split()
    
    if remove_stop and STOP_WORDS:
        tokens = [t for t in tokens if t not in STOP_WORDS and len(t) >= min_token_len]
    else:
        tokens = [t for t in tokens if len(t) >= min_token_len]
        
    if lemmatize and LEMMATIZER is not None:
        try:
            tokens = [LEMMATIZER.lemmatize(t) for t in tokens]
        except Exception:
            pass
    elif stem:
        tokens = [STEMMER.stem(t) for t in tokens]
        
    return " ".join(tokens)

def extract_stylistic_features(text: str) -> dict:
    """
    Extract stylistic signals prior to aggressive text normalization (used for Ablation A8).
    Includes uppercase ratio, exclamation mark frequency, and question mark count.
    """
    raw = str(text)
    length = max(len(raw), 1)
    words = raw.split()
    word_count = max(len(words), 1)
    
    uppercase_chars = sum(1 for c in raw if c.isupper())
    exclamations = raw.count("!")
    questions = raw.count("?")
    
    return {
        "uppercase_ratio": uppercase_chars / length,
        "exclamation_rate": exclamations / word_count,
        "question_rate": questions / word_count,
        "avg_word_length": sum(len(w) for w in words) / word_count,
    }
