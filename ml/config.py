from pathlib import Path

# Paths
ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "WELFake_Dataset.csv"
PROCESSED = ROOT / "data" / "processed"
MODELS = ROOT / "models"
REPORTS = ROOT / "reports"
NLTK_DATA = ROOT / "ml" / "nltk_data"

# Reproducibility & Model Hyperparameters
SEED = 42
TEST_SIZE = 0.20
MAX_CHARS = 3000
SERVING_SAMPLE = 8_000  # Number of stratified articles in the live retrieval index

# Class Label Mapping (WELFake official paper: 0 = Real, 1 = Fake)
LABEL_MAP = {0: "Real", 1: "Fake"}
INV_LABEL_MAP = {"Real": 0, "Fake": 1}
