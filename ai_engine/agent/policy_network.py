"""
Custom CNN + MLP policy network for the city expansion RL agent.
Registered with SB3 via policy_kwargs if torch is available.
"""

try:
    import torch
    import torch.nn as nn
    import numpy as np
    from stable_baselines3.common.torch_layers import BaseFeaturesExtractor

    class CityPlannerCNN(BaseFeaturesExtractor):
        """
        Observation: (64, 64, 8) → reshape to (8, 64, 64) for conv layers.
        Output: 512-dim feature vector fed to shared actor-critic MLP.
        """

        def __init__(self, observation_space, features_dim: int = 512):
            super().__init__(observation_space, features_dim)
            n_input_channels = observation_space.shape[-1]  # 8

            self.cnn = nn.Sequential(
                nn.Conv2d(n_input_channels, 32, kernel_size=3, stride=1, padding=1),
                nn.ReLU(),
                nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1),
                nn.ReLU(),
                nn.Conv2d(64, 64, kernel_size=3, stride=2, padding=1),
                nn.ReLU(),
                nn.AdaptiveAvgPool2d(1),
                nn.Flatten(),
            )

        def forward(self, obs: torch.Tensor) -> torch.Tensor:
            # obs: (batch, H, W, C) → (batch, C, H, W)
            x = obs.permute(0, 3, 1, 2)
            return self.cnn(x)

    POLICY_KWARGS = {
        "features_extractor_class": CityPlannerCNN,
        "features_extractor_kwargs": {"features_dim": 512},
        "net_arch": [{"pi": [512, 256], "vf": [512, 256]}],
    }

except ImportError:
    POLICY_KWARGS = {}
