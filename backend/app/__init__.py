"""ResQView backend — a crisis-triage API.

Layering:  models (schemas) <- engine (triage logic) <- sources (feeds)
           <- routers (HTTP)  <- main (app assembly).
Every layer is swappable behind the same explainable contract.
"""

__version__ = "1.0.0"
