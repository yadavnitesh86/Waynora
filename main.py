import os
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

import logfire
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

from app.agents.Deep_agent.travel_agent import ask, build_agent
from app.api.model import AskRequest, AskResponse

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware

logfire.configure(token=os.getenv("LOGFIRE_TOKEN"))


def get_checkpointer_db_path() -> str:
    db_path = "app/db/checkpoints.db"

    Path(db_path).parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    return db_path


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with AsyncSqliteSaver.from_conn_string(
        get_checkpointer_db_path()
    ) as checkpointer:
        app.state.agent = await build_agent(checkpointer)
        yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/ask", response_model=AskResponse)
async def ask_endpoint(body: AskRequest, request: Request):
    thread_id = body.thread_id or str(uuid.uuid4())
    try:
        answer = await ask(request.app.state.agent, body.question, thread_id)
    except Exception as e:
        logfire.error(f"Agent error (thread_id={thread_id}) as {e}")
        raise HTTPException(
            status_code=500, detail="Something went wrong. Please try again."
        )
    return AskResponse(answer=answer, thread_id=thread_id)

@app.get("/health")
async def health_check():
    return {"status": "ok"}