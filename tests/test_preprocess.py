import pytest
from ml.preprocess import clean_text, preprocess, extract_stylistic_features

def test_clean_text_removes_urls_and_html():
    raw = "Breaking! Visit https://example.com/news or <a href='test'>Click Here</a> for details!"
    cleaned = clean_text(raw)
    assert "https" not in cleaned
    assert "example" not in cleaned
    assert "href" not in cleaned
    assert "click here" in cleaned

def test_clean_text_lowercases_and_strips_punctuation():
    raw = "SHOCKING: Government Official's Statement [Confirmed]!"
    cleaned = clean_text(raw)
    assert cleaned.islower()
    assert "shocking government official s statement confirmed" == cleaned

def test_preprocess_pipeline():
    raw = "Breaking: The president is addressing the nations in Washington today!"
    # With stopwords and lemmatization
    processed = preprocess(raw, lemmatize=True, remove_stop=True)
    tokens = processed.split()
    assert "president" in tokens
    assert "the" not in tokens  # Stopword removed
    assert len(processed) > 0

def test_extract_stylistic_features():
    raw = "BREAKING NEWS!!! Are you sure? Click now."
    features = extract_stylistic_features(raw)
    assert features["uppercase_ratio"] > 0
    assert features["exclamation_rate"] > 0
    assert features["question_rate"] > 0
