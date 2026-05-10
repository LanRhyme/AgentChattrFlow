# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec for agentchattr desktop app.

Build with:
    pyinstaller agentchattr.spec

Output: dist/agentchattr/agentchattr.exe
"""

import sys
from pathlib import Path

ROOT = Path(SPECPATH)

a = Analysis(
    [str(ROOT / 'desktop.py')],
    pathex=[str(ROOT)],
    binaries=[],
    datas=[
        (str(ROOT / 'static'), 'static'),
        (str(ROOT / 'session_templates'), 'session_templates'),
        (str(ROOT / 'config.toml'), '.'),
        (str(ROOT / 'VERSION'), '.'),
    ],
    hiddenimports=[
        'app',
        'agents',
        'config_loader',
        'jobs',
        'mcp_bridge',
        'mcp_identity',
        'mcp_proxy',
        'registry',
        'router',
        'rules',
        'session_engine',
        'session_store',
        'store',
        'schedules',
        'summaries',
        'uvicorn',
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'fastapi',
        'starlette',
        'websockets',
        'httpx',
        'webview',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='agentchattr',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    icon=str(ROOT / 'static' / 'favicon.ico') if (ROOT / 'static' / 'favicon.ico').exists() else None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='agentchattr',
)
