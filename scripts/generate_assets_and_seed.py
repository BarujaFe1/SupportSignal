"""Generate demo seed CSV and placeholder PNG assets for SupportSignal."""

from __future__ import annotations

import math
import random
import struct
import zlib
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "data" / "seed"
ASSETS = ROOT / "assets"
SHOTS = ASSETS / "screenshots"

TEMPLATES = [
    ("billing", "email", "Cobrança duplicada na fatura", "Fui cobrado duas vezes na assinatura deste mês. Podem corrigir a cobrança?"),
    ("billing", "whatsapp", "Valor diferente do combinado", "O preço na fatura não bate com o plano que contratei. Estou confuso com a cobrança."),
    ("refund", "email", "Pedido de reembolso", "Quero reembolso imediato. O produto não entregou o que foi prometido e vou pedir chargeback."),
    ("refund", "form", "Cancelar assinatura", "Quero cancelar assinatura e receber estorno. É a segunda vez que peço isso."),
    ("bug", "email", "Erro ao salvar relatório", "O botão salvar não funciona e aparece erro 500. Tela branca depois do crash."),
    ("bug", "whatsapp", "App quebrado no mobile", "No celular o fluxo de tickets fica quebrado. Bug crítico para minha operação."),
    ("onboarding", "email", "Como começar?", "Acabei de assinar e não entendi o onboarding. Como configurar o primeiro workspace?"),
    ("onboarding", "form", "Tutorial incompleto", "O primeiro acesso está confuso. Preciso de um tutorial mais claro para começar."),
    ("delivery", "email", "Pedido não chegou", "Minha entrega está com atraso de 5 dias e o rastreio não atualiza."),
    ("delivery", "whatsapp", "Frete parado", "O envio aparece como postado mas não há tracking novo. Pedido não chegou."),
    ("product_clarity", "email", "Feature confusa", "A documentação está confusa. Não está claro como usar automações de SLA."),
    ("product_clarity", "form", "Como usar tags?", "Não entendi como usar tags de causa raiz. Podem explicar melhor a feature?"),
    ("account_access", "email", "Não consigo entrar", "Reset de senha não chega. Estou bloqueado e não consigo entrar na conta."),
    ("account_access", "whatsapp", "Problema de login 2FA", "O 2FA falhou e fiquei sem acesso. Urgente recuperar login."),
    ("other", "email", "Sugestão de integração", "Seria ótimo ter exportação para Notion. Obrigado pelo suporte até aqui."),
    ("other", "form", "Dúvida geral", "Só queria saber o horário de atendimento. Excelente produto no geral."),
]


def write_demo_csv() -> None:
    SEED.mkdir(parents=True, exist_ok=True)
    rng = random.Random(42)
    base = datetime(2026, 6, 1, 9, 0, 0)
    rows = [
        "message_id,channel,subject,body,created_at,first_response_at,resolved_at,"
        "customer_email,customer_name,status"
    ]
    for i in range(240):
        category, channel, subject, body = TEMPLATES[i % len(TEMPLATES)]
        # Inject category keywords already present in templates; add noise occasionally.
        if rng.random() < 0.12:
            body = body + " Estou frustrado com o atendimento."
        if category == "refund" and rng.random() < 0.35:
            body = body + " Isso é inaceitável."
        created = base + timedelta(hours=i * 3 + rng.randint(0, 2), minutes=rng.randint(0, 50))
        status = "open" if rng.random() < 0.28 else "resolved"
        # Some slow responses / missing responses to create SLA breaches.
        if rng.random() < 0.18:
            first = None
            status = "open"
        else:
            delay_h = rng.choice([0.5, 1.5, 3, 6, 12, 30, 40])
            first = created + timedelta(hours=delay_h, minutes=rng.randint(0, 20))
        resolved = None
        if status == "resolved" and first is not None:
            resolved = first + timedelta(hours=rng.randint(1, 48))
        email = f"cliente{i:03d}@exemplo.com"
        name = f"Cliente {i:03d}"
        rows.append(
            ",".join(
                [
                    f"MSG-{i:04d}",
                    channel,
                    f"\"{subject}\"",
                    f"\"{body}\"",
                    created.isoformat(timespec="minutes"),
                    first.isoformat(timespec="minutes") if first else "",
                    resolved.isoformat(timespec="minutes") if resolved else "",
                    email,
                    f"\"{name}\"",
                    status,
                ]
            )
        )
    (SEED / "support_inbox_demo.csv").write_text("\n".join(rows) + "\n", encoding="utf-8")
    print("demo csv rows", len(rows) - 1)


def png(path: Path, w: int, h: int, paint) -> None:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    raw = bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w):
            r, g, b = paint(x, y, w, h)
            raw.extend((r & 255, g & 255, b & 255))
    data = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def lerp(a: float, b: float, t: float) -> int:
    return int(a + (b - a) * t)


def clamp(v: float, lo: int = 0, hi: int = 255) -> int:
    return max(lo, min(hi, int(v)))


def icon_paint(x: int, y: int, w: int, h: int):
    cx, cy = w / 2, h / 2
    dx, dy = x - cx, y - cy
    dist = (dx * dx + dy * dy) ** 0.5
    t = dist / (w * 0.72)
    r = lerp(10, 30, t)
    g = lerp(24, 60, 1 - min(t, 1))
    b = lerp(48, 96, 1 - min(t, 1))
    # Signal bars
    for i, hh in enumerate((0.22, 0.34, 0.48, 0.62)):
        bx0 = int(w * (0.30 + i * 0.1))
        bx1 = bx0 + int(w * 0.06)
        by1 = int(h * 0.72)
        by0 = int(by1 - h * hh)
        if bx0 <= x <= bx1 and by0 <= y <= by1:
            return (56, 189, 248) if i < 3 else (245, 158, 11)
    if 200 < dist < 220:
        return (125, 211, 252)
    return (r, g, b)


