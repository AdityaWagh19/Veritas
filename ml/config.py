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
SERVING_SAMPLE = 15_000  # Number of stratified articles in the live retrieval index

# Class Label Mapping (WELFake: 0 = Fake, 1 = Real)
# Documented and verified against manual samples in Section 6.2 of the project spec
LABEL_MAP = {0: "Fake", 1: "Real"}
INV_LABEL_MAP = {"Fake": 0, "Real": 1}
