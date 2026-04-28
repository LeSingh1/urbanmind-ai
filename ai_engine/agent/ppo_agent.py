"""
PPO agent wrapper. Uses Stable-Baselines3 when available, falls back to random policy.
The simulation_loop.py uses SPS heuristic by default (no training required).
This file enables optional training via: python -m ai_engine.agent.ppo_agent --train
"""
import logging
import sys
from pathlib import Path

logger = logging.getLogger(__name__)


class PPOAgent:
    def __init__(self, env, model_path: str | None = None):
        self.env = env
        self.model = None
        self._try_load(model_path)

    def _try_load(self, path: str | None):
        try:
            from stable_baselines3 import PPO
            if path and Path(path).exists():
                self.model = PPO.load(path, env=self.env)
                logger.info(f"Loaded PPO model from {path}")
            else:
                self.model = PPO(
                    "MlpPolicy",
                    self.env,
                    verbose=0,
                    learning_rate=3e-4,
                    n_steps=2048,
                    batch_size=64,
                    n_epochs=10,
                    gamma=0.99,
                    gae_lambda=0.95,
                    clip_range=0.2,
                )
        except ImportError:
            logger.warning("stable-baselines3 not installed. Using random policy.")

    def predict(self, obs):
        if self.model is not None:
            action, _ = self.model.predict(obs, deterministic=False)
            return action
        return self.env.action_space.sample()

    def train(self, total_timesteps: int = 100_000, save_path: str = "models/ppo_city"):
        if self.model is None:
            logger.error("No model to train.")
            return
        self.model.learn(total_timesteps=total_timesteps, progress_bar=True)
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        self.model.save(save_path)
        logger.info(f"Model saved to {save_path}")


if __name__ == "__main__":
    import argparse
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from environment.city_env import CityExpansionEnv

    parser = argparse.ArgumentParser()
    parser.add_argument("--train", action="store_true")
    parser.add_argument("--timesteps", type=int, default=100_000)
    parser.add_argument("--save", default="models/ppo_city_agent")
    args = parser.parse_args()

    if args.train:
        env = CityExpansionEnv({}, "BALANCED_SUSTAINABLE")
        agent = PPOAgent(env)
        agent.train(total_timesteps=args.timesteps, save_path=args.save)