def hero_paint(x: int, y: int, w: int, h: int):
    t = x / w
    r = lerp(6, 20, t)
    g = lerp(12, 34, y / h)
    b = lerp(28, 58, t)
    if 40 < y < h - 40 and x < w * 0.30:
        return (clamp(r + 16), clamp(g + 28), clamp(b + 36))
    curve = int(h * 0.60) - int(64 * math.sin(x / 65.0) + 18 * math.sin(x / 21.0))
    if abs(y - curve) < 3:
        return (56, 189, 248)
    if abs(y - curve) < 20:
        return (clamp(r + 8), clamp(g + 20), clamp(b + 30))
    # Risk cards
    for i, color in enumerate(((52, 211, 153), (251, 191, 36), (251, 113, 133))):
        cx = int(w * (0.72 + i * 0.07))
        cy = int(h * 0.30)
        if (x - cx) ** 2 + (y - cy) ** 2 < 20**2:
            return color
    if x % 88 == 0 or y % 68 == 0:
        return (clamp(r + 8), clamp(g + 12), clamp(b + 18))
    return (r, g, b)


def arch_paint(x: int, y: int, w: int, h: int):
    r, g, b = 10, 16, 30
    boxes = [
        (0.04, 0.34, 0.14, 0.32),
        (0.22, 0.34, 0.14, 0.32),
        (0.40, 0.34, 0.14, 0.32),
        (0.58, 0.34, 0.14, 0.32),
        (0.76, 0.34, 0.18, 0.32),
    ]
    for bx, by, bw, bh in boxes:
        x0, x1 = int(bx * w), int((bx + bw) * w)
        y0, y1 = int(by * h), int((by + bh) * h)
        if x0 <= x <= x1 and y0 <= y <= y1:
            if x0 + 3 <= x <= x1 - 3 and y0 + 3 <= y <= y1 - 3:
                return (20, 48, 78)
            return (56, 189, 248)
    if int(h * 0.48) <= y <= int(h * 0.52) and (
        int(0.18 * w) <= x <= int(0.22 * w)
        or int(0.36 * w) <= x <= int(0.40 * w)
        or int(0.54 * w) <= x <= int(0.58 * w)
        or int(0.72 * w) <= x <= int(0.76 * w)
    ):
        return (180, 210, 235)
    return (r, g, b)


def social_paint(x: int, y: int, w: int, h: int):
    t = x / w
    r = lerp(8, 24, t)
    g = lerp(14, 38, y / h)
    b = lerp(28, 64, t)
    curve = int(h * 0.58) - int(30 * math.sin(x / 42.0))
    if abs(y - curve) < 16:
        return (40, 120, 170)
    if abs(y - curve) < 2:
        return (125, 211, 252)
    if x < 90:
        return (16, 36, 58)
    return (r, g, b)


def make_shot(name: str, base: tuple[int, int, int]) -> None:
    br, bg, bb = base

    def paint(x: int, y: int, w: int, h: int):
        r = br + (x * 18) // w
        g = bg + (y * 24) // h
        b = bb + ((x + y) * 12) // (w + h)
        if y < 48:
            return (clamp(r + 12), clamp(g + 16), clamp(b + 22))
        if 70 < y < 170 and 40 < x < w - 40:
            return (clamp(r + 28), clamp(g + 34), clamp(b + 40))
        if 200 < y < 520 and 40 < x < int(w * 0.62):
            sy = 360 - int(36 * math.sin(x / 32.0))
            if abs(y - sy) < 16:
                return (56, 189, 248)
            return (clamp(r + 8), clamp(g + 12), clamp(b + 18))
        if 200 < y < 520 and int(w * 0.66) < x < w - 40:
            return (clamp(r + 16), clamp(g + 20), clamp(b + 26))
        return (clamp(r), clamp(g), clamp(b))

    png(SHOTS / name, 1400, 860, paint)


def main() -> None:
    write_demo_csv()
    png(ASSETS / "icon.png", 512, 512, icon_paint)
    png(ASSETS / "hero-cover.png", 1600, 900, hero_paint)
    png(ASSETS / "architecture-pipeline.png", 1400, 700, arch_paint)
    png(ASSETS / "social-preview.png", 1280, 640, social_paint)
    shots = [
        ("01-support-intelligence-cockpit.png", (12, 28, 48)),
        ("02-topic-classifier.png", (14, 30, 52)),
        ("03-sla-dashboard.png", (16, 32, 54)),
        ("04-refund-risk-board.png", (18, 26, 44)),
        ("05-root-cause-explorer.png", (12, 24, 42)),
        ("06-weekly-support-memo.png", (15, 28, 50)),
        ("07-action-backlog.png", (18, 30, 52)),
        ("08-message-import.png", (14, 26, 46)),
    ]
    for name, base in shots:
        make_shot(name, base)
    print("assets written")
    for p in sorted(ASSETS.rglob("*.png")):
        print(p.relative_to(ROOT), p.stat().st_size)


if __name__ == "__main__":
    main()
