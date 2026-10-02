import re

# Pre-compiled regular expressions for high-throughput cleaning
URL_PATTERN = re.compile(r"https?://\S+|www\.\S+")
HTML_PATTERN = re.compile(r"<.*?>")
EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
NON_ALPHA_PATTERN = re.compile(r"[^a-z\s]")
WHITESPACE_PATTERN = re.compile(r"\s+")

# Standard 198 NLTK English stopwords embedded statically to eliminate 30MB+ NLTK dependency at runtime
STOP_WORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'ain', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
    "aren't", 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'couldn', "couldn't", 'd', 'did', 'didn', "didn't", 'do', 'does', 'doesn', "doesn't", 'doing', 'don',
    "don't", 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn', "hadn't", 'has', 'hasn',
    "hasn't", 'have', 'haven', "haven't", 'having', 'he', "he'd", "he'll", "he's", 'her', 'here', 'hers',
    'herself', 'him', 'himself', 'his', 'how', 'i', "i'd", "i'll", "i'm", "i've", 'if', 'in', 'into', 'is',
    'isn', "isn't", 'it', "it'd", "it'll", "it's", 'its', 'itself', 'just', 'll', 'm', 'ma', 'me', 'mightn',
    "mightn't", 'more', 'most', 'mustn', "mustn't", 'my', 'myself', 'needn', "needn't", 'no', 'nor', 'not',
    'now', 'o', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over',
    'own', 're', 's', 'same', 'shan', "shan't", 'she', "she'd", "she'll", "she's", 'should', "should've",
    'shouldn', "shouldn't", 'so', 'some', 'such', 't', 'than', 'that', "that'll", 'the', 'their', 'theirs',
    'them', 'themselves', 'then', 'there', 'these', 'they', "they'd", "they'll", "they're", "they've", 'this',
    'those', 'through', 'to', 'too', 'under', 'until', 'up', 've', 'very', 'was', 'wasn', "wasn't", 'we',
    "we'd", "we'll", "we're", "we've", 'were', 'weren', "weren't", 'what', 'when', 'where', 'which', 'while',
    'who', 'whom', 'why', 'will', 'with', 'won', "won't", 'wouldn', "wouldn't", 'y', 'you', "you'd", "you'll",
    "you're", "you've", 'your', 'yours', 'yourself', 'yourselves'
}

LEMMATIZER = None
STEMMER = None

try:
    from nltk.stem import WordNetLemmatizer, PorterStemmer
    LEMMATIZER = WordNetLemmatizer()
    STEMMER = PorterStemmer()
except Exception:
    LEMMATIZER = None
    STEMMER = None

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
