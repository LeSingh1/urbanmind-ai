import numpy as np


def apply_action_mask(logits: np.ndarray, mask: np.ndarray, neg_inf: float = -1e8) -> np.ndarray:
    """Zero-out logits for invalid actions before softmax sampling."""
    return np.where(mask, logits, neg_inf)


def sample_masked(logits: np.ndarray, mask: np.ndarray) -> int:
    masked = apply_action_mask(logits, mask)
    # Stable softmax
    shifted = masked - np.max(masked)
    exp = np.exp(np.clip(shifted, -500, 0))
    probs = exp / (np.sum(exp) + 1e-10)
    return int(np.random.choice(len(probs), p=probs))
