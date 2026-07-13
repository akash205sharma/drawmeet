from fastapi import APIRouter, HTTPException
from schemas import (
    SummaryRequest,
    SummaryResponse,
    DiagramRequest,
    DiagramResponse
)

from chains import (
    diagram_chain,
    summary_chain,
)

router = APIRouter()


@router.post(
    "/generate",
    response_model=DiagramResponse,
)
async def generate_diagram(
    request: DiagramRequest,
) -> DiagramResponse:

    try:

        result: DiagramResponse = await diagram_chain.ainvoke(
            {
                "user_prompt": request.prompt,
            }
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )



@router.post(
    "/summarize",
    response_model=SummaryResponse,
)
async def summarize_board(request: SummaryRequest):

    try:

        result = await summary_chain.ainvoke(
            {
                "board": request.board,
            }
        )

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )