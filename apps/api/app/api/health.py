from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "supportsignal-api",
        "version": "0.1.0",
        "notice": (
            "SupportSignal is an intelligence layer on top of existing support channels. "
            "It classifies and prioritizes; it does not replace human review or a full helpdesk."
        ),
    }
