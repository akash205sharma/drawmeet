from langchain_google_genai import ChatGoogleGenerativeAI
from config import GOOGLE_API_KEY

from schemas import DiagramResponse
from schemas import SummaryResponse

from prompts.diagram_prompt import DIAGRAM_PROMPT
from prompts.summary_prompt import SUMMARY_PROMPT

llm = ChatGoogleGenerativeAI(

    model="gemini-2.5-flash",

    google_api_key=GOOGLE_API_KEY,

    temperature=0.2,
)


diagram_chain = (
    DIAGRAM_PROMPT
    | llm.with_structured_output(DiagramResponse)
)


summary_chain = (
    SUMMARY_PROMPT
    | llm.with_structured_output(SummaryResponse)
)