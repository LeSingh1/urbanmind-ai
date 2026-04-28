import logging
from config import settings

logger = logging.getLogger(__name__)

PROMPT_TEMPLATE = """You are an urban planning expert explaining an AI city simulation decision.
Zone type '{zone_type}' was placed at location ({x},{y}) in {city_name}.
Nearby zones: {surrounding_context}.
City metrics changed by: {metrics_delta}.
Scenario goal: {scenario_goal}.
Explain this decision in 2-3 sentences for a non-expert audience.
Be specific about spatial relationships and tradeoffs."""


async def get_explanation(
    zone_type: str,
    x: int,
    y: int,
    city_name: str,
    surrounding_context: str,
    metrics_delta: dict,
    scenario_goal: str,
) -> str:
    delta_str = ", ".join(f"{k}: {v:+.2f}" if isinstance(v, float) else f"{k}: {v}" for k, v in metrics_delta.items())

    prompt = PROMPT_TEMPLATE.format(
        zone_type=zone_type,
        x=x,
        y=y,
        city_name=city_name,
        surrounding_context=surrounding_context,
        metrics_delta=delta_str or "minimal change",
        scenario_goal=scenario_goal,
    )

    if not settings.anthropic_api_key:
        return _fallback_explanation(zone_type, x, y, city_name, surrounding_context, scenario_goal)

    try:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        message = await client.messages.create(
            model=settings.claude_model,
            max_tokens=150,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text
    except Exception as e:
        logger.warning(f"Claude API error: {e}. Using fallback explanation.")
        return _fallback_explanation(zone_type, x, y, city_name, surrounding_context, scenario_goal)


def _fallback_explanation(
    zone_type: str,
    x: int,
    y: int,
    city_name: str,
    surrounding_context: str,
    scenario_goal: str,
) -> str:
    zone_descriptions = {
        "RES_LOW": "low-density residential housing to accommodate growing suburban demand",
        "RES_MED": "medium-density apartments to balance housing supply near transit corridors",
        "RES_HIGH": "high-rise residential towers to maximize housing capacity near the city core",
        "COM_RETAIL": "retail commercial space to serve the surrounding residential population",
        "COM_OFFICE": "office space to create employment centers accessible by transit",
        "IND_LIGHT": "light industrial space for manufacturing jobs away from residential areas",
        "IND_HEAVY": "heavy industrial facilities sited downwind with adequate buffer zones",
        "MIX_USE": "mixed-use development combining retail, residential, and office uses",
        "GREEN_PARK": "a public park to provide green space and improve quality of life",
        "GREEN_FOREST": "protected forest land preserving ecological value and air quality",
        "HEALTH_CLINIC": "a health clinic to improve healthcare access for nearby residents",
        "HEALTH_HOSP": "a hospital to anchor the district's healthcare infrastructure",
        "EDU_SCHOOL": "a school to serve the growing residential population",
        "EDU_UNIVERSITY": "a university to drive economic growth and attract skilled workers",
        "INFRA_POWER": "a power substation to support the energy demands of nearby development",
        "INFRA_WATER": "water infrastructure to meet the utility needs of the growing city",
        "TRANS_HUB": "a transit hub to reduce car dependence and improve mobility",
        "TRANS_HIGHWAY": "a highway connection to improve regional accessibility",
        "SAFETY_FIRE": "a fire station to ensure emergency services coverage",
        "SAFETY_POLICE": "a police station to maintain public safety in the district",
    }

    desc = zone_descriptions.get(zone_type, f"a {zone_type.lower().replace('_', ' ')} zone")
    return (
        f"The AI placed {desc} at grid position ({x}, {y}) in {city_name}. "
        f"This location was selected based on proximity to {surrounding_context or 'existing infrastructure'}, "
        f"optimizing for the {scenario_goal} scenario goals."
    )
