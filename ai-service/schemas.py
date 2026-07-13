from typing import Literal, Union

from pydantic import BaseModel, Field


# -------------------------
# Shape
# -------------------------

class ShapePayload(BaseModel):
    shape: Literal["rectangle"] = "rectangle"

    x: float
    y: float

    width: float
    height: float

    color: str = "#90CAF9"


# -------------------------
# Text
# -------------------------

class TextPayload(BaseModel):
    x: float
    y: float

    text: str


# -------------------------
# Arrow
# -------------------------

class ArrowPayload(BaseModel):
    points: list[float] = Field(
        min_length=4
    )

    color: str = "#222222"

    strokeWidth: int = 3


# -------------------------
# Action
# -------------------------

class ShapeAction(BaseModel):
    type: Literal["shape"]

    payload: ShapePayload


class TextAction(BaseModel):
    type: Literal["text"]

    payload: TextPayload


class ArrowAction(BaseModel):
    type: Literal["arrow"]

    payload: ArrowPayload


BoardAction = Union[
    ShapeAction,
    TextAction,
    ArrowAction,
]


class DiagramResponse(BaseModel):
    actions: list[BoardAction]

class DiagramRequest(BaseModel):
    prompt: str


class SummaryRequest(BaseModel):
    board: str


class SummaryResponse(BaseModel):
    summary: str