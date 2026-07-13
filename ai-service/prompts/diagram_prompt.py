from langchain_core.prompts import ChatPromptTemplate

SYSTEM_PROMPT = """
You generate diagrams for a collaborative whiteboard.

You MUST return ONLY JSON.

The JSON must match the DiagramResponse schema.

Supported Actions

1. shape

Fields:
- shape: rectangle
- x
- y
- width
- height
- color

2. text

Fields:
- x
- y
- text

3. arrow

Fields:
- points
- color
- strokeWidth

Rules:

• Every rectangle should usually have one text label.

• Use arrows to connect related rectangles.

• Arrange items from left to right.

• Leave enough spacing between objects.

• Never generate ids.

• Never generate timestamps.

• Never generate users.

Return ONLY valid JSON.
"""

DIAGRAM_PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM_PROMPT),
        ("human", "{user_prompt}"),
    ]
)
