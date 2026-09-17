from ai.pipeline import run_research_pipeline


class DummyMessage:
    def __init__(self, content):
        self.content = content


class DummyAgent:
    def __init__(self, content):
        self.content = content

    def invoke(self, payload):
        return {"messages": [DummyMessage(self.content)]}


def test_run_research_pipeline_skips_rag(monkeypatch):
    monkeypatch.setattr(
        "ai.pipeline.build_search_agent",
        lambda: DummyAgent("Search source details"),
    )
    monkeypatch.setattr(
        "ai.pipeline.build_reader_agent",
        lambda: DummyAgent("Reader context details"),
    )
    writer_chain = type("WriterChain", (), {"invoke": lambda self, payload: "This is the final report."})()
    critic_chain = type("CriticChain", (), {"invoke": lambda self, payload: "Score: 8/10"})()

    monkeypatch.setattr(
        "ai.pipeline.writer_chain",
        writer_chain,
    )
    monkeypatch.setattr(
        "ai.pipeline.critic_chain",
        critic_chain,
    )

    result = run_research_pipeline(
        topic="How do birds migrate?",
        user_id="user-1",
        chat_id="chat-1",
    )

    assert "rag" not in result["pipeline"]
    assert "combined_context" in result
    assert result["pipeline"]["search"] == "completed"
    assert result["pipeline"]["reader"] == "completed"
    assert result["pipeline"]["writer"] == "completed"
    assert result["pipeline"]["critic"] == "completed"
    assert result["critic_score"] == 8
