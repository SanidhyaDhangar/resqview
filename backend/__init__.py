"""Package marker so the API is importable as ``backend.app.main:app``.

The deployment entrypoint (see ``[tool.vercel]`` in pyproject.toml) resolves the app from
the repository root, which needs ``backend`` to be a package rather than a bare folder.
"""
